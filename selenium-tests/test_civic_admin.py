"""Civic confirmation limits and admin dispute handling in the browser."""

import uuid

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from helpers import click_button, fill, login, sign_out, visit


def test_civic_confirmation_and_admin_dispute(browser, wait):
    description = f"Selenium waterlogging {uuid.uuid4().hex[:8]}"
    reason = f"Selenium review {uuid.uuid4().hex[:8]}"

    login(browser, wait, "rafi@example.com")
    visit(browser, wait, "/report-clogging")
    fill(browser, "Latitude", "23.8069")
    fill(browser, "Longitude", "90.3687")
    fill(browser, "Description", description)
    click_button(browser, wait, "Submit")
    wait.until(EC.element_to_be_clickable((By.LINK_TEXT, description))).click()
    detail_url = browser.current_url
    wait.until(EC.visibility_of_element_located((By.XPATH, f"//h1[normalize-space(.)='{description}']")))
    assert not browser.find_element(By.XPATH, "//button[normalize-space(.)='Confirm report']").is_enabled()
    sign_out(browser)

    login(browser, wait, "tanvir@example.com")
    browser.get(detail_url)
    wait.until(EC.visibility_of_element_located((By.XPATH, f"//h1[normalize-space(.)='{description}']")))
    click_button(browser, wait, "Confirm report")
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "main"), "1 Reports"))
    click_button(browser, wait, "Confirm report")
    wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "main [role='alert']")))
    assert "1 Reports" in browser.find_element(By.CSS_SELECTOR, "main").text

    flag_form = browser.find_element(By.XPATH,
        "//h2[normalize-space(.)='Flag for review']/following-sibling::form")
    flag_form.find_element(By.CSS_SELECTOR, "input").send_keys(reason)
    flag_form.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "main"), "Thank you for helping"))
    sign_out(browser)

    login(browser, wait, "admin@civicsync.app")
    visit(browser, wait, "/admin")
    click_button(browser, wait, "Disputes")
    dispute = wait.until(EC.presence_of_element_located((
        By.XPATH, f"//p[normalize-space(.)='{reason}']/ancestor::div[contains(@class,'rounded-2xl')][1]"
    )))
    dispute.find_element(By.XPATH, ".//button[normalize-space(.)='Resolve']").click()
    wait.until(EC.text_to_be_present_in_element((
        By.XPATH, f"//p[normalize-space(.)='{reason}']/ancestor::div[contains(@class,'rounded-2xl')][1]"
    ), "Resolved"))

    sign_out(browser)
    login(browser, wait, "rafi@example.com")
    browser.get(detail_url)
    click_button(browser, wait, "Mark resolved")
    wait.until(EC.url_matches(r".*/civic-reports$"))
    assert not browser.find_elements(By.LINK_TEXT, description)
