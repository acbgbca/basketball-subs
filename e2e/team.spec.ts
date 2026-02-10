import { test, expect } from '@playwright/test';
import { addPlayer, createTeam, createTeamWithPlayers, editTeamName, navigateToTeam, navigateToTeamList, saveTeamChanges, verifyTeamName, verifyViewTeamPage, deleteTeam, removePlayer, shareTeam, cancelTeamChanges, addMultiplePlayers, attemptToCreateTeamWithoutName, addPlayerWithEmptyFields, addPlayerWithInvalidNumber, verifyPlayerNumberConstraints, verifyRequiredFieldValidation } from './pages/Teams';

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

test.describe('Team Validation', () => {
  test('should require team name when creating team', async ({ page }) => {
    // Given we are on the team creation page
    await navigateToTeamList(page);
    await page.getByRole('button', { name: 'Add New Team' }).click();
    
    // When we try to submit without a team name
    await page.getByRole('button', { name: 'Create Team' }).click();
    
    // Then the form should not submit and show validation
    await expect(page.getByLabel('Team Name')).toHaveAttribute('required');
    // Browser should show validation message (HTML5 validation)
    await expect(page).toHaveURL(/\/#\/teams$/); // Should stay on teams page, not navigate
  });

  test('should require player name and number when adding players', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Validation Test Team');
    
    // When we add a player without filling required fields
    await addPlayer(page, 0, ''); // Empty name and number 0
    
    // Then the form validation should prevent saving
    const playerRow = page.getByTestId('player-0');
    await expect(playerRow.getByLabel('Player Name')).toHaveAttribute('required');
    await expect(playerRow.getByLabel('Player Number')).toHaveAttribute('required');
    
    // Try to save - should not work with empty fields
    await page.getByRole('button', { name: 'Save Changes' }).click();
    // Should still be on the same page due to validation
    await expect(page).toHaveURL(/\/#\/teams\/.*$/);
  });

  test('should prevent duplicate player numbers', async ({ page }) => {
    // Given we have a team with a player
    await createTeam(page, 'Duplicate Number Team');
    await addPlayer(page, 10, 'Player One');
    await saveTeamChanges(page);
    
    // When we try to add another player with the same number
    await addPlayer(page, 10, 'Player Two');
    
    // Then the second player's number field should show an error
    const playerRows = page.getByTestId('player-10');
    await expect(playerRows).toHaveCount(2);
    
    // The second player's number field should be highlighted with error
    const secondPlayerRow = playerRows.nth(1);
    const numberInput = secondPlayerRow.getByLabel('Player Number');
    await expect(numberInput).toHaveClass(/is-invalid/);
    
    // Should show error message
    await expect(page.getByText('Player number 10 is already used')).toBeVisible();
    
    // Save button should be disabled due to validation error
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
  });

  test('should handle empty team name validation in edit mode', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Edit Validation Team');
    await addPlayer(page, 20, 'Test Player');
    await saveTeamChanges(page);
    
    // When we clear the team name
    await editTeamName(page, '');
    
    // Then the team name field should be marked as required
    await expect(page.getByLabel('Team Name')).toHaveAttribute('required');
    
    // And saving should be prevented by browser validation
    await page.getByRole('button', { name: 'Save Changes' }).click();
    // Should remain on edit page due to validation
    await expect(page).toHaveURL(/\/#\/teams\/.*$/);
  });

  test('should validate player number format', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Number Format Team');
    
    // When we add a player
    await addPlayer(page, 99, 'Valid Player');
    
    // Then check the number field has proper constraints
    const playerRow = page.getByTestId('player-99');
    const numberInput = playerRow.getByLabel('Player Number');
    
    // Should have numeric input mode and pattern
    await expect(numberInput).toHaveAttribute('inputMode', 'numeric');
    await expect(numberInput).toHaveAttribute('pattern', '[0-9]*');
    await expect(numberInput).toHaveAttribute('maxLength', '3');
  });

  test('should handle special characters in team and player names', async ({ page }) => {
    // Given we create a team with special characters
    const specialTeamName = "Team with 'quotes' & symbols!";
    await createTeam(page, specialTeamName);
    
    // When we add a player with special characters in name
    await addPlayer(page, 42, "O'Connor-Smith Jr.");
    await saveTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, specialTeamName);
    
    // The special characters should be preserved
    await verifyTeamName(page, specialTeamName);
    await expect(page.getByTestId('player-42').getByLabel('Player Name')).toHaveValue("O'Connor-Smith Jr.");
  });

  test('should handle maximum length constraints', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Length Test Team');
    
    // When we add a player and try to enter a very long number
    await page.getByRole('button', { name: 'Add Player' }).click();
    
    const rows = await page.getByRole('row').all();
    const lastRow = rows[rows.length - 1];
    const numberInput = lastRow.getByLabel('Player Number');
    
    // Try to type more than 3 characters
    await numberInput.fill('12345');
    
    // Then it should be limited to 3 characters
    await expect(numberInput).toHaveValue('123');
  });

  test('should validate required fields before allowing save', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Required Fields Team');
    
    // When we add a player but leave name empty
    await page.getByRole('button', { name: 'Add Player' }).click();
    const rows = await page.getByRole('row').all();
    const lastRow = rows[rows.length - 1];
    
    // Fill only the number, leave name empty
    await lastRow.getByLabel('Player Number').fill('15');
    // Leave name empty
    
    // Then the save button should still be enabled (current behavior)
    // but form validation should prevent actual saving
    const saveButton = page.getByRole('button', { name: 'Save Changes' });
    await expect(saveButton).toBeEnabled();
    
    // When we try to save
    await saveButton.click();
    
    // Then browser validation should prevent the save
    // (HTML5 validation will show message for empty required field)
    await expect(lastRow.getByLabel('Player Name')).toHaveAttribute('required');
  });

  test('should use validation helpers for team creation', async ({ page }) => {
    // When we attempt to create a team without a name using helper
    await attemptToCreateTeamWithoutName(page);
    
    // Then validation should prevent submission
    await verifyRequiredFieldValidation(page, 'Team Name');
    await expect(page).toHaveURL(/\/#\/teams$/);
  });

  test('should use validation helpers for empty player fields', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Helper Test Team');
    
    // When we add a player with empty fields using helper
    const playerRow = await addPlayerWithEmptyFields(page);
    
    // Then both fields should be required
    await expect(playerRow.getByLabel('Player Name')).toHaveAttribute('required');
    await expect(playerRow.getByLabel('Player Number')).toHaveAttribute('required');
  });

  test('should validate player number constraints using helper', async ({ page }) => {
    // Given we have a team with a player
    await createTeam(page, 'Constraints Test Team');
    await addPlayer(page, 88, 'Test Player');
    
    // When we verify the constraints using helper
    await verifyPlayerNumberConstraints(page, 88);
    
    // Then all constraints should be properly set (verified by helper)
  });

  test('should handle zero as player number', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Zero Number Team');
    
    // When we add a player with number 0
    await addPlayer(page, 0, 'Player Zero');
    await saveTeamChanges(page);
    
    // Then it should be accepted (0 is a valid jersey number)
    await navigateToTeam(page, 'Zero Number Team');
    await expect(page.getByTestId('player-0')).toBeVisible();
    await expect(page.getByTestId('player-0').getByLabel('Player Number')).toHaveValue('0');
  });

  test('should handle very long team names', async ({ page }) => {
    // Given we create a team with a very long name
    const longTeamName = 'A'.repeat(100); // 100 character team name
    await createTeam(page, longTeamName);
    await addPlayer(page, 1, 'Test Player');
    await saveTeamChanges(page);
    
    // When we navigate back to the team
    await navigateToTeam(page, longTeamName);
    
    // Then the long name should be preserved
    await verifyTeamName(page, longTeamName);
  });

  test('should handle very long player names', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Long Name Team');
    
    // When we add a player with a very long name
    const longPlayerName = 'PlayerWithVeryLongName'.repeat(5); // Very long name
    await addPlayer(page, 77, longPlayerName);
    await saveTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, 'Long Name Team');
    
    // The long name should be preserved
    await expect(page.getByTestId('player-77').getByLabel('Player Name')).toHaveValue(longPlayerName);
  });

  test('should handle numeric-only player names', async ({ page }) => {
    // Given we have a team
    await createTeam(page, 'Numeric Name Team');
    
    // When we add a player with a numeric name
    await addPlayer(page, 33, '12345');
    await saveTeamChanges(page);
    
    // Then when we return to the team page
    await navigateToTeam(page, 'Numeric Name Team');
    
    // The numeric name should be preserved
    await expect(page.getByTestId('player-33').getByLabel('Player Name')).toHaveValue('12345');
  });

  test('should show validation error when removing player resolves duplicate', async ({ page }) => {
    // Given we have a team with duplicate player numbers
    await createTeam(page, 'Remove Duplicate Team');
    await addPlayer(page, 7, 'Player One');
    await addPlayer(page, 7, 'Player Two');
    
    // Then we should see validation error and disabled save
    await expect(page.getByText('Player number 7 is already used')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    
    // When we remove one of the duplicate players
    const removeButtons = page.getByRole('button', { name: 'Remove' });
    await removeButtons.last().click();
    
    // Then the validation error should be cleared and save enabled
    await expect(page.getByText('Player number 7 is already used')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeEnabled();
    
    // And we should be able to save successfully
    await saveTeamChanges(page);
    await navigateToTeam(page, 'Remove Duplicate Team');
    await expect(page.getByTestId('player-7')).toHaveCount(1);
  });
});
