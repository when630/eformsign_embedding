# 1. Build Stage
FROM gradle:8.5.0-jdk17 AS builder
WORKDIR /app
COPY . .
# Skip tests to speed up build
RUN ./gradlew clean :api-server:bootJar -x test --no-daemon

# 2. Run Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copy the built jar from the builder stage
# Adjust the path to match the actual output path of bootJar
COPY --from=builder /app/api-server/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
