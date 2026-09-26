"""Fill the registration form without creating an account."""

import os
import tempfile

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait


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
        driver.get(url + "/register")
        wait = WebDriverWait(driver, 15)
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "main form")))

        driver.find_element(By.XPATH, "//label[normalize-space(text())='Full name']/input").send_keys("Sample User")
        driver.find_element(By.CSS_SELECTOR, "form input[type='email']").send_keys("sample@example.test")
        driver.find_element(By.XPATH, "//label[normalize-space(text())='Phone']/input").send_keys("01712345678")
        driver.find_element(By.XPATH, "//label[normalize-space(text())='Area or neighborhood']/input").send_keys("Mirpur 10")
        Select(driver.find_element(By.XPATH, "//label[normalize-space(text())='Blood group']/select")).select_by_value("O+")
        Select(driver.find_element(By.XPATH, "//label[normalize-space(text())='Identity document type']/select")).select_by_value("BIRTH_CERTIFICATE")

        name = driver.find_element(By.XPATH, "//label[normalize-space(text())='Full name']/input").get_attribute("value")
        blood_group = driver.find_element(By.XPATH, "//label[normalize-space(text())='Blood group']/select").get_attribute("value")
        document_type = driver.find_element(By.XPATH, "//label[normalize-space(text())='Identity document type']/select").get_attribute("value")
        assert name == "Sample User"
        assert blood_group == "O+"
        assert document_type == "BIRTH_CERTIFICATE"
        print("Name:", name)
        print("Blood group:", blood_group)
        print("Identity document type:", document_type)
        print("PASS: registration fields accept input (form was not submitted)")
    finally:
        if os.getenv("CIVICSYNC_PAUSE") == "1":
            input("Press Enter to close Edge...")
        driver.quit()
