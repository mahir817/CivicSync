# CivicSync Backend — Gradle Edition (Groovy DSL)

Same code as the Maven version — Auth (JWT) + Campaign CRUD/verification, H2 in-memory DB —
just built with Gradle instead of Maven, using Groovy syntax (`build.gradle`, not `.kts`).
Nothing about the Java code changed, only the build tool.

## One-time setup: generate the Gradle wrapper

This project ships without `gradlew` because it couldn't be generated in the sandbox that built it
(no internet access to Gradle's distribution servers there). Do this once, on your own machine,
with Gradle installed:

```bash
cd backend-gradle
gradle wrapper --gradle-version 8.8
```

This creates `gradlew`, `gradlew.bat`, and the `gradle/wrapper/` folder. After that, use `./gradlew`
for everything below and you won't need Gradle installed globally anymore.

Don't have Gradle installed at all? Install it first:
- macOS: `brew install gradle`
- Windows: `choco install gradle` or download from gradle.org
- Linux: use [SDKMAN](https://sdkman.io/): `sdk install gradle`

## Running it

```bash
./gradlew bootRun
```

Runs on `http://localhost:8080`, same as the Maven version. H2 console at `/h2-console`
(JDBC URL: `jdbc:h2:mem:civicsync`, user `sa`, no password).

## Building a jar

```bash
./gradlew build
java -jar build/libs/civicsync-backend-0.1.0.jar
```

## Why Gradle here, if you want to explain the switch in a review
Gradle uses a build script (`build.gradle.kts`) instead of XML (`pom.xml`) — same dependencies,
same Spring Boot version, same behavior. Gradle tends to build faster (incremental builds, caching)
and is what most modern Spring Boot + Android-adjacent teams default to today, but Maven is equally
valid — this is a tooling preference, not a functional change to the app.
