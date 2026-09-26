# CivicSync

CivicSync connects verified requests for help with local civic and health reporting. The React client is in `civicsync-frontend/`; the Spring Boot API is in `backend/`.

## Run locally

1. Start MySQL and create an empty database named `civicsync`.
2. From `backend/`, run `./gradlew bootRun` (PowerShell: `.\\gradlew.bat bootRun`). The API listens on port 8081 by default. Flyway creates or updates the schema. Development mode seeds sample accounts and campaigns only when the database is empty.
3. From `civicsync-frontend/`, run `npm install` and `npm run dev`. Vite proxies `/api` to port 8081.

See [backend/README.md](backend/README.md) for database, environment, migrations, and test setup, and [civicsync-frontend/README.md](civicsync-frontend/README.md) for client commands.

## Main workflows

- Anyone can browse verified campaigns, civic reports, the map, and health alerts. New campaigns stay private to their requester and qualified reviewers until approved.
- Admins assign verifier roles and category qualifications. Verifiers review requests and outcome evidence only in their qualified categories.
- Monetary support is recorded as an offline contribution. The requester confirms receipt before it increases the campaign's received total. Blood support is a pledge; the app does not process payments.
- Neighbors can confirm a civic report once each, except their own. The reporter or an admin can resolve it. Symptom reports contribute to area alerts without publishing the reporter's identity.
- Accounts have editable profiles, recommendations with visible reasons, a persistent in-app reminder inbox, and English/Bengali interface controls. User-written content remains in its original language.
- Admins review legacy elevated accounts, manage partner categories, and handle disputes.

## Checks

Run `npm run lint` and `npm run build` in the frontend, and `./gradlew test` in the backend. Backend tests use H2; MySQL smoke checks are recommended for migrations and the main flows.
