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
    // Edit the most recent substitution event (first Edit button in the table)
    const subTable = page.getByTestId('substitution-table');
    await subTable.getByRole('button', { name: 'Edit' }).first().click();
    // Fill the event time input in the modal
    const modal = page.getByTestId('substitution-modal');
    await modal.locator('#eventTimeInput').fill('8:20');
    await modal.getByTestId('sub-modal-done').click();
    // Check that the substitution event time is updated in the table
    await expect(subTable).toContainText('8:20');
  });

  test('Change the player who was subbed in, making sure the time is correctly updated', async ({ page }) => {
    await setupGameAndSub(page);
    // Edit the most recent substitution event
    const subTable = page.getByTestId('substitution-table');
    await subTable.getByRole('button', { name: 'Edit' }).first().click();
    const modal = page.getByTestId('substitution-modal');
    // Deselect Player6, select Player5 (On Bench column)
    await modal.getByRole('button', { name: 'Player6' }).click();
    await modal.getByRole('button', { name: 'Player5' }).click();
    await modal.getByTestId('sub-modal-done').click();
    // Check that Player5 is now shown as subbed in
    await expect(subTable).toContainText('Player5');
    await expect(subTable).not.toContainText('Player6');
  });

  test('Change the player who was subbed out, making sure the time is correctly updated', async ({ page }) => {
    await setupGameAndSub(page);
    // Edit the most recent substitution event
    const subTable = page.getByTestId('substitution-table');
    await subTable.getByRole('button', { name: 'Edit' }).first().click();
    const modal = page.getByTestId('substitution-modal');
    // Deselect Player1, select Player2 (On Court column)
    await modal.getByRole('button', { name: 'Player1' }).click();
    await modal.getByRole('button', { name: 'Player2' }).click();
    await modal.getByTestId('sub-modal-done').click();
    // Check that Player2 is now shown as subbed out
    await expect(subTable).toContainText('Player2');
    await expect(subTable).not.toContainText('Player1');
  });

  test('Cancel edit substitution and verify modal state is clean for new substitution', async ({ page }) => {
    await setupGameAndSub(page);
    
    // Edit the most recent substitution event
    const subTable = page.getByTestId('substitution-table');
    await subTable.getByRole('button', { name: 'Edit' }).first().click();
    
    // Verify we're in edit mode (should show the time input and selected players)
    const modal = page.getByTestId('substitution-modal');
    await expect(modal.locator('#eventTimeInput')).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Player6' }).locator('.badge')).toHaveClass(/bg-secondary/);
    await expect(modal.getByRole('button', { name: 'Player1' }).locator('.badge')).toHaveClass(/bg-secondary/);
    
    // Cancel the edit
    await modal.getByRole('button', { name: 'Cancel' }).click();
    
    // Open substitution modal for a new substitution
    await page.getByRole('button', { name: 'Sub', exact: true }).click();
    
    // Verify modal is in clean state - no players should be pre-selected
    const newModal = page.getByTestId('substitution-modal');
    
    // Verify no time input is shown (not in edit mode)
    await expect(newModal.locator('#eventTimeInput')).not.toBeVisible();
    
    // Verify no players are pre-selected for substitution
    // Check that all "On Court" players show "Out" badge (not "Sub")
    const onCourtButtons = newModal.locator('h5:has-text("On Court") + button, h5:has-text("On Court") ~ button');
    const onCourtCount = await onCourtButtons.count();
    for (let i = 0; i < onCourtCount; i++) {
      const button = onCourtButtons.nth(i);
      await expect(button.locator('.badge')).toHaveClass(/bg-danger/);
      await expect(button.locator('.badge')).toHaveText('Out');
    }
    
    // Check that all "On Bench" players show "In" badge (not "Sub")
    const onBenchButtons = newModal.locator('h5:has-text("On Bench") + button, h5:has-text("On Bench") ~ button');
    const onBenchCount = await onBenchButtons.count();
    for (let i = 0; i < onBenchCount; i++) {
      const button = onBenchButtons.nth(i);
      await expect(button.locator('.badge')).toHaveClass(/bg-success/);
      await expect(button.locator('.badge')).toHaveText('In');
    }
    
    // Cancel this modal too to clean up
    await newModal.getByRole('button', { name: 'Cancel' }).click();
  });
});
