import {
  validateGame,
  validateGameCreate,
  validateSubstitutionForm,
  validateFoulForm,
  validateGameSettings,
  getValidationErrors,
  validateUniquePlayerNumbers,
} from '../../validations/gameValidation';
import { createMockGame, createMockTeam, createMockPlayer } from '../test-utils';

describe('gameValidation', () => {
  describe('validateGame', () => {
    it('should validate a complete valid game', () => {
      const validGame = createMockGame();
      const result = validateGame(validGame);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validGame);
      }
    });

    it('should reject game with missing required fields', () => {
      const invalidGame = {
        // Missing required fields
      };

      const result = validateGame(invalidGame);
      expect(result.success).toBe(false);
    });

    it('should reject game with invalid team structure', () => {
      const invalidGame = createMockGame({
        team: {
          id: '',
          name: '',
          players: [],
        } as any,
      });

      const result = validateGame(invalidGame);
      expect(result.success).toBe(false);
    });

    it('should reject game with empty opponent name', () => {
      const invalidGame = createMockGame({
        opponent: '',
      });

      const result = validateGame(invalidGame);
      expect(result.success).toBe(false);
    });

    it('should reject game with no players', () => {
      const invalidGame = createMockGame({
        players: [],
      });

      const result = validateGame(invalidGame);
      expect(result.success).toBe(false);
    });

    it('should reject game with no periods', () => {
      const invalidGame = createMockGame({
        periods: [],
      });

      const result = validateGame(invalidGame);
      expect(result.success).toBe(false);
    });

    it('should reject game with current period out of bounds', () => {
      const game = createMockGame();
      const invalidGame = {
        ...game,
        currentPeriod: 5, // More than available periods
      };

      const result = validateGame(invalidGame);
      expect(result.success).toBe(false);
    });

    it('should reject game with too many active players', () => {
      const game = createMockGame();
      const invalidGame = {
        ...game,
        activePlayers: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], // 6 players (max is 5)
      };

      const result = validateGame(invalidGame);
      expect(result.success).toBe(false);
    });

    it('should reject game with active players not in roster', () => {
      const game = createMockGame();
      const invalidGame = {
        ...game,
        activePlayers: ['non-existent-player'],
      };

      const result = validateGame(invalidGame);
      expect(result.success).toBe(false);
    });
  });

  describe('validateGameCreate', () => {
    it('should validate game creation data without ID', () => {
      const gameData = createMockGame();
      const { id, ...gameCreateData } = gameData;

      const result = validateGameCreate(gameCreateData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid creation data', () => {
      const invalidData = {
        // Missing required fields
        opponent: 'Test Opponent',
      };

      const result = validateGameCreate(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSubstitutionForm', () => {
    it('should validate valid substitution with players in', () => {
      const validSubstitution = {
        subbedIn: ['player1', 'player2'],
        playersOut: [],
        eventTime: 600,
      };

      const result = validateSubstitutionForm(validSubstitution);
      expect(result.success).toBe(true);
    });

    it('should validate valid substitution with players out', () => {
      const validSubstitution = {
        subbedIn: [],
        playersOut: ['player1'],
        eventTime: 600,
      };

      const result = validateSubstitutionForm(validSubstitution);
      expect(result.success).toBe(true);
    });

    it('should validate substitution with both players in and out', () => {
      const validSubstitution = {
        subbedIn: ['player1'],
        playersOut: ['player2'],
        eventTime: 600,
      };

      const result = validateSubstitutionForm(validSubstitution);
      expect(result.success).toBe(true);
    });

    it('should reject substitution with no players', () => {
      const invalidSubstitution = {
        subbedIn: [],
        playersOut: [],
        eventTime: 600,
      };

      const result = validateSubstitutionForm(invalidSubstitution);
      expect(result.success).toBe(false);
    });

    it('should reject substitution with negative event time', () => {
      const invalidSubstitution = {
        subbedIn: ['player1'],
        playersOut: [],
        eventTime: -10,
      };

      const result = validateSubstitutionForm(invalidSubstitution);
      expect(result.success).toBe(false);
    });
  });

  describe('validateFoulForm', () => {
    it('should validate valid foul form', () => {
      const validFoul = {
        playerId: 'player1',
        timeRemaining: 600,
      };

      const result = validateFoulForm(validFoul);
      expect(result.success).toBe(true);
    });

    it('should reject foul with empty player ID', () => {
      const invalidFoul = {
        playerId: '',
        timeRemaining: 600,
      };

      const result = validateFoulForm(invalidFoul);
      expect(result.success).toBe(false);
    });

    it('should reject foul with negative time', () => {
      const invalidFoul = {
        playerId: 'player1',
        timeRemaining: -10,
      };

      const result = validateFoulForm(invalidFoul);
      expect(result.success).toBe(false);
    });
  });

  describe('validateGameSettings', () => {
    it('should validate valid game settings', () => {
      const validSettings = {
        periodLength: 20 as const,
        numberOfPeriods: 2,
        teamName: 'Test Team',
        opponent: 'Test Opponent',
        selectedPlayers: ['player1', 'player2'],
        startingPlayers: ['player1'],
      };

      const result = validateGameSettings(validSettings);
      expect(result.success).toBe(true);
    });

    it('should reject invalid period length', () => {
      const invalidSettings = {
        periodLength: 15 as any, // Invalid period length
        numberOfPeriods: 2,
        teamName: 'Test Team',
        opponent: 'Test Opponent',
        selectedPlayers: ['player1'],
        startingPlayers: ['player1'],
      };

      const result = validateGameSettings(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject too many starting players', () => {
      const invalidSettings = {
        periodLength: 20 as const,
        numberOfPeriods: 2,
        teamName: 'Test Team',
        opponent: 'Test Opponent',
        selectedPlayers: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
        startingPlayers: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], // Too many
      };

      const result = validateGameSettings(invalidSettings);
      expect(result.success).toBe(false);
    });

    it('should reject empty team name', () => {
      const invalidSettings = {
        periodLength: 20 as const,
        numberOfPeriods: 2,
        teamName: '',
        opponent: 'Test Opponent',
        selectedPlayers: ['player1'],
        startingPlayers: ['player1'],
      };

      const result = validateGameSettings(invalidSettings);
      expect(result.success).toBe(false);
    });
  });

  describe('getValidationErrors', () => {
    it('should return empty array for successful validation', () => {
      const validGame = createMockGame();
      const result = validateGame(validGame);
      const errors = getValidationErrors(result);

      expect(errors).toEqual([]);
    });

    it('should return formatted error messages for failed validation', () => {
      const invalidGame = {
        id: '',
        opponent: '',
      };

      const result = validateGame(invalidGame);
      const errors = getValidationErrors(result);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.every(error => typeof error === 'string')).toBe(true);
    });

    it('should include field paths in error messages', () => {
      const invalidGame = {
        id: 'valid-id',
        team: {
          id: '',
          name: '',
        },
      };

      const result = validateGame(invalidGame);
      const errors = getValidationErrors(result);

      expect(errors.some(error => error.includes('team.'))).toBe(true);
    });
  });

  describe('validateUniquePlayerNumbers', () => {
    it('should return no errors for unique numbers', () => {
      const players = [
        { id: '1', number: '1' },
        { id: '2', number: '2' },
        { id: '3', number: '3' },
      ];

      const errors = validateUniquePlayerNumbers(players);
      expect(errors).toEqual([]);
    });

    it('should return errors for duplicate numbers', () => {
      const players = [
        { id: '1', number: '1' },
        { id: '2', number: '1' }, // Duplicate
        { id: '3', number: '2' },
        { id: '4', number: '2' }, // Duplicate
      ];

      const errors = validateUniquePlayerNumbers(players);
      expect(errors).toContain('Jersey number 1 is used by multiple players');
      expect(errors).toContain('Jersey number 2 is used by multiple players');
    });

    it('should handle empty player list', () => {
      const errors = validateUniquePlayerNumbers([]);
      expect(errors).toEqual([]);
    });
  });
});