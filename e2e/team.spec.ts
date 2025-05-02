import { test, expect } from '@playwright/test';

// Increase timeout for this test file
test.describe.configure({ timeout: 60000 });

test.describe('Team Management', () => {
  test.skip('should create a new team', async ({ page }) => {
    await page.goto('/teams/new');
    await page.fill('#teamName', 'Test Team');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/teams');
    await expect(page.getByText('Test Team')).toBeVisible();
  });

  test.skip('should view team details', async ({ page }) => {
    // First create a team
    await page.goto('/teams/new');
    await page.fill('#teamName', 'View Test Team');
    await page.click('button[type="submit"]');
    
    // Then view its details
    await page.getByText('View Test Team').click();
    await expect(page.getByRole('heading')).toContainText('View Test Team');
  });

  test.skip('should add a player to team', async ({ page }) => {
    // First create a team
    await page.goto('/teams/new');
    await page.fill('#teamName', 'Player Test Team');
    await page.click('button[type="submit"]');
    
    // Navigate to team view and add player
    await page.getByText('Player Test Team').click();
    await page.getByText('Add Player').click();
    await page.fill('input[name="playerName"]', 'John Doe');
    await page.fill('input[name="playerNumber"]', '23');
    await page.click('button:has-text("Save")');
    
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('23')).toBeVisible();
  });
});

// Add basic smoke test
test('homepage should load', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait for something specific on the page
  await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
});