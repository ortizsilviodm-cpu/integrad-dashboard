import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/professional.json';
const username = process.env.PLAYWRIGHT_KEYCLOAK_USERNAME;
const password = process.env.PLAYWRIGHT_KEYCLOAK_PASSWORD;

setup('authenticate professional user', async ({ page }) => {
  setup.skip(
    !username || !password,
    'Set PLAYWRIGHT_KEYCLOAK_USERNAME and PLAYWRIGHT_KEYCLOAK_PASSWORD to persist Playwright auth state.',
  );

  await page.goto('/');
  await page.getByRole('button', { name: /Iniciar sesión \(Keycloak\)/i }).click();

  await page.locator('#username').fill(username!);
  await page.locator('#password').fill(password!);
  await page.locator('#kc-login').click();

  await expect(
    page.getByRole('heading', { name: /Dashboard Clínico IntegraD/i }),
  ).toBeVisible({ timeout: 20_000 });

  await page.context().storageState({ path: authFile });
});
