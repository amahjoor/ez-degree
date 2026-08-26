"""In-memory indexes for O(1) degree visualization lookups."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
ALLDATA_DIR = (
    ROOT
    / "Backend"
    / "patriotassist_gmu"
    / "src"
    / "main"
    / "java"
    / "com"
    / "twentysixprojects"
    / "patriotassist"
    / "patriotassist_gmu"
    / "AllData"
)

_course_by_code: Dict[str, Dict[str, Any]] = {}
_majors_by_id: Dict[str, Dict[str, Any]] = {}
_graph_by_key: Dict[str, Dict[str, Any]] = {}
_built = False


def normalize_code(code: str) -> str:
    return " ".join((code or "").upper().split())


def _code_keys(code: str) -> List[str]:
    normalized = normalize_code(code)
    compact = normalized.replace(" ", "")
    keys = [normalized, compact]
    if normalized not in keys:
        keys.append(normalized)
    return [key for key in keys if key]


def get_course(code: str) -> Optional[Dict[str, Any]]:
    if not code:
        return None
    normalized = normalize_code(code)
    return _course_by_code.get(normalized) or _course_by_code.get(normalized.replace(" ", ""))


def list_majors() -> List[Dict[str, str]]:
    return [
        {"id": major_id, "name": major.get("degree_name", major_id)}
        for major_id, major in _majors_by_id.items()
    ]


def get_major(major_id: str) -> Optional[Dict[str, Any]]:
    return _majors_by_id.get(major_id)


def stats() -> Dict[str, int]:
    return {
        "total_courses": len({course.get("code") for course in _course_by_code.values() if course.get("code")}),
        "total_majors": len(_majors_by_id),
        "cached_graphs": len(_graph_by_key),
    }


def _put_course(course: Dict[str, Any]) -> None:
    code = course.get("code") or course.get("course_code") or ""
    if not code:
        return
    normalized = normalize_code(code)
    record = {
        "code": normalized,
        "title": course.get("title") or course.get("courseName") or "",
        "credits": course.get("credits") or course.get("courseCredits") or "",
        "prerequisites": course.get("prerequisites") or "",
        "corequisites": course.get("corequisites") or "",
        "description": course.get("description") or "",
        "restrictions": course.get("restrictions") or "",
        "notes": course.get("notes") or "",
    }
    existing = get_course(normalized)
    if existing:
        for field in ("title", "credits", "prerequisites", "corequisites", "description", "restrictions", "notes"):
            if not existing.get(field) and record.get(field):
                existing[field] = record[field]
        record = existing
    for key in _code_keys(normalized):
        _course_by_code[key] = record


def _prereq_text(value: Any) -> str:
    if not value or str(value).strip() in {"NoPreReq", "None", "N/A"}:
        return ""
    return str(value)


def _load_courses_from_db() -> None:
    try:
        from database.db import get_session, Course as DbCourse

        db = get_session()
        try:
            for course in db.query(DbCourse).all():
                _put_course(
                    {
                        "code": course.course_code,
                        "title": course.title,
                        "credits": course.credits,
                        "prerequisites": course.prerequisites,
                        "corequisites": course.corequisites,
                        "description": course.description,
                        "restrictions": course.restrictions,
                        "notes": course.notes,
                    }
                )
        finally:
            db.close()
    except Exception as exc:
        print(f"viz_index: database course load skipped: {exc}")


def _load_courses_from_alldata() -> None:
    course_data_dir = ALLDATA_DIR / "CourseData"
    if not course_data_dir.exists():
        return
    for path in course_data_dir.rglob("*.json"):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        groups = payload.values() if isinstance(payload, dict) else payload
        for group in groups:
            if not isinstance(group, list):
                continue
            for course in group:
                if not isinstance(course, dict):
                    continue
                _put_course(
                    {
                        "code": course.get("courseTitle") or course.get("Code") or "",
                        "title": course.get("courseName") or course.get("Title") or "",
                        "credits": course.get("courseCredits") or course.get("Credits") or "",
                        "prerequisites": _prereq_text(course.get("preRequisite") or course.get("Prerequisites")),
                        "corequisites": _prereq_text(course.get("coRequisite") or course.get("Corequisites")),
                    }
                )


def _as_course(item: Dict[str, Any]) -> Dict[str, Any]:
    credits = item.get("Credits", 0)
    try:
        credits_value: Any = float(credits)
    except (TypeError, ValueError):
        credits_value = credits
    return {
        "code": item.get("Code", ""),
        "title": item.get("Title", ""),
        "credits": credits_value,
        "alternatives": [],
    }


def _flatten_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    courses: List[Dict[str, Any]] = []
    for item in items or []:
        if not isinstance(item, dict):
            continue
        if item.get("Code"):
            courses.append(_as_course(item))
            continue
        nested = _flatten_items(item.get("Items", []))
        operator = (item.get("Operator") or "").upper()
        if operator == "OR" and nested:
            primary = nested[0]
            alternatives = []
            for extra in nested[1:]:
                try:
                    alt_credits = float(extra.get("credits") or 0)
                except (TypeError, ValueError):
                    alt_credits = 0.0
                alternatives.append(
                    {
                        "alternative_code": extra.get("code", ""),
                        "alternative_title": extra.get("title", ""),
                        "alternative_credits": alt_credits,
                    }
                )
                alternatives.extend(extra.get("alternatives") or [])
            primary["alternatives"] = alternatives
            courses.append(primary)
        else:
            courses.extend(nested)
    return courses


def _slug_major_id(name: str) -> str:
    slug = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", name)
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", slug)
    return slug.strip("_").lower()


def _display_major_name(stem: str) -> str:
    pretty = re.sub(r"([a-z])([A-Z])", r"\1 \2", stem)
    return pretty.replace("_", " ")


def _load_majors_from_json_dir() -> None:
    requirements_dir = DATA_DIR / "majorRequirements"
    if not requirements_dir.exists():
        return
    for path in requirements_dir.glob("*.json"):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        major_id = path.stem.replace("_requirements", "").lower()
        if "id" in payload and "code" not in payload:
            pass
        _majors_by_id[major_id] = payload


def _load_majors_from_alldata() -> None:
    degree_dir = ALLDATA_DIR / "DegreeRequirements"
    if not degree_dir.exists():
        return
    for path in degree_dir.glob("*.json"):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not isinstance(payload, dict):
            continue
        major_id = _slug_major_id(path.stem)
        categories = []
        total_credits = 0.0
        for category_name, category in payload.items():
            if not isinstance(category, dict):
                continue
            credits = category.get("CreditsRequired", 0) or 0
            try:
                total_credits += float(credits)
            except (TypeError, ValueError):
                pass
            requirements = category.get("Requirements") or {}
            courses = _flatten_items(requirements.get("Items", []))
            categories.append(
                {
                    "name": category_name,
                    "total_credits": credits,
                    "courses": courses,
                }
            )
        _majors_by_id[major_id] = {
            "degree_name": _display_major_name(path.stem),
            "total_credits": total_credits,
            "categories": categories,
            "concentrations": [],
        }


def _enrich_course(course: Dict[str, Any]) -> Dict[str, Any]:
    code = course.get("code") or course.get("id") or ""
    indexed = get_course(code) or {}
    credits = indexed.get("credits", course.get("credits", ""))
    return {
        **course,
        "code": normalize_code(code) or code,
        "id": normalize_code(code) or code,
        "title": indexed.get("title") or course.get("title", ""),
        "credits": credits,
        "prerequisites": indexed.get("prerequisites", ""),
        "corequisites": indexed.get("corequisites", ""),
        "description": indexed.get("description", ""),
        "restrictions": indexed.get("restrictions", ""),
        "notes": indexed.get("notes", ""),
        "alternatives": course.get("alternatives", []),
    }


def _enrich_major(major: Dict[str, Any], concentration_id: Optional[str] = None) -> Dict[str, Any]:
    enriched_categories = []
    for category in major.get("categories", []):
        enriched_categories.append(
            {
                **category,
                "courses": [_enrich_course(course) for course in category.get("courses", [])],
            }
        )

    enriched_concentrations = []
    for concentration in major.get("concentrations", []):
        if concentration_id and concentration.get("id") != concentration_id:
            continue
        enriched_conc_categories = []
        for category in concentration.get("categories", []):
            enriched_conc_categories.append(
                {
                    **category,
                    "courses": [_enrich_course(course) for course in category.get("courses", [])],
                }
            )
        enriched_concentrations.append({**concentration, "categories": enriched_conc_categories})

    if concentration_id and not enriched_concentrations and major.get("concentrations"):
        raise KeyError(concentration_id)

    return {
        **major,
        "categories": enriched_categories,
        "concentrations": enriched_concentrations,
        "optimization_info": {
            "pre_enriched": True,
            "course_dependencies_resolved": True,
            "lookup": "O(1)",
        },
    }


def get_major_visualization(major_id: str, concentration_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    cache_key = f"{major_id}::{concentration_id or ''}"
    cached = _graph_by_key.get(cache_key)
    if cached is not None:
        return cached
    major = _majors_by_id.get(major_id)
    if not major:
        return None
    payload = _enrich_major(major, concentration_id)
    _graph_by_key[cache_key] = payload
    return payload


def comprehensive_payload() -> Dict[str, Any]:
    index_stats = stats()
    return {
        "majors": list_majors(),
        "course_dependencies": {},
        "degree_requirements": {
            major_id: {"concentrations": major.get("concentrations", [])}
            for major_id, major in _majors_by_id.items()
        },
        "metadata": {
            "scraped_at": None,
            "total_majors": index_stats["total_majors"],
            "total_courses": index_stats["total_courses"],
            "api_version": "2.0-index",
            "lookup": "O(1)",
        },
    }


def build() -> None:
    global _built
    if _built:
        return
    _load_courses_from_alldata()
    _load_courses_from_db()
    _load_majors_from_json_dir()
    _load_majors_from_alldata()
    _built = True
    print(f"viz_index: ready with {stats()}")
