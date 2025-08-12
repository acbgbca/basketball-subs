// Shared game running helpers for Playwright tests
import { Page, expect } from '@playwright/test';

export async function navigateToGame(page: Page, teamName: string) {
  await page.goto('/#/games');
  await page.getByTestId(`view-game-${teamName}`).click();
  await page.waitForURL(/\/#\/games\/.*$/, { timeout: 5000 });
}

export async function makeSubstitution(page: Page, playersIn: string[], playersOut: string[]) {
  await page.getByRole('button', { name: 'Sub' }).click();
  const modal = page.getByTestId('substitution-modal');
  
  // Wait for modal to be fully loaded
  await modal.waitFor();
  
  // Select players to sub in
  for (const playerName of playersIn) {
    await modal.getByRole('button', { name: `${playerName} In` }).click();
  }
  
  // Select players to sub out
  for (const playerName of playersOut) {
    await modal.getByRole('button', { name: `${playerName} Out` }).click();
  }
  
  await modal.getByTestId('sub-modal-done').click();
  
  // Wait for modal to close
  await modal.waitFor({ state: 'hidden' });
}

export async function editLastSubstitution(page: Page) {
  const subTable = page.getByTestId('substitution-table');
  await subTable.getByRole('button', { name: 'Edit' }).first().click();
}

export async function cancelSubstitutionModal(page: Page) {
  const modal = page.getByTestId('substitution-modal');
  await modal.getByRole('button', { name: 'Cancel' }).click();
}

export async function verifyPlayersOnCourt(page: Page, expectedCount: number) {
  // Use the simple text selector that we know works
  const courtElements = page.locator('text=Court');
  await expect(courtElements).toHaveCount(expectedCount);
}

export async function getOnCourtPlayerCount(page: Page): Promise<number> {
  const courtElements = page.locator('text=Court');
  return await courtElements.count();
}