// Shared team helpers for Playwright tests
import { Page } from '@playwright/test';

const LIST_TEAMS_PAGE = "/#/teams"
const EDIT_TEAM_REGEX = /\/#\/teams\/.*$/

export async function navigateToTeamList(page: Page) {
  await page.goto(LIST_TEAMS_PAGE);
  await page.waitForSelector('text=Teams');
}

export async function createTeam(page: Page, teamName: string) {
    await navigateToTeamList(page);
    await page.getByRole('button', { name: 'Add New Team' }).click();
    await page.fill('#teamName', teamName);
    await page.getByRole('button', { name: 'Create Team' }).click();
    await page.waitForURL(EDIT_TEAM_REGEX);
}

export async function createTeamWithPlayers(page: Page, teamName: string, players: { number: number, name: string }[]) {
    await createTeam(page, teamName); 
    for (const player of players) {
        await addPlayer(page, player.number, player.name);
    }
    await page.getByRole('button', { name: 'Save Changes' }).click();
    await page.getByRole('button', { name: 'Done' }).click();
}

export async function addPlayer(page: Page, playerNumber: number, playerName: string) {
    await page.getByRole('button', { name: 'Add Player' }).click();

    const rows = await page.getByRole('row').all();
    let lastRow = rows[rows.length - 1];
    await lastRow.getByLabel('Player Number').fill(playerNumber.toString());
    await lastRow.getByLabel('Player Name').fill(playerName);
}

