import { test, expect, type Page } from '@playwright/test';

const KEYCLOAK_USERNAME = process.env.PLAYWRIGHT_KEYCLOAK_USERNAME;
const KEYCLOAK_PASSWORD = process.env.PLAYWRIGHT_KEYCLOAK_PASSWORD;

async function loginIfNeeded(page: Page) {
  await page.goto('/');

  const loginButton = page.getByRole('button', {
    name: /Iniciar sesión \(Keycloak\)/i,
  });

  if (!(await loginButton.isVisible().catch(() => false))) {
    return;
  }

  if (!KEYCLOAK_USERNAME || !KEYCLOAK_PASSWORD) {
    test.skip(
      true,
      'Set PLAYWRIGHT_KEYCLOAK_USERNAME and PLAYWRIGHT_KEYCLOAK_PASSWORD to run the Followup E2E flow.',
    );
  }

  await loginButton.click();
  await page.locator('#username').fill(KEYCLOAK_USERNAME!);
  await page.locator('#password').fill(KEYCLOAK_PASSWORD!);
  await page.locator('#kc-login').click();

  await expect(
    page.getByRole('heading', { name: /Dashboard Clínico IntegraD/i }),
  ).toBeVisible({ timeout: 20_000 });
}

function closeResolutionSelect(page: Page) {
  return page.locator('select').filter({ hasText: 'Estabilizado' }).first();
}

test.describe('followup-history-traceability', () => {
  test('manages, acts, educates, and closes with unified trace visible', async ({ page }) => {
    test.skip(
      !KEYCLOAK_USERNAME || !KEYCLOAK_PASSWORD,
      'Set PLAYWRIGHT_KEYCLOAK_USERNAME and PLAYWRIGHT_KEYCLOAK_PASSWORD to run the Followup E2E flow.',
    );

    await loginIfNeeded(page);

    await page.getByRole('button', { name: 'Seguimiento' }).click();
    await expect(page.getByRole('heading', { name: /Seguimiento \/ Caseload/i })).toBeVisible();

    const firstManageButton = page.getByRole('button', { name: 'Gestionar' }).first();
    await expect(firstManageButton).toBeVisible();
    await firstManageButton.click();

    await expect(page.getByText('Panel de intervención')).toBeVisible();
    await expect(page.getByText('Traza operativa')).toBeVisible();

    const actionNote = `Prueba Playwright acción ${Date.now()}`;
    const educationNote = `Prueba Playwright educación ${Date.now()}`;
    const closeNote = `Prueba Playwright cierre ${Date.now()}`;

    const noteArea = page.getByPlaceholder('Ej: Se contacta por WhatsApp, confirma retiro mañana.');
    await noteArea.fill(actionNote);
    await page.getByRole('button', { name: /Agregar acción/i }).click();
    await expect(page.getByText(actionNote)).toBeVisible();

    const educationArea = page.getByPlaceholder('Registrar intervención educativa...');
    await educationArea.fill(educationNote);
    await page.getByRole('button', { name: /Registrar educación/i }).click();
    await expect(page.getByText(educationNote).first()).toBeVisible();

    await page.getByRole('button', { name: 'Cerrar' }).last().click();
    await closeResolutionSelect(page).selectOption({ label: 'Estabilizado' });
    await page.getByPlaceholder('Ej: Paciente compensado, control programado en 72 hs.').fill(closeNote);
    await page.getByRole('button', { name: /Confirmar cierre/i }).click();

    await expect(page.getByText(/Evento cerrado/i)).toBeVisible();
    await expect(page.getByText(closeNote).first()).toBeVisible();
    await expect(page.getByText(/Puede dejar de aparecer en este filtro porque ya no está en curso/i)).toBeVisible();
  });
});
