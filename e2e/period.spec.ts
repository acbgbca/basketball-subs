import { test, expect } from '@playwright/test';

test.describe('Period Management', () => {
  test('should handle periods in a game', async ({ page }) => {
    // Setup team and game
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Period Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');

    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Period Test Team' });
    await page.fill('#opponent', 'Period Opponent');
    // Select 4 periods of 10 minutes
    await page.selectOption('[data-testid="game-format-select"]', '4-10');
    await page.getByRole('button', { name: 'Create Game' }).click();
    await expect(page).toHaveURL('/#/games');

    // Go to game view
    await page.getByTestId('view-game-Period Test Team').click();
    await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });
    
    // Check initial period state
    await expect(page.getByTestId('period-display')).toHaveText('Period 1', { timeout: 5000 });
    await expect(page.getByTestId('clock-display')).toHaveText('10:00', { timeout: 5000 });

    // End period
    await page.getByRole('button', { name: 'End Period' }).click();
    await page.getByTestId('end-period-modal').getByRole('button', { name: 'End Period' }).click();
    
    // Verify next period started
    await expect(page.getByTestId('period-display')).toHaveText('Period 2', { timeout: 5000 });
    await expect(page.getByTestId('clock-display')).toHaveText('10:00', { timeout: 5000 });

    // Fast forward to last period
    await page.locator('.clock-display').getByRole('button', { name: 'End Period' }).click();
    await page.getByTestId('end-period-modal').getByRole('button', { name: 'End Period' }).click();
    await page.locator('.clock-display').getByRole('button', { name: 'End Period' }).click();
    await page.getByTestId('end-period-modal').getByRole('button', { name: 'End Period' }).click();
    
    // End last period
    await page.locator('.clock-display').getByRole('button', { name: 'End Period' }).click();
    await page.getByTestId('end-period-modal').getByRole('button', { name: 'End Period' }).click();
    
    // Verify game ended state
    await expect(page.getByText('Game Over')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'End Period' })).toBeDisabled({ timeout: 5000 });
  });

  test('should track substitutions across periods', async ({ page }) => {
    // Setup team with players
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Sub Period Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Add a player
    await page.getByRole('link', { name: 'Sub Period Team' }).click();
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    await page.getByRole('button', { name: 'Add Player' }).first().click();
    await page.waitForSelector('#playerName', { timeout: 5000 });
    await page.fill('#playerName', 'Test Player');
    await page.fill('#playerNumber', '10');
    await page.getByTestId('add-player-button').click();

    // Create game with quarters
    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Sub Period Team' });
    await page.fill('#opponent', 'Sub Period Opponent');
    await page.selectOption('[data-testid="game-format-select"]', '4-10');
    
    // Select the player for the game
    await page.getByLabel('10 - Test Player').check();
    
    await page.getByRole('button', { name: 'Create Game' }).click();
    await expect(page).toHaveURL('/#/games');

    // Go to game view
    await page.getByRole('link', { name: 'Sub Period Team' }).click();
    await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });
    
    // Wait for game view to load
    await page.waitForSelector('[data-testid="clock-display"]', { timeout: 5000 });

    // Sub in player for first period
    await page.getByRole('button', { name: 'Sub' }).click();
    await page.getByText('Test Player').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Run clock for a minute
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(1000); // Wait 1 second of real time
    await page.getByRole('button', { name: 'Stop' }).click();

    // End period and verify stats carried over
    await page.getByRole('button', { name: 'End Period' }).click();
    
    // Check player stats in the new period
    await expect(page.getByText('Test Player').locator('..').getByText(/1st:/)).toBeVisible({ timeout: 5000 });
  });
});