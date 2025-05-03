import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test('should create a new team', async ({ page }) => {
    await page.goto('/#/teams/new');
    // Wait for navigation and form to be ready
    await page.waitForSelector('#teamName');
    
    await page.fill('#teamName', 'Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');
    await expect(page.getByText('Test Team')).toBeVisible();
  });

  test('should view team details', async ({ page }) => {
    // First create a team
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName');
    await page.fill('#teamName', 'View Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');
    
    // Then view its details
    await page.getByRole('button', { name: 'View Team' }).click();
    await expect(page.getByRole('heading')).toContainText('View Test Team');
  });

  test('should add a player to team', async ({ page }) => {
    // First create a team
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName');
    await page.fill('#teamName', 'Player Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');
    
    // Navigate to team view and add player
    await page.getByRole('button', { name: 'View Team' }).click();
    await page.getByRole('button', { name: 'Add Player' }).click();
    await page.waitForSelector('#playerName');
    await page.fill('#playerName', 'John Doe');
    await page.fill('#playerNumber', '23');
    await page.getByTestId('add-player-button').click();
    
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('23')).toBeVisible();
  });
});

// Add basic smoke test
test('homepage should load', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});