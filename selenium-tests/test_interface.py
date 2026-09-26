"""Browser checks for shared navigation, registration, and map coordinates."""

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from helpers import field, register_donor, visit


def test_responsive_navbar_language_and_map_coordinates(browser, wait):
    visit(browser, wait, "/")
    nav = browser.find_element(By.CSS_SELECTOR, "header nav")
    assert "bg-white" in nav.get_attribute("class")

    browser.set_window_size(390, 844)
    browser.find_element(By.CSS_SELECTOR, "header button[aria-label='Menu']").click()
    wait.until(EC.visibility_of_element_located((By.LINK_TEXT, "Health alerts")))
    Select(browser.find_element(By.ID, "locale-select")).select_by_value("bn")
    wait.until(lambda d: "Health alerts" not in d.find_element(By.CSS_SELECTOR, "header nav").text)
    Select(browser.find_element(By.ID, "locale-select")).select_by_value("en")

    visit(browser, wait, "/map")
    map_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".leaflet-container")))
    browser.execute_script(
        "const r=arguments[0].getBoundingClientRect(); "
        "arguments[0].dispatchEvent(new MouseEvent('click', "
        "{bubbles:true,clientX:r.left+r.width*0.35,clientY:r.top+r.height*0.55}));",
        map_element,
    )
    wait.until(EC.visibility_of_element_located((
        By.XPATH, "//code[contains(.,'Latitude:') and contains(.,'Longitude:')]"
    )))
    visit(browser, wait, "/alerts")
    wait.until(EC.visibility_of_element_located((By.XPATH, "//h1[normalize-space(.)='Health alerts']")))


def test_registration_collects_identity_and_donor_preferences(browser, wait, tmp_path):
    email = register_donor(browser, wait, tmp_path, "Selenium Donor", "Mirpur 10")
    visit(browser, wait, "/profile")
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "main"), email))
    assert field(browser, "Area or neighborhood").get_attribute("value") == "Mirpur 10"
    assert field(browser, "Blood group").get_attribute("value") == "O+"
