"""Small user-facing Selenium actions shared by the workflow tests."""

import base64
import uuid

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from conftest import BASE_URL


def visit(browser, wait, route):
    browser.get(BASE_URL + route)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "header nav")))


def field(browser, label):
    return browser.find_element(
        By.XPATH,
        f"//label[normalize-space(text())='{label}']/*[self::input or self::select or self::textarea]",
    )


def fill(browser, label, value):
    control = field(browser, label)
    control.clear()
    control.send_keys(str(value))


def select(browser, label, value):
    Select(field(browser, label)).select_by_value(value)


def click_button(browser, wait, text):
    element = wait.until(
        EC.element_to_be_clickable((By.XPATH, f"//button[normalize-space(.)='{text}']"))
    )
    browser.execute_script("arguments[0].scrollIntoView({block:'center'})", element)
    element.click()


def login(browser, wait, email, password="password123"):
    visit(browser, wait, "/login")
    fill(browser, "Email", email)
    fill(browser, "Password", password)
    click_button(browser, wait, "Sign in")
    wait.until(lambda d: d.execute_script("return !!localStorage.getItem('token')"))


def register_donor(browser, wait, tmp_path, name, area, blood_group="O+"):
    identity = tmp_path / f"{uuid.uuid4().hex}.png"
    identity.write_bytes(base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1cAAAAASUVORK5CYII="
    ))
    email = f"selenium-{uuid.uuid4().hex[:12]}@example.test"
    visit(browser, wait, "/register")
    fill(browser, "Full name", name)
    fill(browser, "Email", email)
    fill(browser, "Password", "safe-test-password")
    fill(browser, "Phone", "01712345678")
    fill(browser, "Area or neighborhood", area)
    fill(browser, "Date of birth", "1998-05-12")
    select(browser, "Blood group", blood_group)
    field(browser, "NID card or birth certificate").send_keys(str(identity))
    browser.find_element(By.XPATH, "//label[contains(.,'List me as a blood donor')]/input").click()
    click_button(browser, wait, "Create account")
    wait.until(lambda d: d.execute_script("return !!localStorage.getItem('token')"))
    return email


def sign_out(browser):
    browser.execute_script("localStorage.removeItem('token'); localStorage.removeItem('user')")
