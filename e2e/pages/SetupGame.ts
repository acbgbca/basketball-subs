// Shared game helpers for Playwright tests
import { Page, expect } from '@playwright/test';

const LIST_GAMES_PAGE = "/#/games"

export async function navigateToGameList(page: Page) {
  await page.goto(LIST_GAMES_PAGE);
  await page.getByRole('heading', { name: 'Games' }).waitFor();
}

export async function createANewGame(page: Page, teamName: string, opponentName: string) {
  await navigateToGameList(page);
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.waitForSelector('[data-testid="team-select"]', { timeout: 5000 });
  await page.selectOption('[data-testid="team-select"]', { label: teamName });
  await page.fill('#opponent', opponentName);
  await page.getByRole('button', { name: 'Create Game' }).click();

  await expect(page).toHaveURL(LIST_GAMES_PAGE);
}

