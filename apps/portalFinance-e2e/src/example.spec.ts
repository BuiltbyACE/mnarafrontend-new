import { test, expect } from '@playwright/test';

test.describe('Finance portal with API mocking', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/accounts/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { portalKey: 'finance-portal', permissions: ['transactions.read'], user: { firstName: 'Finance', isActive: true } },
        }),
      });
    });
  });

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForURL('**/login?returnUrl=*');
  });
});
