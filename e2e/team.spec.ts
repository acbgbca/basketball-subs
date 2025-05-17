import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test('should create a new team and navigate to team view', async ({ page }) => {
    await page.goto('/#/teams');
    await page.getByRole('button', { name: 'Add New Team' }).click();
    
    await page.fill('#teamName', 'Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Should navigate to team view
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    await expect(page.getByLabel('Team Name')).toHaveValue('Test Team');
  });  test('should view team details', async ({ page }) => {
    // First create a team
    await page.goto('/#/teams');
    await page.getByRole('button', { name: 'Add New Team' }).click();
    await page.fill('#teamName', 'View Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Should go directly to team view
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    await expect(page.getByLabel('Team Name')).toHaveValue('View Test Team');
  });

  test('should add a player to team', async ({ page }) => {
    // First create a team
    await page.goto('/#/teams');
    await page.getByRole('button', { name: 'Add New Team' }).click();
    await page.fill('#teamName', 'Player Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Should navigate to team view page
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Add player
    await page.getByRole('button', { name: 'Add Player' }).click();
    const rows = await page.getByRole('row').all();
    const lastRow = rows[rows.length - 1]; // New player is added at the end
    
    // Fill in player details in the table inputs
    await lastRow.getByLabel('Player Number').fill('23');
    await lastRow.getByLabel('Player Name').fill('John Doe');
    
    // Save the changes
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Verify the player appears in the table
    await expect(page.getByTestId('player-23')).toBeVisible();
    await expect(page.getByTestId('player-23').getByLabel('Player Name')).toHaveValue('John Doe');
    await expect(page.getByTestId('player-23').getByLabel('Player Number')).toHaveValue('23');
  });

  test('should edit team name', async ({ page }) => {
    // First create a team using modal
    await page.goto('/#/teams');
    await page.getByRole('button', { name: 'Add New Team' }).click();
    await page.fill('#teamName', 'Edit Name Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Should navigate to team view page
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Edit team name
    const teamNameInput = page.getByLabel('Team Name');
    await teamNameInput.clear();
    await teamNameInput.fill('Updated Team Name');
    
    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();
    
    // Verify updates are saved - should show the new name
    await expect(page.getByLabel('Team Name')).toHaveValue('Updated Team Name');
  });
});

// Add basic smoke test
test('homepage should load', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('body')).toBeVisible();
});