FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /src
COPY pom.xml .
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
COPY src/main/java/com/twentysixprojects/patriotassist/patriotassist_gmu/AllData /app/AllData
ENV PROJECT_DATA_PATH=/app/AllData
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
