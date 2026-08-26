# syntax=docker/dockerfile:1

FROM maven:3.9-eclipse-temurin-17 AS java-build
WORKDIR /src
COPY Backend/patriotassist_gmu/pom.xml .
COPY Backend/patriotassist_gmu/src ./src
RUN mvn -q -DskipTests package \
    && cp target/patriotassist_gmu-0.0.1-SNAPSHOT.jar /tmp/app.jar

FROM node:20-alpine AS web-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
COPY data ./data
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM eclipse-temurin:17-jammy
WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip python3-venv curl ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-api.txt /app/requirements-api.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /app/requirements-api.txt || pip3 install --no-cache-dir -r /app/requirements-api.txt

COPY --from=java-build /tmp/app.jar /app/app.jar
COPY Backend/patriotassist_gmu/src/main/java/com/twentysixprojects/patriotassist/patriotassist_gmu/AllData /app/AllData
COPY api /app/api
COPY database /app/database
COPY scrapers /app/scrapers
COPY data /app/data
COPY --from=web-build /app/frontend /app/frontend
COPY --from=web-build /app/data /app/data
COPY deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PYTHONUNBUFFERED=1
ENV PROJECT_DATA_PATH=/app/AllData
ENV JPA_DDL_AUTO=update
ENV PORT=3000
EXPOSE 3000
CMD ["/app/start.sh"]
