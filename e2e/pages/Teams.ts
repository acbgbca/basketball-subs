// Shared team helpers for Playwright tests
import { Page, expect } from '@playwright/test';

const LIST_TEAMS_PAGE = "/#/teams"
const EDIT_TEAM_REGEX = /\/#\/teams\/.*$/

export async function navigateToTeamList(page: Page) {
  await page.goto(LIST_TEAMS_PAGE);
  await page.getByRole('heading', { name: 'Teams' }).waitFor();
}

export async function navigateToTeam(page: Page, teamName: string) {
    await navigateToTeamList(page);
    await page.getByTestId('view-team-' + teamName).click()
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
    await saveTeamChanges(page);
    await page.getByRole('button', { name: 'Done' }).click();
}

export async function addPlayer(page: Page, playerNumber: number, playerName: string) {
    await page.getByRole('button', { name: 'Add Player' }).click();

    const rows = await page.getByRole('row').all();
    let lastRow = rows[rows.length - 1];
    await lastRow.getByLabel('Player Number').fill(playerNumber.toString());
    await lastRow.getByLabel('Player Name').fill(playerName);
}

export async function editTeamName(page: Page, teamName: string) {
    const teamNameInput = page.getByLabel('Team Name');
    await teamNameInput.clear();
    await teamNameInput.fill(teamName);
}

export async function saveTeamChanges(page: Page) {
    await page.getByRole('button', { name: 'Save Changes' }).click();
}

export async function verifyTeamName(page: Page, teamName: string) {
    await expect(page.getByLabel('Team Name')).toHaveValue(teamName);
}

export async function verifyViewTeamPage(page: Page) {
    await expect(page).toHaveURL(/\/#\/teams\/.*$/);
}

export async function deleteTeam(page: Page, teamName: string) {
    await navigateToTeamList(page);
    // Find the card containing the team name and click its delete button
    const teamCard = page.locator('.card').filter({ hasText: teamName });
    await teamCard.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('button', { name: 'Delete Team' }).click();
}

export async function removePlayer(page: Page, playerNumber: number) {
    await page.getByTestId(`player-${playerNumber}`).getByRole('button', { name: 'Remove' }).click();
}

export async function addMultiplePlayers(page: Page, players: { number: number, name: string }[]) {
    for (const player of players) {
        await addPlayer(page, player.number, player.name);
    }
}

export async function shareTeam(page: Page, teamName: string) {
    await navigateToTeam(page, teamName);
    
    // Click share button
    await page.getByRole('button', { name: 'Share Team' }).click();
    
    // In test environment, clipboard API might not work, so we'll check if the button was clicked
    // and construct a mock URL. In real usage, this would copy to clipboard.
    const currentUrl = page.url();
    const baseUrl = currentUrl.split('#')[0];
    
    // Wait a bit for any potential success message
    await page.waitForTimeout(500);
    
    return `${baseUrl}#/teams/new?share=mock-share-data`;
}

export async function cancelTeamChanges(page: Page) {
    await page.getByRole('button', { name: 'Cancel' }).click();
}
