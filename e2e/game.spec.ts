import { test, expect } from '@playwright/test';

test.describe('Game Management', () => {
  test('should create a new game', async ({ page }) => {
    // First create a team
    await page.goto('/teams/new');
    await page.fill('#teamName', 'Game Test Team');
    await page.click('button[type="submit"]');

    // Create a new game
    await page.goto('/games/new');
    await page.selectOption('select[name="team"]', { label: 'Game Test Team' });
    await page.fill('input[name="opponent"]', 'Test Opponent');
    await page.fill('input[name="date"]', '2025-05-02');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/games');
    await expect(page.getByText('Game Test Team')).toBeVisible();
    await expect(page.getByText('Test Opponent')).toBeVisible();
  });

  test('should manage game clock', async ({ page }) => {
    // Create team and game first
    await page.goto('/teams/new');
    await page.fill('#teamName', 'Clock Test Team');
    await page.click('button[type="submit"]');

    await page.goto('/games/new');
    await page.selectOption('select[name="team"]', { label: 'Clock Test Team' });
    await page.fill('input[name="opponent"]', 'Clock Opponent');
    await page.fill('input[name="date"]', '2025-05-02');
    await page.click('button[type="submit"]');

    // Go to game view
    await page.getByText('Clock Test Team').click();
    
    // Check initial clock state
    const clockDisplay = page.getByTestId('clock-display');
    await expect(clockDisplay).toHaveText('10:00');

    // Start clock
    await page.getByRole('button', { name: 'Start' }).click();
    await page.waitForTimeout(1000);
    
    // Verify clock is running
    const timeAfterStart = await clockDisplay.getAttribute('data-seconds');
    expect(parseInt(timeAfterStart || '600')).toBeLessThan(600);

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
    await page.goto('/teams/new');
    await page.fill('#teamName', 'Sub Test Team');
    await page.click('button[type="submit"]');
    
    // Add players
    await page.getByText('Sub Test Team').click();
    await page.getByText('Add Player').click();
    await page.fill('input[name="playerName"]', 'Player One');
    await page.fill('input[name="playerNumber"]', '1');
    await page.click('button:has-text("Save")');
    
    await page.getByText('Add Player').click();
    await page.fill('input[name="playerName"]', 'Player Two');
    await page.fill('input[name="playerNumber"]', '2');
    await page.click('button:has-text("Save")');

    // Create game
    await page.goto('/games/new');
    await page.selectOption('select[name="team"]', { label: 'Sub Test Team' });
    await page.fill('input[name="opponent"]', 'Sub Opponent');
    await page.fill('input[name="date"]', '2025-05-02');
    await page.click('button[type="submit"]');

    // Go to game view
    await page.getByText('Sub Test Team').click();

    // Open substitution modal
    await page.getByText('Sub').click();
    
    // Sub in Player One
    await page.getByText('Player One').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify player is on court
    const playerOneRow = page.getByTestId('player-1');
    await expect(playerOneRow.getByText('Court')).toBeVisible();

    // Sub out Player One
    await page.getByText('Sub').click();
    await page.getByText('Player One').click();
    await page.getByRole('button', { name: 'Done' }).click();

    // Verify player is on bench
    await expect(playerOneRow.getByText('Bench')).toBeVisible();
  });
});