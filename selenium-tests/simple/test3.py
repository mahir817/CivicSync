"""Check that the open mobile navbar becomes a rounded rectangle without overflow."""

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
        wait = WebDriverWait(driver, 15)
        for width in (390, 768, 1024):
            driver.set_window_size(width, 850)
            driver.get(url)
            nav = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "header nav")))
            menu = driver.find_element(By.CSS_SELECTOR, "header button[aria-label='Menu']")
            closed_radius = driver.execute_script(
                "return parseFloat(getComputedStyle(arguments[0]).borderTopLeftRadius)", nav
            )
            menu.click()
            wait.until(lambda page: page.find_element(By.CSS_SELECTOR, "header button[aria-label='Menu']").get_attribute("aria-expanded") == "true")
            open_radius, content_width, available_width = driver.execute_script(
                "const nav = arguments[0]; return [parseFloat(getComputedStyle(nav).borderTopLeftRadius), "
                "nav.scrollWidth, nav.clientWidth]", nav
            )
            assert 0 < open_radius < closed_radius
            assert content_width <= available_width + 1
            print(f"{width}px: radius {closed_radius}px -> {open_radius}px; no horizontal overflow")

        wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Health alerts"))).click()
        wait.until(EC.url_contains("/alerts"))
        print("PASS: responsive menu shape, content, and navigation")
    finally:
        if os.getenv("CIVICSYNC_PAUSE") == "1":
            input("Press Enter to close Edge...")
        driver.quit()
