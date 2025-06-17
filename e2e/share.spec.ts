import { test, expect } from '@playwright/test';

test.describe('Team Sharing', () => {
  test('should share team and verify pre-filled data', async ({ context }) => {
    // Create a new browser context for handling clipboard permissions
    const page = await context.newPage();
    await page.goto('/#/teams');
    
    // Create a test team with players
    await page.getByRole('button', { name: 'Add New Team' }).click();
    await page.fill('#teamName', 'Share Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Wait for navigation and add players
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Add first player
    await page.getByRole('button', { name: 'Add Player' }).click();
    const rows = await page.getByRole('row').all();
    let lastRow = rows[rows.length - 1];
    await lastRow.getByLabel('Player Number').fill('23');
    await lastRow.getByLabel('Player Name').fill('Test Player 1');
    
    // Add second player
    await page.getByRole('button', { name: 'Add Player' }).click();
    const updatedRows = await page.getByRole('row').all();
    lastRow = updatedRows[updatedRows.length - 1];
    await lastRow.getByLabel('Player Number').fill('45');
    await lastRow.getByLabel('Player Name').fill('Test Player 2');
    
    // Save changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Click share button
    await page.getByRole('button', { name: 'Share Team' }).click();
    
    // Verify share URL is displayed
    const urlInput = page.getByTestId('share-url-input');
    await expect(urlInput).toBeVisible();
    
    // Get the share URL
    const shareUrl = await urlInput.inputValue();
    
    // Open the share URL in a new page
    const newPage = await context.newPage();
    await newPage.goto(shareUrl);
    
    // Verify team data is pre-filled correctly
    await expect(newPage.getByLabel('Team Name')).toHaveValue('Share Test Team');
    
    // Get all player rows
    const playerRows = await newPage.getByRole('row').all();
    // Skip header row
    const dataRows = playerRows.slice(1);
    
    // Verify first player
    await expect(dataRows[0].getByRole('textbox').nth(0)).toHaveValue('23');
    await expect(dataRows[0].getByRole('textbox').nth(1)).toHaveValue('Test Player 1');
    
    // Verify second player
    await expect(dataRows[1].getByRole('textbox').nth(0)).toHaveValue('45');
    await expect(dataRows[1].getByRole('textbox').nth(1)).toHaveValue('Test Player 2');
  });

  test('should show success message when copying share URL', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('/#/teams');
    
    // Create a test team
    await page.getByRole('button', { name: 'Add New Team' }).click();
    await page.fill('#teamName', 'Copy Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Wait for navigation
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Click share button
    await page.getByRole('button', { name: 'Share Team' }).click();
    
    // Click copy button
    await page.getByRole('button', { name: 'Copy' }).click();
    
    // Verify success message appears
    const successMessage = page.getByText('URL copied to clipboard!');
    await expect(successMessage).toBeVisible();
    
    // Verify message disappears
    await expect(successMessage).toBeHidden({ timeout: 3000 });
  });
});
