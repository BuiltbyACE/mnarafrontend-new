import { test, expect } from '@playwright/test';

test.describe('Parent portal with API mocking', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/accounts/auth/me/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { portalKey: 'parent-portal', permissions: ['finance.read'], user: { firstName: 'Parent', isActive: true } },
        }),
      });
    });
  });

  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/parent');
    await page.waitForURL('**/login?returnUrl=*');
  });
});
