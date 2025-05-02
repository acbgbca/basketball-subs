import { test, expect } from '@playwright/test';

test.describe('Period Management', () => {
  test.skip('should handle periods in a game', async ({ page }) => {
    // Setup team and game
    await page.goto('/teams/new');
    await page.fill('#teamName', 'Period Test Team');
    await page.click('button[type="submit"]');

    await page.goto('/games/new');
    await page.selectOption('select[name="team"]', { label: 'Period Test Team' });
    await page.fill('input[name="opponent"]', 'Period Opponent');
    await page.fill('input[name="date"]', '2025-05-02');
    // Select 4 periods of 10 minutes
    await page.selectOption('select[name="periodConfig"]', 'quarters');
    await page.click('button[type="submit"]');

    // Go to game view
    await page.getByText('Period Test Team').click();

    // Check initial period state
    await expect(page.getByTestId('period-display')).toHaveText('Period 1');
    await expect(page.getByTestId('clock-display')).toHaveText('10:00');

    // End period
    await page.getByRole('button', { name: 'End Period' }).click();
    
    // Verify next period started
    await expect(page.getByTestId('period-display')).toHaveText('Period 2');
    await expect(page.getByTestId('clock-display')).toHaveText('10:00');

    // Fast forward to last period
    await page.getByRole('button', { name: 'End Period' }).click();
    await page.getByRole('button', { name: 'End Period' }).click();
    
    // End last period
    await page.getByRole('button', { name: 'End Period' }).click();
    
    // Verify game ended state
    await expect(page.getByText('Game Over')).toBeVisible();
    await expect(page.getByRole('button', { name: 'End Period' })).toBeDisabled();
  });

  test.skip('should track substitutions across periods', async ({ page }) => {
    // Setup team with players
    await page.goto('/teams/new');
    await page.fill('#teamName', 'Sub Period Team');
    await page.click('button[type="submit"]');
    
    // Add a player
    await page.getByText('Sub Period Team').click();
    await page.getByText('Add Player').click();
    await page.fill('input[name="playerName"]', 'Test Player');
    await page.fill('input[name="playerNumber"]', '10');
    await page.click('button:has-text("Save")');

    // Create game with quarters
    await page.goto('/games/new');
    await page.selectOption('select[name="team"]', { label: 'Sub Period Team' });
    await page.fill('input[name="opponent"]', 'Sub Period Opponent');
    await page.fill('input[name="date"]', '2025-05-02');
    await page.selectOption('select[name="periodConfig"]', 'quarters');
    await page.click('button[type="submit"]');

    // Go to game view
    await page.getByText('Sub Period Team').click();

    // Sub in player for first period
    await page.getByText('Sub').click();
    await page.getByText('Test Player').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Run clock for a minute
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Stop' }).click();

    // End period and verify stats carried over
    await page.getByRole('button', { name: 'End Period' }).click();
    
    // Check player stats in the new period
    const playerStats = page.getByTestId('player-10-stats');
    await expect(playerStats).toContainText('1st: 1:00');
  });
});