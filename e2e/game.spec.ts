import { test, expect } from '@playwright/test';

test.describe('Game Management', () => {
  test('should create a new game', async ({ page }) => {
    // First create a team
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Game Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');

    // Create a new game
    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Game Test Team' });
    await page.fill('#opponent', 'Test Opponent');
    await page.getByRole('button', { name: 'Create Game' }).click();

    await expect(page).toHaveURL('/#/games');
    await expect(page.getByText('Game Test Team')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Test Opponent')).toBeVisible({ timeout: 5000 });
  });

  test('should create a new game with auto-selected players', async ({ page }) => {
    // First create a team with players
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Auto Select Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');
    
    // Add players
    await page.getByTestId('view-team-Auto Select Team').click();
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Add player 1
    await page.getByRole('button', { name: 'Add Player' }).click();
    const rows = await page.getByRole('row').all();
    let lastRow = rows[rows.length - 1];
    await lastRow.getByLabel('Player Number').fill('1');
    await lastRow.getByLabel('Player Name').fill('Auto Player 1');
    
    // Add player 2
    await page.getByRole('button', { name: 'Add Player' }).click();
    const updatedRows = await page.getByRole('row').all();
    lastRow = updatedRows[updatedRows.length - 1];
    await lastRow.getByLabel('Player Number').fill('2');
    await lastRow.getByLabel('Player Name').fill('Auto Player 2');
    
    // Save the changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Create game
    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    
    // Select team and verify players are auto-selected
    await page.selectOption('[data-testid="team-select"]', { label: 'Auto Select Team' });
    await expect(page.getByText('(2 selected)')).toBeVisible({ timeout: 5000 });
    
    // Verify both players are selected
    await expect(page.getByText('Auto Player 1').locator('..')).toHaveAttribute('class', /primary/);
    await expect(page.getByText('Auto Player 2').locator('..')).toHaveAttribute('class', /primary/);

    // Complete game creation
    await page.fill('#opponent', 'Auto Select Opponent');
    await page.getByRole('button', { name: 'Create Game' }).click();

    // Verify game was created
    await expect(page).toHaveURL('/#/games');
    await expect(page.getByText('Auto Select Team')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Auto Select Opponent')).toBeVisible({ timeout: 5000 });
  });

  test('should manage game clock', async ({ page }) => {
    // Create team and game first
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Clock Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');

    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Clock Test Team' });
    await page.fill('#opponent', 'Clock Opponent');
    await page.getByRole('button', { name: 'Create Game' }).click();

    // Go to game view
    await page.getByTestId('view-game-Clock Test Team').click();
    await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });
    
    // Wait for game view to load and check clock
    await page.waitForSelector('[data-testid="clock-display"]', { timeout: 5000 });
    const clockDisplay = page.getByTestId('clock-display');
    await expect(clockDisplay).toBeVisible({ timeout: 5000 });
    await expect(clockDisplay).toHaveText('20:00', { timeout: 5000 });

    // Start clock
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(1000);
    
    // Verify clock is running
    const timeAfterStart = await clockDisplay.getAttribute('data-seconds');
    expect(parseInt(timeAfterStart || '1200')).toBeLessThan(1200);  // 20 minutes = 1200 seconds

    // Stop clock
    await page.getByRole('button', { name: 'Stop' }).click();
    const timeAfterStop = await clockDisplay.getAttribute('data-seconds');
    
    // Wait and verify clock is stopped
    await page.waitForTimeout(1000);
    const timeAfterWait = await clockDisplay.getAttribute('data-seconds');
    expect(timeAfterStop).toBe(timeAfterWait);
  });

  test('should manage substitutions', async ({ page }) => {
    // Create team with players
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Sub Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');
    
    // Add players
    await page.getByTestId('view-team-Sub Test Team').click();
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Add player 1
    await page.getByRole('button', { name: 'Add Player' }).click();
    const rows = await page.getByRole('row').all();
    let lastRow = rows[rows.length - 1];
    await lastRow.getByLabel('Player Number').fill('1');
    await lastRow.getByLabel('Player Name').fill('Player One');
    
    // Add player 2
    await page.getByRole('button', { name: 'Add Player' }).click();
    const updatedRows = await page.getByRole('row').all();
    lastRow = updatedRows[updatedRows.length - 1];
    await lastRow.getByLabel('Player Number').fill('2');
    await lastRow.getByLabel('Player Name').fill('Player Two');
    
    // Save the changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Create game
    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Sub Test Team' });
    await page.fill('#opponent', 'Sub Opponent');
    // Players are auto-selected by default
    await page.getByRole('button', { name: 'Create Game' }).click();

    // Go to game view
    await page.getByTestId('view-game-Sub Test Team').click();
    await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });

    // Wait for game view to load
    await page.waitForSelector('[data-testid="clock-display"]', { timeout: 5000 });

    // Sub in Player One
    await page.getByRole('button', { name: 'Sub' }).click();
    await page.getByTestId('substitution-modal').getByText('Player One').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify player is on court
    await expect(page.getByText('Player One').locator('..').getByText('Court')).toBeVisible({ timeout: 5000 });

    // Sub out Player One
    await page.getByRole('button', { name: 'Sub' }).click();
    await page.getByTestId('substitution-modal').getByText('Player One').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify player is on bench
    await expect(page.getByText('Player One').locator('..').getByText('Bench')).toBeVisible({ timeout: 5000 });
  });

  test('should enforce maximum of 5 players on court', async ({ page }) => {
    // Create team with 7 players
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Max Players Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');
    
    // Add players
    await page.getByTestId('view-team-Max Players Team').click();
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Add 7 players
    for (let i = 1; i <= 7; i++) {
      await page.getByRole('button', { name: 'Add Player' }).click();
      const rows = await page.getByRole('row').all();
      const lastRow = rows[rows.length - 1];
      await lastRow.getByLabel('Player Number').fill(i.toString());
      await lastRow.getByLabel('Player Name').fill(`Max Player ${i}`);
    }
    
    // Save the changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Create game
    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Max Players Team' });
    await page.fill('#opponent', 'Max Players Opponent');
    // Players are auto-selected by default
    await page.getByRole('button', { name: 'Create Game' }).click();

    // Go to game view
    await page.getByTestId('view-game-Max Players Team').click();
    await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });

    // Wait for game view to load
    await page.waitForSelector('[data-testid="clock-display"]', { timeout: 5000 });

    // Open sub modal
    await page.getByRole('button', { name: 'Sub' }).click();

    // Select 6 players
    for (let i = 1; i <= 6; i++) {
      await page.getByRole('button', { name: `Max Player ${i} In` }).click();
    }

    // Verify warning is shown and done button is disabled
    await expect(page.getByTestId('too-many-players-warning')).toBeVisible();
    await expect(page.getByTestId('sub-modal-done')).toBeDisabled();

    // Deselect one player
    await page.getByRole('button', { name: 'Max Player 6 Cancel In' }).click();

    // Verify warning is gone and done button is enabled
    await expect(page.getByTestId('too-many-players-warning')).not.toBeVisible();
    await expect(page.getByTestId('sub-modal-done')).toBeEnabled();
  });

  test('should track player fouls', async ({ page }) => {
    // Create team with players
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Foul Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();
    await expect(page).toHaveURL('/#/teams');
    
    // Add players
    await page.getByTestId('view-team-Foul Test Team').click();
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Add test player
    await page.getByRole('button', { name: 'Add Player' }).click();
    const rows = await page.getByRole('row').all();
    const lastRow = rows[rows.length - 1];
    await lastRow.getByLabel('Player Number').fill('1');
    await lastRow.getByLabel('Player Name').fill('Foul Player');
    
    // Save the changes
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Create game
    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Foul Test Team' });
    await page.fill('#opponent', 'Foul Opponent');
    // Player is auto-selected by default
    await page.getByRole('button', { name: 'Create Game' }).click();

    // Go to game view
    await page.getByTestId('view-game-Foul Test Team').click();
    await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });
    await page.waitForSelector('[data-testid="clock-display"]', { timeout: 5000 });

    // Record first foul
    await page.getByRole('button', { name: 'Foul' }).first().click();
    
    // Verify warning is shown when no players are on court
    await expect(page.getByText('No players are currently on the court')).toBeVisible();

    // Close foul modal and sub in player
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.getByRole('button', { name: 'Sub' }).click();
    await page.getByTestId('substitution-modal').getByText('Foul Player').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Now record the foul for player on court
    await page.getByRole('button', { name: 'Foul' }).first().click();
    await page.getByTestId('foul-modal').getByText('Foul Player').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify foul count is updated
    await expect(page.getByTestId('player-1').locator('td').nth(3)).toHaveText('1');
    await expect(page.getByTestId('period-fouls')).toHaveText('1 fouls');

    // Record second foul
    await page.getByRole('button', { name: 'Foul' }).first().click();
    await page.getByTestId('foul-modal').getByText('Foul Player').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify foul counts are updated
    await expect(page.getByTestId('player-1').locator('td').nth(3)).toHaveText('2');
    await expect(page.getByTestId('period-fouls')).toHaveText('2 fouls');

    // End period and verify fouls persist
    await page.getByRole('button', { name: 'End Period' }).click();
    await page.getByTestId('end-period-modal').getByRole('button', { name: 'End Period' }).click();

    // Verify foul count persists in new period for player
    await expect(page.getByTestId('player-1').locator('td').nth(3)).toHaveText('2');
    // Verify new period starts with 0 fouls
    await expect(page.getByTestId('period-fouls')).toHaveText('0 fouls');
  });
});