#!/bin/bash
set -eu

# Fly Postgres injects postgres://; Spring wants JDBC and SQLAlchemy wants postgresql://.
FLY_DATABASE_URL="${DATABASE_URL:-}"
if [ -n "$FLY_DATABASE_URL" ]; then
  python3 - <<'PY'
import os
from urllib.parse import urlparse, unquote
raw = os.environ.get("DATABASE_URL", "")
parsed = urlparse(raw)
if parsed.scheme.startswith("postgres"):
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432
    db = (parsed.path or "/grad_dev").lstrip("/")
    user = unquote(parsed.username or "postgres")
    password = unquote(parsed.password or "")
    ssl = "require" if "sslmode=disable" not in (parsed.query or "") else "disable"
    def sh_quote(value: str) -> str:
        return "'" + value.replace("'", "'\"'\"'") + "'"
    with open("/tmp/db.env", "w") as fh:
        fh.write(f"export SPRING_DATASOURCE_URL={sh_quote(f'jdbc:postgresql://{host}:{port}/{db}?sslmode={ssl}')}\n")
        fh.write(f"export SPRING_DATASOURCE_USERNAME={sh_quote(user)}\n")
        fh.write(f"export SPRING_DATASOURCE_PASSWORD={sh_quote(password)}\n")
print("Wrote Spring datasource env from DATABASE_URL")
PY
  # shellcheck disable=SC1091
  [ -f /tmp/db.env ] && . /tmp/db.env
fi

export PROJECT_DATA_PATH="${PROJECT_DATA_PATH:-/app/AllData}"
export JPA_DDL_AUTO="${JPA_DDL_AUTO:-update}"
export JWT_EXPIRATION="${JWT_EXPIRATION:-604800000}"
export FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3000}"
export FRONTEND_ORIGINS="${FRONTEND_ORIGINS:-${FRONTEND_URL}}"
export JAVA_BACKEND_URL="${JAVA_BACKEND_URL:-http://127.0.0.1:8080}"
export PYTHON_API_URL="${PYTHON_API_URL:-http://127.0.0.1:8000}"
export DEMO_USERNAME="${DEMO_USERNAME:-judge}"
export DEMO_PASSWORD="${DEMO_PASSWORD:-MasonPride2026}"

echo "Starting frontend..."
cd /app/frontend
npx next start -H 0.0.0.0 -p 3000 &
WEB_PID=$!
cd /app

echo "Starting Java backend..."
java -XX:MaxRAMPercentage=45.0 -jar /app/app.jar &
JAVA_PID=$!

echo "Starting Python API..."
# Fly DATABASE_URL is the app's empty Postgres. Python's catalog lives on the
# existing course DB, so do not point uvicorn at Fly's URL unless overridden.
if [ -n "${PYTHON_DATABASE_URL:-}" ]; then
  DATABASE_URL="$PYTHON_DATABASE_URL" uvicorn api.main:app --host 127.0.0.1 --port 8000 &
else
  env -u DATABASE_URL uvicorn api.main:app --host 127.0.0.1 --port 8000 &
fi
PY_PID=$!

term() {
  kill "$JAVA_PID" "$PY_PID" "$WEB_PID" 2>/dev/null || true
}
trap term INT TERM

# Stay up as long as Next.js is running so Fly health checks keep passing.
wait "$WEB_PID"
status=$?
term
wait || true
exit "$status"
