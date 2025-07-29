import { test, expect } from '@playwright/test';
import { addPlayer, createTeam, createTeamWithPlayers, editTeamName, saveTeamChanges, verifyTeamName, verifyViewTeamPage } from './pages/Teams';

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
    
    // Then the player appears in the table
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
    
    // Verify updates are saved - should show the new name
    await verifyTeamName(page, 'Updated Team Name');
  });
});
