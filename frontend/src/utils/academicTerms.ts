export type Season = 'Spring' | 'Summer' | 'Fall';

export interface ParsedTerm {
  season: Season;
  year: number;
}

const SEASON_ORDER: Record<Season, number> = { Spring: 1, Summer: 2, Fall: 3 };

export function parseTerm(term: string): ParsedTerm | null {
  const match = String(term || '').trim().match(/^(Spring|Summer|Fall)\s+(\d{4})$/i);
  if (!match) return null;
  const season = (match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()) as Season;
  return { season, year: Number(match[2]) };
}

export function formatTerm(season: Season, year: number): string {
  return `${season} ${year}`;
}

/** GMU-style seasons: Spring Jan–Apr, Summer May–Jul, Fall Aug–Dec. */
export function getCurrentAcademicTerm(date = new Date()): ParsedTerm {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month <= 3) return { season: 'Spring', year };
  if (month <= 6) return { season: 'Summer', year };
  return { season: 'Fall', year };
}

/** Fall year that starts the current academic year. */
export function getAcademicYearStartFall(date = new Date()): number {
  const current = getCurrentAcademicTerm(date);
  return current.season === 'Fall' ? current.year : current.year - 1;
}

export function compareCatalogTerms(a: string, b: string): number {
  const parsedA = parseTerm(a);
  const parsedB = parseTerm(b);
  if (!parsedA && !parsedB) return a.localeCompare(b);
  if (!parsedA) return 1;
  if (!parsedB) return -1;
  if (parsedA.year !== parsedB.year) return parsedA.year - parsedB.year;
  return SEASON_ORDER[parsedA.season] - SEASON_ORDER[parsedB.season];
}

export function sortCatalogTerms(terms: string[]): string[] {
  return [...terms].sort(compareCatalogTerms);
}

function yearDelta(catalogTerms: string[], date = new Date()): number {
  const years = catalogTerms
    .map(parseTerm)
    .filter((term): term is ParsedTerm => term !== null)
    .map(term => term.year);
  if (!years.length) return 0;
  return getCurrentAcademicTerm(date).year - Math.max(...years);
}

/** Label a Patriot Web dump term with the current academic year (Fall 2025 → Fall 2026). */
export function displayCatalogTerm(
  catalogTerm: string,
  catalogTerms: string[] = [catalogTerm],
  date = new Date()
): string {
  const parsed = parseTerm(catalogTerm);
  if (!parsed) return catalogTerm;
  return formatTerm(parsed.season, parsed.year + yearDelta(catalogTerms, date));
}

export function pickDefaultCatalogTerm(catalogTerms: string[], date = new Date()): string {
  const sorted = sortCatalogTerms(catalogTerms);
  if (!sorted.length) return '';
  const current = getCurrentAcademicTerm(date);
  const sameSeason = sorted.filter(term => parseTerm(term)?.season === current.season);
  if (sameSeason.length) return sameSeason[sameSeason.length - 1];
  return sorted[sorted.length - 1];
}

export function fourYearPlanYears(date = new Date()): Array<{
  yearIndex: number;
  label: string;
  semesters: Array<{ name: Season; label: string }>;
}> {
  const startFall = getAcademicYearStartFall(date);
  return [1, 2, 3, 4].map(yearIndex => {
    const fallYear = startFall + yearIndex - 1;
    return {
      yearIndex,
      label: `${fallYear}–${fallYear + 1}`,
      semesters: [
        { name: 'Fall', label: `Fall ${fallYear}` },
        { name: 'Spring', label: `Spring ${fallYear + 1}` },
        { name: 'Summer', label: `Summer ${fallYear + 1}` },
      ],
    };
  });
}

export function plannerSlotFromTerm(term: string, date = new Date()): { year: number; semester: string } | null {
  const parsed = parseTerm(term);
  if (!parsed) return null;
  const startFall = getAcademicYearStartFall(date);
  let yearIndex: number;
  if (parsed.season === 'Fall') {
    yearIndex = parsed.year - startFall + 1;
  } else if (parsed.season === 'Spring') {
    yearIndex = parsed.year - startFall;
  } else {
    yearIndex = parsed.year - startFall;
  }
  yearIndex = Math.min(4, Math.max(1, yearIndex));
  return { year: yearIndex, semester: parsed.season };
}

export function plannerSlotFromCatalogTerm(
  catalogTerm: string,
  catalogTerms: string[] = [catalogTerm],
  date = new Date()
): { year: number; semester: string } | null {
  return plannerSlotFromTerm(displayCatalogTerm(catalogTerm, catalogTerms, date), date);
}
