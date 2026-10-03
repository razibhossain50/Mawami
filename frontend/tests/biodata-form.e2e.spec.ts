import { test, expect, type Page } from '@playwright/test';

/**
 * E2E tests for the multi-step biodata form (/profile/biodatas/edit/new).
 *
 * Requires a running frontend + backend and a regular (role "user") account:
 *   E2E_EMAIL=you@example.com E2E_PASSWORD=secret npx playwright test --project=chromium
 *
 * Note: "Next" saves each step to the backend (PUT /api/biodatas/current), so the account's
 * biodata is modified. If the account already has a biodata, /edit/new redirects to
 * /edit/<id> and the form is pre-filled; the tests overwrite the values either way.
 */

const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

const STEP_TITLES = [
  'Personal Information',
  'Educational Information',
  'Family Information',
  'Desired Life Partner',
  'Contact Information',
];

// ---------- helpers ----------

async function login(page: Page) {
  await page.goto('/auth/login');
  await page.getByLabel('Email').fill(EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

/** The h2 inside the form body (the step indicator has a matching h3). */
const stepHeading = (page: Page, title: string) =>
  page.getByRole('heading', { name: title, level: 2 });

/** HeroUI Select is a button + popover listbox (not a native <select>). */
async function chooseOption(page: Page, label: string | RegExp, option: string) {
  await page.getByRole('button', { name: label }).click();
  await page.getByRole('option', { name: option, exact: true }).click();
}

/** Drill-down location picker: country > division > district > upazila. */
async function chooseLocation(page: Page, label: 'Permanent Address' | 'Present Address', path: string[]) {
  const trigger = page.locator('div[role="button"]', { hasText: label });
  await trigger.click();
  const container = trigger.locator('xpath=..');
  for (const name of path) {
    await container.getByRole('button', { name, exact: true }).click();
  }
}

async function fillDateOfBirth(page: Page, mmddyyyy: string) {
  // Segmented date field: focus the first segment (month) and type all digits
  await page.getByRole('spinbutton').first().click();
  await page.keyboard.type(mmddyyyy);
}

async function fillStep1(page: Page) {
  await chooseOption(page, /Religion/, 'Islam');
  await chooseOption(page, /Biodata Type/, 'Male');
  await chooseOption(page, /Marital Status/, 'Unmarried');
  await fillDateOfBirth(page, '01011995');
  await chooseOption(page, /Height/, '5\'6"');
  await page.getByLabel(/Weight/).fill('70');
  await chooseOption(page, /Complexion/, 'Wheatish');
  await page.getByLabel(/Profession/).fill('Engineer');
  await chooseOption(page, /Blood Group/, 'A+');

  await chooseLocation(page, 'Permanent Address', ['Bangladesh', 'Dhaka', 'Dhaka', 'Savar']);
  await page.getByLabel(/Area or Village Name/).first().fill('Test Area');
  await page.getByText('Present address is same as permanent address').click();

  await page.getByLabel(/physical or mental health issues/).fill('None');
}

async function fillStep2(page: Page) {
  await chooseOption(page, /Your Education Medium/, 'English');
  await chooseOption(page, /Highest Education Level/, 'Honours');
  await page.getByLabel(/Institute or University Name/).fill('Test University');
  await page.getByLabel(/Which subject do you study/).fill('Computer Science');
  await page.getByLabel(/Passing Year/).fill('2020');
  await chooseOption(page, /^Result/, 'A');
}

async function fillStep3(page: Page) {
  await chooseOption(page, /Family's Economic Condition/, 'Middle Class');
  await page.getByLabel(/Father's Name/).fill('Test Father');
  await page.getByLabel(/Father's Profession/).fill('Teacher');
  await chooseOption(page, /Is your father alive/, 'Yes');
  await page.getByLabel(/Mother's Name/).fill('Test Mother');
  await page.getByLabel(/Mother's Profession/).fill('Housewife');
  await chooseOption(page, /Is your mother alive/, 'Yes');
  await chooseOption(page, /How many brothers/, '1');
  await chooseOption(page, /How many sisters/, '1');
}

async function fillStep4(page: Page) {
  // Age range slider keeps its default (18 - 35)
  await page.getByLabel(/Preferred Complexion/).fill('Fair');
  await page.getByLabel(/Preferred Height/).fill('5\'0" - 5\'6"');
  await page.getByLabel(/Preferred Education/).fill('Bachelor');
  await page.getByLabel(/Preferred Profession/).fill('Any');
  await page.getByLabel(/Preferred Place/).fill('Dhaka');
}

async function fillStep5(page: Page) {
  await page.getByLabel(/Your full name/).fill('Test User');
  await page.getByLabel(/^Email/).fill('e2e-test@example.com');
  await page.getByLabel(/Guardian's Mobile Number/).fill('01700000000');
  await page.getByLabel(/Own Mobile Number/).fill('01800000000');
}

const next = (page: Page) => page.getByRole('button', { name: /^(Next|Saving)/ });
const previous = (page: Page) => page.getByRole('button', { name: 'Previous' });

async function clickNextAndExpect(page: Page, nextTitle: string) {
  await next(page).click();
  await expect(stepHeading(page, nextTitle)).toBeVisible({ timeout: 15000 });
}

/** Fill steps 1..n and land on step n+1. */
async function advanceTo(page: Page, step: number) {
  const fillers = [fillStep1, fillStep2, fillStep3, fillStep4];
  for (let i = 0; i < step - 1; i++) {
    await fillers[i](page);
    await clickNextAndExpect(page, STEP_TITLES[i + 1]);
  }
}

// ---------- tests ----------

test.describe('Biodata Form', () => {
  test.skip(!EMAIL || !PASSWORD, 'Set E2E_EMAIL and E2E_PASSWORD to run the biodata form tests');

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/profile/biodatas/edit/new');
    await expect(stepHeading(page, STEP_TITLES[0])).toBeVisible({ timeout: 15000 });
  });

  test('shows the first step with the step indicator', async ({ page }) => {
    await expect(page.getByText('Step 1 of 5')).toBeVisible();
    await expect(page.getByText('Basic details about you')).toBeVisible(); // indicator subtitle
    await expect(previous(page)).toBeDisabled();
    await expect(next(page)).toBeVisible();
  });

  test('shows a validation error when required fields are empty', async ({ page }) => {
    // A pre-filled (existing) biodata would pass validation, so only check on a fresh account
    test.skip(!page.url().endsWith('/edit/new'), 'Account already has a biodata');

    await next(page).click();
    await expect(page.getByText(/religion is required/i)).toBeVisible();
    await expect(stepHeading(page, STEP_TITLES[0])).toBeVisible();
  });

  test('completes step 1 and moves to step 2', async ({ page }) => {
    await fillStep1(page);
    await expect(page.getByText('Age: 3')).toBeVisible(); // age is derived from the DOB

    await clickNextAndExpect(page, 'Educational Information');
    await expect(page.getByText('Step 2 of 5')).toBeVisible();
  });

  test('completes step 2 and moves to step 3', async ({ page }) => {
    await advanceTo(page, 2);
    await fillStep2(page);
    await clickNextAndExpect(page, 'Family Information');
  });

  test('completes step 3 and moves to step 4', async ({ page }) => {
    await advanceTo(page, 3);
    await fillStep3(page);
    await clickNextAndExpect(page, 'Desired Life Partner');
  });

  test('completes step 4 and moves to step 5 (last step)', async ({ page }) => {
    await advanceTo(page, 4);
    await fillStep4(page);
    await clickNextAndExpect(page, 'Contact Information');
    await expect(page.getByRole('button', { name: /Create Biodata|Update Biodata/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toHaveCount(0);
  });

  test('Previous button goes back a step', async ({ page }) => {
    await advanceTo(page, 2);
    await previous(page).click();
    await expect(stepHeading(page, STEP_TITLES[0])).toBeVisible();
  });

  test('completed steps can be revisited from the step indicator', async ({ page }) => {
    await advanceTo(page, 2);
    await page.getByTitle(/Personal Information/).click();
    await expect(stepHeading(page, STEP_TITLES[0])).toBeVisible();
  });

  test('submits the whole form and redirects to the biodata page', async ({ page }) => {
    await advanceTo(page, 5);
    await fillStep5(page);

    await page.getByRole('button', { name: /Create Biodata|Update Biodata/ }).click();

    await expect(page.getByText(/submitted successfully/i)).toBeVisible({ timeout: 15000 });
    await page.waitForURL(/\/profile\/biodatas\/\d+$/, { timeout: 15000 });
  });
});
