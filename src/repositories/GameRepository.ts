import { BaseRepository, BatchRepository } from './BaseRepository';
import { Game } from '@/types';
import { dbService } from '@/services/db';

/**
 * Repository for Game entities, handling all game-related data operations
 */
export class GameRepository extends BaseRepository<Game> implements BatchRepository<Game> {
  
  /**
   * Save a game to storage
   */
  async save(game: Game): Promise<void> {
    await dbService.addGame(game);
  }

  /**
   * Find a game by its ID
   */
  async findById(id: string): Promise<Game | null> {
    try {
      return await dbService.getGame(id);
    } catch (error) {
      // If game not found, return null instead of throwing
      if (error instanceof Error && error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find all games
   */
  async findAll(): Promise<Game[]> {
    return await dbService.getGames();
  }

  /**
   * Delete a game by its ID
   */
  async delete(id: string): Promise<void> {
    await dbService.deleteGame(id);
  }

  /**
   * Update an existing game
   */
  async update(game: Game): Promise<void> {
    await dbService.updateGame(game);
  }

  /**
   * Find games by team ID
   */
  async findByTeamId(teamId: string): Promise<Game[]> {
    return this.findWhere(game => game.team.id === teamId);
  }

  /**
   * Find games by opponent name
   */
  async findByOpponent(opponent: string): Promise<Game[]> {
    const lowerOpponent = opponent.toLowerCase();
    return this.findWhere(game => 
      game.opponent.toLowerCase().includes(lowerOpponent)
    );
  }

  /**
   * Find games within a date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Game[]> {
    return this.findWhere(game => {
      const gameDate = new Date(game.date);
      return gameDate >= startDate && gameDate <= endDate;
    });
  }

  /**
   * Find games by current period
   */
  async findByCurrentPeriod(period: number): Promise<Game[]> {
    return this.findWhere(game => game.currentPeriod === period);
  }

  /**
   * Find active/running games
   */
  async findActiveGames(): Promise<Game[]> {
    return this.findWhere(game => game.isRunning);
  }

  /**
   * Find completed games (games where all periods are finished)
   */
  async findCompletedGames(): Promise<Game[]> {
    return this.findWhere(game => {
      if (game.periods.length === 0) return false;
      const lastPeriod = Math.max(...game.periods.map(p => p.periodNumber));
      return game.currentPeriod >= lastPeriod && !game.isRunning;
    });
  }

  /**
   * Find recent games (last N games)
   */
  async findRecentGames(limit: number = 10): Promise<Game[]> {
    const games = await this.findAll();
    return games
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  /**
   * Get game statistics
   */
  async getGameStats(): Promise<{
    totalGames: number;
    activeGames: number;
    completedGames: number;
    teamsWithGames: string[];
    averagePeriodsPerGame: number;
  }> {
    const allGames = await this.findAll();
    const activeGames = await this.findActiveGames();
    const completedGames = await this.findCompletedGames();
    
    const teamsWithGames = [...new Set(allGames.map(game => game.team.name))];
    const averagePeriodsPerGame = allGames.length > 0 
      ? allGames.reduce((sum, game) => sum + game.periods.length, 0) / allGames.length 
      : 0;

    return {
      totalGames: allGames.length,
      activeGames: activeGames.length,
      completedGames: completedGames.length,
      teamsWithGames,
      averagePeriodsPerGame: Math.round(averagePeriodsPerGame * 100) / 100,
    };
  }

  // Batch operations
  
  /**
   * Save multiple games
   */
  async saveMany(games: Game[]): Promise<void> {
    for (const game of games) {
      await this.save(game);
    }
  }

  /**
   * Delete multiple games by IDs
   */
  async deleteMany(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.delete(id);
    }
  }

  /**
   * Update multiple games
   */
  async updateMany(games: Game[]): Promise<void> {
    for (const game of games) {
      await this.update(game);
    }
  }

  /**
   * Create a new game with generated ID
   */
  async create(gameData: Omit<Game, 'id'>): Promise<Game> {
    return await dbService.addGame(gameData);
  }

  /**
   * Search games by text query (team name, opponent, player names)
   */
  async search(query: string): Promise<Game[]> {
    if (!query.trim()) return this.findAll();

    const lowerQuery = query.toLowerCase();
    return this.findWhere(game =>
      game.team.name.toLowerCase().includes(lowerQuery) ||
      game.opponent.toLowerCase().includes(lowerQuery) ||
      game.players.some(player =>
        player.name.toLowerCase().includes(lowerQuery) ||
        player.number.includes(query)
      )
    );
  }
}

// Create and export a singleton instance
export const gameRepository = new GameRepository();