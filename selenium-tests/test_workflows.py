"""End-to-end checks for the main trust and blood support journeys."""

import uuid

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from helpers import click_button, field, fill, login, register_donor, sign_out, visit


def verifier_code(browser, wait, email):
    login(browser, wait, email)
    visit(browser, wait, "/profile")
    return wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "main code"))).text


def create_pet_request(browser, wait, title, code):
    login(browser, wait, "rafi@example.com")
    browser.find_element(By.XPATH, "//header//button[contains(.,'New post')]").click()
    click_button(browser, wait, "Request help")
    from selenium.webdriver.support.ui import Select

    Select(field(browser, "Category")).select_by_value("PET_CARE")
    fill(browser, "Location", "Mirpur 10")
    fill(browser, "Goal amount (BDT)", "500")
    click_button(browser, wait, "Next")
    fill(browser, "Title", title)
    fill(browser, "Description", "Veterinary care is needed for an injured animal in Mirpur.")
    fill(browser, "Verifier code", code)
    click_button(browser, wait, "Submit")
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "main"), title))


def test_verifier_approval_and_offline_receipt(browser, wait):
    title = f"Selenium pet care {uuid.uuid4().hex[:8]}"
    code = verifier_code(browser, wait, "verifier@pawsshelter.bd")
    sign_out(browser)
    create_pet_request(browser, wait, title, code)
    sign_out(browser)

    visit(browser, wait, "/home?q=" + title.replace(" ", "%20"))
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "main"), "Nothing here yet."))
    assert not browser.find_elements(By.XPATH, f"//h2[normalize-space(.)='{title}']")

    login(browser, wait, "verifier@pawsshelter.bd")
    visit(browser, wait, "/review")
    request = wait.until(EC.element_to_be_clickable((
        By.XPATH, f"//button[.//p[normalize-space(.)='{title}']]"
    )))
    request.click()
    click_button(browser, wait, "Approve")
    wait.until(EC.invisibility_of_element_located((
        By.XPATH, f"//button[.//p[normalize-space(.)='{title}']]"
    )))
    sign_out(browser)

    visit(browser, wait, "/home?q=" + title.replace(" ", "%20"))
    wait.until(EC.visibility_of_element_located((By.XPATH, f"//h2[normalize-space(.)='{title}']")))
    browser.find_element(By.XPATH, f"//h2[normalize-space(.)='{title}']/parent::a").click()
    detail_url = browser.current_url
    received = wait.until(EC.visibility_of_element_located((
        By.XPATH, "//p[contains(.,'Received:')]"
    )))
    assert "0 /" in received.text

    login(browser, wait, "tanvir@example.com")
    browser.get(detail_url)
    wait.until(EC.visibility_of_element_located((By.ID, "contribute")))
    fill(browser, "Amount (BDT)", "150")
    browser.find_element(By.CSS_SELECTOR, "#contribute button[type='submit']").click()
    click_button(browser, wait, "Confirm report")
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "main"), "Awaiting receipt confirmation"))
    assert "0 /" in browser.find_element(By.XPATH, "//p[contains(.,'Received:')]").text
    sign_out(browser)

    login(browser, wait, "rafi@example.com")
    visit(browser, wait, "/profile")
    receipt = wait.until(EC.presence_of_element_located((
        By.XPATH, f"//p[normalize-space(.)='{title}']/ancestor::div[.//button[normalize-space(.)='Confirm received']][1]"
    )))
    receipt.find_element(By.XPATH, ".//button[normalize-space(.)='Confirm received']").click()
    browser.get(detail_url)
    wait.until(EC.text_to_be_present_in_element((
        By.XPATH, "//p[contains(.,'Received:')]"
    ), "150 /"))


def test_nearby_blood_donors_and_countdown(browser, wait, tmp_path):
    same_name = f"Same Area {uuid.uuid4().hex[:6]}"
    near_name = f"Nearby Area {uuid.uuid4().hex[:6]}"
    same_email = register_donor(browser, wait, tmp_path, same_name, "Dhanmondi")
    sign_out(browser)
    register_donor(browser, wait, tmp_path, near_name, "Mirpur 10")
    sign_out(browser)

    login(browser, wait, "rafi@example.com")
    visit(browser, wait, "/home?q=O%2B%20blood%20needed%20urgently")
    wait.until(EC.visibility_of_element_located((
        By.XPATH, "//h2[contains(.,'O+ blood needed urgently')]"
    ))).click()
    detail_url = browser.current_url
    click_button(browser, wait, "Find nearby donors")
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "main"), near_name))
    same_card = browser.find_element(By.XPATH, f"//p[contains(.,'{same_name}')]/ancestor::div[contains(@class,'rounded-xl')][1]")
    near_card = browser.find_element(By.XPATH, f"//p[contains(.,'{near_name}')]/ancestor::div[contains(@class,'rounded-xl')][1]")
    assert same_card.location["y"] < near_card.location["y"]
    sign_out(browser)

    login(browser, wait, same_email, "safe-test-password")
    browser.get(detail_url)
    wait.until(EC.visibility_of_element_located((By.ID, "contribute")))
    fill(browser, "Contact phone", "01712345678")
    browser.find_element(By.CSS_SELECTOR, "#contribute button[type='submit']").click()
    click_button(browser, wait, "Confirm report")
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, "main"), "Pledged"))
    sign_out(browser)

    login(browser, wait, "rafi@example.com")
    visit(browser, wait, "/profile")
    pledge = wait.until(EC.presence_of_element_located((
        By.XPATH, f"//p[contains(.,'{same_name}')]/ancestor::div[.//button[normalize-space(.)='Confirm blood was donated']][1]"
    )))
    pledge.find_element(By.XPATH, ".//button[normalize-space(.)='Confirm blood was donated']").click()
    sign_out(browser)

    login(browser, wait, same_email, "safe-test-password")
    visit(browser, wait, "/profile")
    wait.until(EC.text_to_be_present_in_element((
        By.CSS_SELECTOR, "main"
    ), "Estimated time until you can donate again"))
    assert "days remaining" in browser.find_element(By.CSS_SELECTOR, "main").text
