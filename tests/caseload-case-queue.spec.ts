import { test, expect } from '@playwright/test';

test.describe('caseload-case-queue', () => {
  test('opens Followup with preserved case context from a case row', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { name: /Dashboard Clínico IntegraD/i }),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: 'Ver Caseload' }).click();
    await expect(page.getByRole('heading', { name: /Caseload Unificado/i })).toBeVisible();

    const firstManageButton = page.getByRole('button', { name: 'Gestionar' }).first();
    await expect(firstManageButton).toBeVisible();
    await firstManageButton.click();

    await expect(page.getByText('Panel de intervención')).toBeVisible();
    await expect(page.getByText('Contexto del caso:')).toBeVisible();
  });
});
