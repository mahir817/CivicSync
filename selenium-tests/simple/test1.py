"""Open CivicSync and follow the landing page's Explore campaigns link."""

import os
import tempfile

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


url = os.getenv("CIVICSYNC_URL", "http://127.0.0.1:5173").rstrip("/")
driver_path = os.getenv("CIVICSYNC_E2E_DRIVER_PATH")

with tempfile.TemporaryDirectory(prefix="civicsync-basic-") as profile:
    options = webdriver.EdgeOptions()
    options.add_argument(f"--user-data-dir={profile}")
    if os.getenv("CIVICSYNC_HEADLESS") == "1":
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-gpu")
    service = Service(executable_path=driver_path) if driver_path else Service()
    driver = webdriver.Edge(options=options, service=service)

    try:
        driver.set_window_size(1280, 900)
        driver.get(url)
        wait = WebDriverWait(driver, 15)
        heading = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "main h1")))
        assert "Verified help" in heading.text
        print("Page title:", driver.title)
        print("Landing URL:", driver.current_url)

        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Explore campaigns"))).click()
        wait.until(EC.url_contains("/home"))
        assert wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "main h1"))).text == "Home"
        print("Feed URL:", driver.current_url)
        print("PASS: landing page and feed navigation")
    finally:
        if os.getenv("CIVICSYNC_PAUSE") == "1":
            input("Press Enter to close Edge...")
        driver.quit()
