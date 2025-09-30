import { BaseRepository, BatchRepository } from './BaseRepository';
import { Team, Player } from '@/types';
import { dbService } from '@/services/db';

/**
 * Repository for Team entities, handling all team-related data operations
 */
export class TeamRepository extends BaseRepository<Team> implements BatchRepository<Team> {
  
  /**
   * Save a team to storage
   */
  async save(team: Team): Promise<void> {
    await dbService.addTeam(team);
  }

  /**
   * Find a team by its ID
   */
  async findById(id: string): Promise<Team | null> {
    try {
      return await dbService.getTeam(id);
    } catch (error) {
      // If team not found, return null instead of throwing
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find all teams
   */
  async findAll(): Promise<Team[]> {
    return await dbService.getTeams();
  }

  /**
   * Delete a team by its ID
   */
  async delete(id: string): Promise<void> {
    await dbService.deleteTeam(id);
  }

  /**
   * Update an existing team
   */
  async update(team: Team): Promise<void> {
    await dbService.updateTeam(team);
  }

  /**
   * Find teams by name (partial match, case insensitive)
   */
  async findByName(name: string): Promise<Team[]> {
    const lowerName = name.toLowerCase();
    return this.findWhere(team => 
      team.name.toLowerCase().includes(lowerName)
    );
  }

  /**
   * Find team by exact name (case insensitive)
   */
  async findByExactName(name: string): Promise<Team | null> {
    const lowerName = name.toLowerCase();
    return this.findFirst(team => 
      team.name.toLowerCase() === lowerName
    );
  }

  /**
   * Find teams with a specific number of players
   */
  async findByPlayerCount(count: number): Promise<Team[]> {
    return this.findWhere(team => team.players.length === count);
  }

  /**
   * Find teams with player count in a range
   */
  async findByPlayerCountRange(minCount: number, maxCount?: number): Promise<Team[]> {
    return this.findWhere(team => {
      const playerCount = team.players.length;
      return playerCount >= minCount && (maxCount === undefined || playerCount <= maxCount);
    });
  }

  /**
   * Find teams that have a player with a specific jersey number
   */
  async findByPlayerNumber(playerNumber: string): Promise<Team[]> {
    return this.findWhere(team =>
      team.players.some(player => player.number === playerNumber)
    );
  }

  /**
   * Find teams that have a player with a specific name
   */
  async findByPlayerName(playerName: string): Promise<Team[]> {
    const lowerPlayerName = playerName.toLowerCase();
    return this.findWhere(team =>
      team.players.some(player => 
        player.name.toLowerCase().includes(lowerPlayerName)
      )
    );
  }

  /**
   * Get team statistics
   */
  async getTeamStats(): Promise<{
    totalTeams: number;
    totalPlayers: number;
    averagePlayersPerTeam: number;
    teamsWithoutPlayers: number;
    mostCommonPlayerCounts: Array<{ count: number; teams: number }>;
  }> {
    const allTeams = await this.findAll();
    const totalPlayers = allTeams.reduce((sum, team) => sum + team.players.length, 0);
    const teamsWithoutPlayers = allTeams.filter(team => team.players.length === 0).length;
    
    // Calculate most common player counts
    const playerCountFrequency = new Map<number, number>();
    allTeams.forEach(team => {
      const count = team.players.length;
      playerCountFrequency.set(count, (playerCountFrequency.get(count) || 0) + 1);
    });
    
    const mostCommonPlayerCounts = Array.from(playerCountFrequency.entries())
      .map(([count, teams]) => ({ count, teams }))
      .sort((a, b) => b.teams - a.teams)
      .slice(0, 5);

    return {
      totalTeams: allTeams.length,
      totalPlayers,
      averagePlayersPerTeam: allTeams.length > 0 ? Math.round((totalPlayers / allTeams.length) * 100) / 100 : 0,
      teamsWithoutPlayers,
      mostCommonPlayerCounts,
    };
  }

  // Player management within teams

  /**
   * Add a player to a team
   */
  async addPlayerToTeam(teamId: string, playerData: Omit<Player, 'id'>): Promise<Player> {
    return await dbService.addPlayerToTeam(teamId, playerData);
  }

  /**
   * Update a player in a team
   */
  async updatePlayerInTeam(teamId: string, player: Player): Promise<void> {
    await dbService.updatePlayerInTeam(teamId, player);
  }

  /**
   * Remove a player from a team
   */
  async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    await dbService.removePlayerFromTeam(teamId, playerId);
  }

  /**
   * Get all players from a specific team
   */
  async getTeamPlayers(teamId: string): Promise<Player[]> {
    const team = await this.findById(teamId);
    return team ? team.players : [];
  }

  /**
   * Find a player in a team by player ID
   */
  async findPlayerInTeam(teamId: string, playerId: string): Promise<Player | null> {
    const team = await this.findById(teamId);
    if (!team) return null;
    return team.players.find(player => player.id === playerId) || null;
  }

  /**
   * Check if a jersey number is available in a team
   */
  async isPlayerNumberAvailable(teamId: string, playerNumber: string, excludePlayerId?: string): Promise<boolean> {
    const team = await this.findById(teamId);
    if (!team) return false;
    
    return !team.players.some(player => 
      player.number === playerNumber && 
      (excludePlayerId === undefined || player.id !== excludePlayerId)
    );
  }

  /**
   * Get available jersey numbers for a team (1-99)
   */
  async getAvailablePlayerNumbers(teamId: string): Promise<string[]> {
    const team = await this.findById(teamId);
    if (!team) return [];
    
    const usedNumbers = new Set(team.players.map(player => player.number));
    const availableNumbers: string[] = [];
    
    for (let i = 1; i <= 99; i++) {
      const numberStr = i.toString();
      if (!usedNumbers.has(numberStr)) {
        availableNumbers.push(numberStr);
      }
    }
    
    return availableNumbers;
  }

  // Batch operations
  
  /**
   * Save multiple teams
   */
  async saveMany(teams: Team[]): Promise<void> {
    for (const team of teams) {
      await this.save(team);
    }
  }

  /**
   * Delete multiple teams by IDs
   */
  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }

  /**
   * Update multiple teams
   */
  async updateMany(teams: Team[]): Promise<void> {
    for (const team of teams) {
      await this.update(team);
    }
  }

  /**
   * Create a new team with generated ID
   */
  async create(teamData: Omit<Team, 'id'>): Promise<Team> {
    return await dbService.addTeam(teamData);
  }

  /**
   * Search teams by text query (team name, player names, player numbers)
   */
  async search(query: string): Promise<Team[]> {
    if (!query.trim()) return this.findAll();

    const lowerQuery = query.toLowerCase();
    return this.findWhere(team =>
      team.name.toLowerCase().includes(lowerQuery) ||
      team.players.some(player =>
        player.name.toLowerCase().includes(lowerQuery) ||
        player.number.includes(query)
      )
    );
  }

  /**
   * Validate team data before save/update
   */
  validateTeam(team: Partial<Team>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!team.name || team.name.trim().length === 0) {
      errors.push('Team name is required');
    }

    if (team.players) {
      // Check for duplicate player numbers
      const playerNumbers = team.players.map(p => p.number);
      const uniqueNumbers = new Set(playerNumbers);
      if (playerNumbers.length !== uniqueNumbers.size) {
        errors.push('Player jersey numbers must be unique within the team');
      }

      // Check for empty player names
      const playersWithoutNames = team.players.filter(p => !p.name || p.name.trim().length === 0);
      if (playersWithoutNames.length > 0) {
        errors.push('All players must have a name');
      }

      // Check for invalid jersey numbers
      const invalidNumbers = team.players.filter(p => !p.number || p.number.trim().length === 0);
      if (invalidNumbers.length > 0) {
        errors.push('All players must have a jersey number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Create and export a singleton instance
export const teamRepository = new TeamRepository();