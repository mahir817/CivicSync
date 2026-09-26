"""Browser fixtures for CivicSync's local end-to-end checks."""

import os
import json
import re
import tempfile
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

import pytest
from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.support.ui import WebDriverWait


BASE_URL = os.getenv("CIVICSYNC_E2E_URL", "http://127.0.0.1:5174").rstrip("/")


def pytest_addoption(parser):
    parser.addoption("--browser", choices=("edge", "chrome"), default="edge")
    parser.addoption("--headed", action="store_true", help="Show the browser window")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    setattr(item, "report_" + report.when, report)


@pytest.fixture(scope="session", autouse=True)
def isolated_server():
    if os.getenv("CIVICSYNC_E2E_ISOLATED_DB") != "1":
        pytest.fail(
            "Set CIVICSYNC_E2E_ISOLATED_DB=1 only after starting CivicSync "
            "against a disposable MySQL database (see selenium-tests/README.md)."
        )
    expected_db = os.getenv("CIVICSYNC_E2E_DATABASE", "")
    expected_marker = os.getenv("CIVICSYNC_E2E_MARKER", "")
    if not re.fullmatch(r"civicsync_e2e_[a-z0-9_]+", expected_db) or not expected_marker:
        pytest.fail("Set CIVICSYNC_E2E_DATABASE to a disposable civicsync_e2e_* database "
                    "and CIVICSYNC_E2E_MARKER to the marker used by the test backend.")
    try:
        with urlopen(BASE_URL + "/api/dev/e2e-target", timeout=5) as response:
            target = json.load(response)
    except (URLError, TimeoutError, ValueError) as error:
        pytest.fail(f"Test backend is unavailable through {BASE_URL}: {error}")
    if target.get("database") != expected_db or target.get("marker") != expected_marker:
        pytest.fail(f"Refusing to write: {BASE_URL} points to database "
                    f"{target.get('database')!r}, expected {expected_db!r} with the test marker.")


@pytest.fixture
def browser(request, isolated_server):
    browser_name = request.config.getoption("--browser")
    options = EdgeOptions() if browser_name == "edge" else ChromeOptions()
    if not request.config.getoption("--headed"):
        options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-gpu")
    options.add_argument("--disable-extensions")
    options.add_argument("--no-first-run")
    # A fresh profile keeps tests independent and also makes headless Edge stable on Windows.
    with tempfile.TemporaryDirectory(prefix="civicsync-selenium-") as profile:
        options.add_argument(f"--user-data-dir={profile}")
        driver_path = os.getenv("CIVICSYNC_E2E_DRIVER_PATH")
        service_type = EdgeService if browser_name == "edge" else ChromeService
        service = service_type(executable_path=driver_path) if driver_path else service_type()
        driver = (webdriver.Edge if browser_name == "edge" else webdriver.Chrome)(
            service=service, options=options
        )
        driver.set_window_size(1440, 900)
        driver.set_page_load_timeout(30)
        try:
            yield driver
        finally:
            if getattr(request.node, "report_call", None) and request.node.report_call.failed:
                artifact_dir = Path(__file__).resolve().parent / "artifacts"
                artifact_dir.mkdir(exist_ok=True)
                try:
                    driver.save_screenshot(str(artifact_dir / f"{request.node.name}.png"))
                except WebDriverException:
                    pass
            driver.quit()


@pytest.fixture
def wait(browser):
    return WebDriverWait(browser, 15)
