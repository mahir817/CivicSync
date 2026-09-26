# CivicSync frontend

React, Vite, Tailwind CSS, and Leaflet client for CivicSync.

## Run

From this directory:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The development server proxies `/api` to the Spring Boot server at `http://localhost:8081`. To use a different API origin, set `VITE_API_BASE_URL` to its full `/api` URL. The backend must be running for live lists, authentication, and forms.

## Checks

```bash
npm run lint
npm run build
```

The interface supports English and Bengali through the shared navbar. Account settings store the language, area, interests, and reminder preference. All campaign, map, report, alert, profile, review, inbox, and admin data comes from the backend.

See [Selenium browser checks](../selenium-tests/README.md) for end-to-end workflow tests.
