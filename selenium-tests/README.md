# CivicSync Selenium checks

The full workflow suite covers the shared navbar, English/Bengali switch, map coordinates, registration, verifier approval, offline contribution receipt, nearby blood donors, the donor countdown, civic confirmation limits, and admin dispute handling. It creates accounts and requests, so **run the full suite only against a disposable MySQL database**. The development seed supplies the example verifier, requester, and donor accounts.

## Simple Edge scripts

The three files in `simple/` follow the direct Selenium style of the supplied examples. They open a visible Edge window, find elements with `By`, print results, and use assertions. They only browse or fill a form without submitting it, so they do not create records.

Start the frontend in one PowerShell terminal with `npm.cmd run dev` from `civicsync-frontend/`. In another terminal, run:

```powershell
cd selenium-tests
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe simple\test1.py
.\.venv\Scripts\python.exe simple\test2.py
.\.venv\Scripts\python.exe simple\test3.py
```

`test1.py` checks the landing page and feed link. `test2.py` fills registration fields. `test3.py` opens the navbar at three narrow widths, checks its corners and overflow, and follows a menu link. The scripts use `http://127.0.0.1:5173` by default; set `CIVICSYNC_URL` if Vite prints another port. Set `CIVICSYNC_PAUSE=1` to inspect the browser before each script closes it, or `CIVICSYNC_HEADLESS=1` to hide it. If Selenium Manager cannot obtain EdgeDriver, set `CIVICSYNC_E2E_DRIVER_PATH` to a matching local `msedgedriver.exe`.

## Full workflow suite (Windows PowerShell)

1. Install Java 17, Node.js, Python 3.10+, MySQL, and Microsoft Edge or Chrome.
2. Create an empty throwaway database with a `civicsync_e2e_` prefix, for example `civicsync_e2e_local`. From MySQL: `CREATE DATABASE civicsync_e2e_local;`. Never point the test backend at your normal `civicsync` database.
3. In one PowerShell terminal, start the backend:

   ```powershell
   cd backend
   $env:CIVICSYNC_PROFILE = 'dev'
   $env:CIVICSYNC_DB_URL = 'jdbc:mysql://localhost:3306/civicsync_e2e_local'
   $env:CIVICSYNC_DB_USER = 'root'
   $env:CIVICSYNC_DB_PASSWORD = 'YOUR_LOCAL_PASSWORD'
   $env:CIVICSYNC_SMTP_HOST = ''
   $env:CIVICSYNC_PORT = '8082'
   $env:CIVICSYNC_E2E_MARKER = 'local-e2e-check'
   .\gradlew.bat bootRun
   ```

4. In another terminal, start the frontend:

   ```powershell
   cd civicsync-frontend
   npm.cmd ci
   $env:CIVICSYNC_PROXY_TARGET = 'http://127.0.0.1:8082'
   npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
   ```

5. In a third terminal, install and run the browser checks:

   ```powershell
   cd selenium-tests
   py -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   $env:CIVICSYNC_E2E_ISOLATED_DB = '1'
   $env:CIVICSYNC_E2E_DATABASE = 'civicsync_e2e_local'
   $env:CIVICSYNC_E2E_MARKER = 'local-e2e-check'
   .\.venv\Scripts\python.exe -m pytest -v
   ```

The suite defaults to headless Edge at `http://127.0.0.1:5174`. It asks the development backend which database it is actually connected to and refuses to run unless both the database name and marker match. Use `--browser chrome` for Chrome or `--headed` to watch the browser. Set `CIVICSYNC_E2E_URL` if Vite runs at another URL. Selenium Manager normally finds the matching browser driver; if it cannot download one, set `CIVICSYNC_E2E_DRIVER_PATH` to a matching local `msedgedriver.exe` or `chromedriver.exe`.

Failed tests save screenshots in `selenium-tests/artifacts/`. The directory is ignored by Git. Recreate the disposable database for a clean run, especially if an earlier run stopped midway. Tests use unique account and request names, but the seeded logins are required.

When finished, stop both test servers and drop the disposable database with MySQL (`DROP DATABASE civicsync_e2e_local;`).

The Selenium suite tests visible user journeys. For backend compilation, run `.\gradlew.bat build` in `backend/`; for frontend checks, run `npm run lint` and `npm run build` in `civicsync-frontend/`.
