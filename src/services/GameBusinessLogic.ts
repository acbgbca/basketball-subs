import { Game, Player, SubstitutionEvent, Foul } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Business logic service for game-related operations
 * Contains pure business logic separated from data access and UI concerns
 */
export class GameBusinessLogic {
  
  /**
   * Calculate total minutes played by a player across all periods
   */
  calculatePlayerMinutes(game: Game, playerId: string, activePlayers: Set<string>, timeRemaining: number, currentPeriod: number): number {
    let totalMinutes = 0;
    
    // Calculate completed time from all periods
    for (const period of game.periods) {
      for (const substitution of period.substitutions) {
        if (substitution.player.id === playerId && substitution.secondsPlayed !== null) {
          totalMinutes += substitution.secondsPlayed || 0;
        }
      }
    }
    
    // Add current active time if player is currently on court
    if (activePlayers.has(playerId) && currentPeriod < game.periods.length) {
      const currentPeriodData = game.periods[currentPeriod];
      const activeSub = currentPeriodData.substitutions.find(
        sub => sub.player.id === playerId && sub.timeOutEvent === null
      );
      
      if (activeSub && activeSub.timeInEvent) {
        const timeInEvent = currentPeriodData.subEvents.find(e => e.id === activeSub.timeInEvent);
        if (timeInEvent) {
          totalMinutes += (timeInEvent.eventTime - timeRemaining);
        }
      }
    }
    
    return totalMinutes;
  }

  /**
   * Calculate total fouls committed by a player across all periods
   */
  calculatePlayerFouls(game: Game, playerId: string): number {
    return game.periods.reduce((total, period) => {
      return total + (period.fouls?.filter(foul => foul.player.id === playerId).length || 0);
    }, 0);
  }

  /**
   * Calculate fouls for the current period
   */
  calculatePeriodFouls(game: Game, currentPeriod: number): number {
    if (currentPeriod >= game.periods.length) return 0;
    return game.periods[currentPeriod].fouls?.length || 0;
  }

  /**
   * Validate a substitution event according to basketball rules
   */
  validateSubstitution(event: SubstitutionEvent, game: Game, activePlayers: Set<string>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const maxPlayersOnCourt = 5;

    // Basic validation
    if (event.subbedIn.length === 0 && event.playersOut.length === 0) {
      errors.push('Substitution must involve at least one player');
    }

    // Check for duplicate players in same event
    const subbedInIds = new Set(event.subbedIn.map(p => p.id));
    const playersOutIds = new Set(event.playersOut.map(p => p.id));
    
    for (const playerId of subbedInIds) {
      if (playersOutIds.has(playerId)) {
        errors.push('A player cannot be substituted in and out in the same event');
      }
    }

    // Validate players being subbed out are actually active
    for (const player of event.playersOut) {
      if (!activePlayers.has(player.id)) {
        errors.push(`${player.name} (#${player.number}) is not currently active`);
      }
    }

    // Validate players being subbed in are not already active
    for (const player of event.subbedIn) {
      if (activePlayers.has(player.id)) {
        errors.push(`${player.name} (#${player.number}) is already on the court`);
      }
    }

    // Check player count limits
    const newActiveCount = activePlayers.size - event.playersOut.length + event.subbedIn.length;
    if (newActiveCount > maxPlayersOnCourt) {
      errors.push(`Cannot exceed ${maxPlayersOnCourt} players on court. This would result in ${newActiveCount} players.`);
    }

    if (newActiveCount < 0) {
      errors.push('Cannot have negative number of active players');
    }

    // Warnings for potentially problematic situations
    if (newActiveCount < 3) {
      warnings.push('Playing with fewer than 3 players may not be advisable');
    }

    // Check for foul-related warnings
    for (const player of event.subbedIn) {
      const fouls = this.calculatePlayerFouls(game, player.id);
      if (fouls >= 4) {
        warnings.push(`${player.name} (#${player.number}) has ${fouls} fouls and is at risk of fouling out`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate if a foul can be added
   */
  validateFoul(playerId: string, game: Game): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if player exists in the game
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      errors.push('Player not found in this game');
      return { isValid: false, errors };
    }

    // Calculate current fouls
    const currentFouls = this.calculatePlayerFouls(game, playerId);
    
    // Check foul limits (5 fouls = fouled out in most basketball rules)
    if (currentFouls >= 5) {
      errors.push(`${player.name} (#${player.number}) has already fouled out (${currentFouls} fouls)`);
    } else if (currentFouls === 4) {
      warnings.push(`${player.name} (#${player.number}) will foul out with this foul (currently has ${currentFouls} fouls)`);
    } else if (currentFouls === 3) {
      warnings.push(`${player.name} (#${player.number}) will have 4 fouls and be at risk of fouling out`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Check if a game can be started
   */
  canStartGame(game: Game): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Must have at least one period defined
    if (!game.periods || game.periods.length === 0) {
      errors.push('Game must have at least one period defined');
    }

    // Must have players
    if (!game.players || game.players.length === 0) {
      errors.push('Game must have at least one player');
    }

    // Check for minimum viable team size
    if (game.players && game.players.length < 5) {
      warnings.push(`Game has only ${game.players.length} players. Consider having at least 5 players for substitutions.`);
    }

    // Check if game is already running
    if (game.isRunning) {
      errors.push('Game is already running');
    }

    // Validate active players count
    if (game.activePlayers.length === 0) {
      errors.push('Must have at least one active player to start the game');
    } else if (game.activePlayers.length > 5) {
      errors.push('Cannot start game with more than 5 active players');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Check if a period can be ended
   */
  canEndPeriod(game: Game): ValidationResult {
    const errors: string[] = [];

    // Game must be running
    if (!game.isRunning) {
      errors.push('Cannot end period when game is not running');
    }

    // Must have a current period
    if (game.currentPeriod >= game.periods.length) {
      errors.push('No current period to end');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if a new period can be started
   */
  canStartNewPeriod(game: Game): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Previous period should be ended
    if (game.isRunning) {
      errors.push('Current period must be ended before starting a new one');
    }

    // Check if there are more periods available
    if (game.currentPeriod >= game.periods.length - 1) {
      warnings.push('This appears to be the last period in the game');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get game status summary
   */
  getGameStatus(game: Game): {
    isActive: boolean;
    currentPeriodNumber: number;
    totalPeriods: number;
    activePlayerCount: number;
    totalFouls: number;
    isGameComplete: boolean;
  } {
    const totalFouls = game.periods.reduce((sum, period) => sum + (period.fouls?.length || 0), 0);
    const isGameComplete = game.currentPeriod >= game.periods.length - 1 && !game.isRunning;

    return {
      isActive: game.isRunning,
      currentPeriodNumber: game.currentPeriod + 1, // Display as 1-based
      totalPeriods: game.periods.length,
      activePlayerCount: game.activePlayers.length,
      totalFouls,
      isGameComplete,
    };
  }

  /**
   * Calculate team statistics for the game
   */
  calculateTeamStats(game: Game): {
    totalPlayTime: number;
    averagePlayTimePerPlayer: number;
    totalSubstitutions: number;
    totalFouls: number;
    playersWithFouls: number;
    mostActivePlayer: { player: Player; minutes: number } | null;
  } {
    const activePlayers = new Set(game.activePlayers);
    let totalPlayTime = 0;
    let totalSubstitutions = 0;
    let mostActivePlayer: { player: Player; minutes: number } | null = null;
    let maxMinutes = 0;

    // Calculate stats for each player
    for (const player of game.players) {
      const minutes = this.calculatePlayerMinutes(game, player.id, activePlayers, 0, game.currentPeriod);
      totalPlayTime += minutes;

      if (minutes > maxMinutes) {
        maxMinutes = minutes;
        mostActivePlayer = { player, minutes };
      }
    }

    // Count total substitutions
    for (const period of game.periods) {
      totalSubstitutions += period.subEvents?.length || 0;
    }

    const totalFouls = game.periods.reduce((sum, period) => sum + (period.fouls?.length || 0), 0);
    const playersWithFouls = game.players.filter(player => 
      this.calculatePlayerFouls(game, player.id) > 0
    ).length;

    return {
      totalPlayTime,
      averagePlayTimePerPlayer: game.players.length > 0 ? totalPlayTime / game.players.length : 0,
      totalSubstitutions,
      totalFouls,
      playersWithFouls,
      mostActivePlayer,
    };
  }
}

// Create and export a singleton instance
export const gameBusinessLogic = new GameBusinessLogic();