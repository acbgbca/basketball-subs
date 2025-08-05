import { test, expect } from '@playwright/test';
import { addPlayer, createTeam, createTeamWithPlayers, editTeamName, navigateToTeam, navigateToTeamList, saveTeamChanges, verifyTeamName, verifyViewTeamPage, deleteTeam, removePlayer, shareTeam, cancelTeamChanges, addMultiplePlayers } from './pages/Teams';

test.describe('Team Management', () => {
  test('should create a new team and navigate to team view', async ({ page }) => {
    // Given we have no team
    // When we create a team
    await createTeam(page, 'Test Team');
    // Then we should be shown the team details page
    await verifyViewTeamPage(page);
    await verifyTeamName(page, 'Test Team');
  });
  
  test('should add a player to team', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Player Test Team');
    // When we add a player
    await addPlayer(page, 23, 'John Doe')
    // and Save the changes
    await saveTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, 'Player Test Team');
    // The player should appear
    await expect(page.getByTestId('player-23')).toBeVisible();
    await expect(page.getByTestId('player-23').getByLabel('Player Name')).toHaveValue('John Doe');
    await expect(page.getByTestId('player-23').getByLabel('Player Number')).toHaveValue('23');
  });

  test('should edit team name', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Edit Name Team');
    
    // When we edit team name
    await editTeamName(page, 'Updated Team Name');
    // and save changes
    await saveTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, 'Updated Team Name');
    // Verify updates are saved - should show the new name
    await verifyTeamName(page, 'Updated Team Name');
  });

  test('should delete a team', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Team To Delete');
    // Add a player to make changes, then save
    await addPlayer(page, 99, 'Test Player');
    await saveTeamChanges(page);
    await page.getByRole('button', { name: 'Done' }).click();
    
    // When we delete the team
    await deleteTeam(page, 'Team To Delete');
    
    // Then the team should no longer appear in the list
    await expect(page.getByTestId('view-team-Team To Delete')).not.toBeVisible();
  });

  test('should remove a player from team', async ({ page }) => {
    // Given we have a team with a player
    await createTeam(page, 'Remove Player Team');
    await addPlayer(page, 42, 'Player To Remove');
    await saveTeamChanges(page);
    
    // When we remove the player
    await removePlayer(page, 42);
    await saveTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, 'Remove Player Team');
    // The player should no longer appear
    await expect(page.getByTestId('player-42')).not.toBeVisible();
  });

  test('should edit player details', async ({ page }) => {
    // Given we have a team with a player
    await createTeam(page, 'Edit Player Team');
    await addPlayer(page, 10, 'Original Name');
    await saveTeamChanges(page);
    
    // When we edit just the player name (simpler test)
    const playerRow = page.getByTestId('player-10');
    const nameInput = playerRow.getByLabel('Player Name');
    await nameInput.clear();
    await nameInput.fill('Updated Name');
    await saveTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, 'Edit Player Team');
    // The player should have updated name
    await expect(page.getByTestId('player-10')).toBeVisible();
    await expect(page.getByTestId('player-10').getByLabel('Player Name')).toHaveValue('Updated Name');
    await expect(page.getByTestId('player-10').getByLabel('Player Number')).toHaveValue('10');
  });

  test('should add multiple players to team', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Multiple Players Team');
    
    // When we add multiple players
    const players = [
      { number: 1, name: 'Player One' },
      { number: 2, name: 'Player Two' },
      { number: 3, name: 'Player Three' }
    ];
    await addMultiplePlayers(page, players);
    await saveTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, 'Multiple Players Team');
    // All players should appear
    for (const player of players) {
      await expect(page.getByTestId(`player-${player.number}`)).toBeVisible();
      await expect(page.getByTestId(`player-${player.number}`).getByLabel('Player Name')).toHaveValue(player.name);
      await expect(page.getByTestId(`player-${player.number}`).getByLabel('Player Number')).toHaveValue(player.number.toString());
    }
  });

  test('should share team', async ({ page }) => {
    // Given we have a team with players
    await createTeamWithPlayers(page, 'Share Test Team', [
      { number: 7, name: 'Shared Player' }
    ]);
    
    // When we share the team
    const shareUrl = await shareTeam(page, 'Share Test Team');
    
    // Then we should get a valid share URL
    expect(shareUrl).toContain('share=');
    expect(shareUrl).toContain('teams/new');
  });

  test('should open import modal', async ({ page }) => {
    // Given we are on the teams list page
    await navigateToTeamList(page);
    
    // When we click the import button
    await page.getByRole('button', { name: 'Import' }).click();
    
    // Then the import modal should be visible
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.getByText('Import Team')).toBeVisible();
    await expect(page.getByText('Paste the full share URL or just the share code below:')).toBeVisible();
    
    // And we can close it
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('should cancel team changes without saving', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Cancel Changes Team');
    await addPlayer(page, 50, 'Original Player');
    await saveTeamChanges(page);
    
    // When we make changes but cancel
    await editTeamName(page, 'Should Not Save');
    await addPlayer(page, 51, 'Should Not Save Player');
    await cancelTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, 'Cancel Changes Team');
    // The original data should be preserved
    await verifyTeamName(page, 'Cancel Changes Team');
    await expect(page.getByTestId('player-50')).toBeVisible();
    await expect(page.getByTestId('player-51')).not.toBeVisible();
  });
});
