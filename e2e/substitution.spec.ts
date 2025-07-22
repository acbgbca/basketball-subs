import { test, expect } from '@playwright/test';

// Utility to create a game and perform a substitution
async function setupGameAndSub(page) {
  // Go to teams page
  await page.goto('/#/teams');
  // Create a new team
  await page.getByRole('button', { name: 'Add New Team' }).click();
  await page.fill('#teamName', 'Test Team');
  await page.getByRole('button', { name: 'Create Team' }).click();
  await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });

  // Add players
  for (let i = 1; i <= 6; i++) {
    await page.getByRole('button', { name: 'Add Player' }).click();
    const rows = await page.getByRole('row').all();
    let lastRow = rows[rows.length - 1];
    await lastRow.getByLabel('Player Number').fill(`${i}`);
    await lastRow.getByLabel('Player Name').fill(`Player${i}`);
  }
  await page.getByRole('button', { name: 'Save Changes' }).click();
  // Go to games page
  await page.goto('/#/games/new');
  await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
  // Create a new game
  await page.selectOption('[data-testid="team-select"]', { label: 'Test Team' });
  await page.fill('#opponent', 'Opponent');
  await page.getByRole('button', { name: 'Create Game' }).click();
  // Go to game view
  await page.getByTestId('view-game-Test Team').click();
  await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });
  // Sub in Player6 for Player1 at 600 seconds
  await page.getByRole('button', { name: 'Sub' }).click();
  await page.getByTestId('substitution-modal').getByText('Player6').click();
  await page.getByTestId('substitution-modal').getByText('Player1').click();
  await page.getByRole('button', { name: 'Done' }).click();
}

test.describe('Edit Substitution Event', () => {
  test('Edit the time for a substitution and verify all of the game time values are correctly updated', async ({ page }) => {
    await setupGameAndSub(page);
    // Edit the most recent substitution event
    await page.click('button:has-text("Edit")');
    await page.fill('input#eventTimeInput', '500');
    await page.click('button[data-testid="sub-modal-done"]');
    // Check that the substitution event time is updated in the table
    await expect(page.locator('td')).toContainText('8:20'); // 500 seconds = 8:20
  });

  test('Change the player who was subbed in, making sure the time is correctly updated', async ({ page }) => {
    await setupGameAndSub(page);
    // Edit the most recent substitution event
    await page.click('button:has-text("Edit")');
    // Deselect Player6, select Player5
    await page.click('button:has-text("Player6")');
    await page.click('button:has-text("Player5")');
    await page.click('button[data-testid="sub-modal-done"]');
    // Check that Player5 is now shown as subbed in
    await expect(page.locator('td')).toContainText('Player5');
    await expect(page.locator('td')).not.toContainText('Player6');
  });

  test('Change the player who was subbed out, making sure the time is correctly updated', async ({ page }) => {
    await setupGameAndSub(page);
    // Edit the most recent substitution event
    await page.click('button:has-text("Edit")');
    // Deselect Player1, select Player2
    await page.click('button:has-text("Player1")');
    await page.click('button:has-text("Player2")');
    await page.click('button[data-testid="sub-modal-done"]');
    // Check that Player2 is now shown as subbed out
    await expect(page.locator('td')).toContainText('Player2');
    await expect(page.locator('td')).not.toContainText('Player1');
  });
});
