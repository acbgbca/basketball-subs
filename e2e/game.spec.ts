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

  test('should manage game clock', async ({ page }) => {
    // Create team and game first
    await page.goto('/#/teams/new');
    await page.waitForSelector('#teamName', { timeout: 5000 });
    await page.fill('#teamName', 'Clock Test Team');
    await page.getByRole('button', { name: 'Create Team' }).click();

    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Clock Test Team' });
    await page.fill('#opponent', 'Clock Opponent');
    await page.getByRole('button', { name: 'Create Game' }).click();

    // Go to game view
    await page.getByRole('link', { name: 'Clock Test Team' }).click();
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
    
    // Add players
    await page.getByRole('link', { name: 'Sub Test Team' }).click();
    await page.waitForURL(/\/#\/teams\/.*$/, { timeout: 5000 });
    
    // Explicitly wait for the Add Player button and use first() to handle multiple matches
    await page.getByRole('button', { name: 'Add Player' }).first().click();
    await page.waitForSelector('#playerName', { timeout: 5000 });
    await page.fill('#playerName', 'Player One');
    await page.fill('#playerNumber', '1');
    await page.getByTestId('add-player-button').click();
    
    // Wait for the first player to be added before adding the second
    await expect(page.getByText('Player One')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: 'Add Player' }).first().click();
    await page.waitForSelector('#playerName', { timeout: 5000 });
    await page.fill('#playerName', 'Player Two');
    await page.fill('#playerNumber', '2');
    await page.getByTestId('add-player-button').click();

    // Create game
    await page.goto('/#/games/new');
    await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
    await page.selectOption('[data-testid="team-select"]', { label: 'Sub Test Team' });
    await page.fill('#opponent', 'Sub Opponent');
    
    // Select players for the game
    await page.getByLabel('1 - Player One').check();
    await page.getByLabel('2 - Player Two').check();
    
    await page.getByRole('button', { name: 'Create Game' }).click();

    // Go to game view
    await page.getByRole('link', { name: 'Sub Test Team' }).click();
    await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });

    // Wait for game view to load
    await page.waitForSelector('[data-testid="clock-display"]', { timeout: 5000 });

    // Sub in Player One
    await page.getByRole('button', { name: 'Sub' }).click();
    await page.getByText('Player One').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify player is on court
    await expect(page.getByText('Player One').locator('..').getByText('Court')).toBeVisible({ timeout: 5000 });

    // Sub out Player One
    await page.getByRole('button', { name: 'Sub' }).click();
    await page.getByText('Player One').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify player is on bench
    await expect(page.getByText('Player One').locator('..').getByText('Bench')).toBeVisible({ timeout: 5000 });
  });
});