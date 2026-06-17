import { test, expect } from '@playwright/test';

test.describe('Login flow with API mocking', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the login API response
    await page.route('**/api/v1/accounts/auth/login/', async (route) => {
      const response = {
        access: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQURNSU4iLCJwb3J0YWxfa2V5IjoiYWRtaW4tcG9ydGFsIiwicGVybWlzc2lvbnMiOlsiKiJdfQ.signature',
        refresh: 'mock-refresh-token',
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
    });

    // Mock the user context endpoint
    await page.route('**/api/v1/accounts/auth/me/', async (route) => {
      const response = {
        data: {
          portalKey: 'admin-portal',
          permissions: ['*'],
          user: {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@school.com',
            isActive: true,
          },
        },
      };
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
    });
  });

  test('shows the login page with email and password fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h1')).toContainText('Welcome');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('logs in and navigates to admin portal', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'admin@school.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button:has-text("Sign In")');

    // After successful login, should navigate to /admin
    await page.waitForURL('**/admin');
  });

  test('shows error on invalid credentials', async ({ page }) => {
    // Override the login mock to return 401
    await page.route('**/api/v1/accounts/auth/login/', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' }),
      });
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@school.com');
    await page.fill('input[type="password"]', 'wrong');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('snack-bar-container')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Authenticated routes with returnUrl', () => {
  test('redirects unauthenticated user to /login with returnUrl', async ({ page }) => {
    // Mock all auth endpoints to return 401 initially
    await page.route('**/api/v1/accounts/auth/**', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/admin/dashboard');

    await page.waitForURL('**/login?returnUrl=*');
    expect(page.url()).toContain('returnUrl=%2Fadmin%2Fdashboard');
  });
});
