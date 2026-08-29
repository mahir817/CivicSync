# CivicSync Backend

Backend for the CivicSync project, built with Spring Boot and Gradle.

## Requirements

* Java JDK
* Gradle
* MySQL / XAMPP

## Run the Backend

### 1. Start MySQL

If using XAMPP, open **XAMPP Control Panel** and start **MySQL**.

### 2. Go to the backend directory

```bash
cd backend
```

### 3. Run the application

```bash
gradle bootRun
```

The backend will run at:

```text
http://localhost:8080
```

## Build

To build the project:

```bash
gradle clean build
```

## Database

Make sure MySQL is running and the database configuration in:

```text
src/main/resources/application.properties
```

matches your local MySQL setup.
