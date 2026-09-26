# CivicSync backend

Spring Boot 3 API with MySQL, Flyway migrations, JWT authentication, and an H2 test profile.

## Local run

Install Java 17 and start MySQL. Create an empty `civicsync` database, then run `.\gradlew.bat bootRun` from this directory on Windows or `./gradlew bootRun` elsewhere. The API uses `http://localhost:8081/api` by default. Flyway creates the schema; Hibernate validates it at startup.

The default `dev` profile seeds example users and campaigns only when the users table is empty. The example password is `password123`. Seeded accounts include `rafi@example.com` (user), `verifier@pawsshelter.bd` (pet care verifier), and `admin@civicsync.app` (admin). Change these credentials for any shared environment.

## Configuration

Set environment variables before starting the server:

| Variable | Default in dev | Purpose |
|---|---|---|
| `CIVICSYNC_PROFILE` | `dev` | Use `prod` to disable demo seeding |
| `CIVICSYNC_DB_URL` | `jdbc:mysql://localhost:3306/civicsync` | MySQL JDBC URL |
| `CIVICSYNC_DB_USER` | `root` | Database user |
| `CIVICSYNC_DB_PASSWORD` | empty | Database password |
| `CIVICSYNC_JWT_SECRET` | local development secret | JWT signing secret; required in production |
| `CIVICSYNC_PORT` | `8081` | HTTP port |
| `CIVICSYNC_UPLOAD_DIR` | `uploads` | File storage directory |
| `CIVICSYNC_IDENTITY_DIR` | `private-documents` | Private identity document storage; back up and restrict at the filesystem level |
| `CIVICSYNC_SMTP_HOST` | empty | SMTP host; email delivery is disabled until configured |
| `CIVICSYNC_SMTP_PORT` | `587` | SMTP port |
| `CIVICSYNC_SMTP_USER` / `CIVICSYNC_SMTP_PASSWORD` | empty | SMTP credentials |
| `CIVICSYNC_SMTP_AUTH` / `CIVICSYNC_SMTP_STARTTLS` | `true` | SMTP authentication and TLS settings |
| `CIVICSYNC_MAIL_FROM` | `no-reply@civicsync.local` | Sender address accepted by your SMTP service |
| `CIVICSYNC_PUBLIC_BASE_URL` | `http://localhost:5173` | Frontend origin used in email links |
| `CIVICSYNC_BOOTSTRAP_ADMIN_EMAIL` | empty | First production admin email |
| `CIVICSYNC_BOOTSTRAP_ADMIN_PASSWORD` | empty | First production admin password (12+ characters) |

Production requires database and JWT settings from the environment. If there is no admin yet, the two bootstrap admin variables are required. After an admin exists, that account grants verifier and admin roles from the admin screen. Public registration always creates a regular user.

## Existing databases

Flyway scripts in `src/main/resources/db/migration` are additive. For a database created by the older app, Flyway baselines the original schema at version 1, then applies the new columns and tables. Existing monetary donations are treated as already confirmed so historical received totals remain unchanged. Existing verifier and admin roles are retained and flagged for review. Legacy verifiers keep their prior category access until an admin narrows it. V7 adds private identity metadata, verifier codes, donor preferences, and assigned verifiers without requiring new values on existing accounts.

Back up the database before any production migration. Avoid Hibernate schema generation on real data; the default is `validate`.

## API behavior

Public campaign feeds and detail views expose only verified or completed campaigns. Requesters select a qualified verifier by code before posting; the selected verifier receives an in-app assignment and reviews that category's queue. Email alerts are sent after approval to opted-in users within roughly 10 km of a recognized area; if the request area is unknown, all opted-in users are eligible. SMTP must be configured for delivery. Monetary contributions remain pending until the requester confirms offline receipt. Blood support starts as a pledge and never adds to a monetary total. Once the requester confirms an actual blood donation, the donor profile shows an estimated 112-day interval; the donation center determines eligibility. Opted-in donors are listed by blood group and area distance. Civic confirmation is limited to one per other user. Symptom reports power area alert counts without exposing reporters.

Registration accepts multipart `registration` JSON and `identityDocument` (PDF, JPG, or PNG up to 5 MB). Identity files are stored outside the public uploads route and are downloadable only by the owner or an admin. Protect this directory and its backups as sensitive personal data. Public registration cannot create elevated roles.

## Verification

Run `.\gradlew.bat test` (Windows) or `./gradlew test`. The tests use an H2 in-memory database and cover registration roles, public visibility, review limits, receipt confirmation, civic confirmation, outcome review, and disputes. To verify MySQL migration behavior, start the app against a copy of an existing database with `CIVICSYNC_DDL_AUTO=validate`.
