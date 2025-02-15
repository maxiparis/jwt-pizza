import { test, expect } from 'playwright-test-coverage';

test('home page', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.getByText('The web\'s best pizza', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Order now' })).toBeVisible();
  await expect(page.getByRole('main').getByRole('img')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Order' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Order now' })).toBeEnabled();
});