import { z } from 'zod';

// Player validation schema (reusable)
export const PlayerValidationSchema = z.object({
  id: z.string().min(1, 'Player ID is required'),
  name: z.string()
    .min(1, 'Player name is required')
    .max(50, 'Player name must be 50 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'Player name can only contain letters, spaces, hyphens, and apostrophes'),
  number: z.string()
    .min(1, 'Jersey number is required')
    .max(3, 'Jersey number must be 3 characters or less')
    .regex(/^\d+$/, 'Jersey number must contain only digits')
    .refine(
      (val) => {
        const num = parseInt(val);
        return num >= 0 && num <= 999;
      },
      { message: 'Jersey number must be between 0 and 999' }
    ),
});

// Team validation schema
export const TeamValidationSchema = z.object({
  id: z.string().min(1, 'Team ID is required'),
  name: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s'-]+$/, 'Team name can only contain letters, numbers, spaces, hyphens, and apostrophes'),
  players: z.array(PlayerValidationSchema)
    .max(50, 'Team cannot have more than 50 players'),
}).refine(
  (data) => {
    // Check for unique player numbers
    const numbers = data.players.map(p => p.number);
    const uniqueNumbers = new Set(numbers);
    return numbers.length === uniqueNumbers.size;
  },
  {
    message: 'All player jersey numbers must be unique within the team',
    path: ['players'],
  }
).refine(
  (data) => {
    // Check for unique player names (case insensitive)
    const names = data.players.map(p => p.name.toLowerCase().trim());
    const uniqueNames = new Set(names);
    return names.length === uniqueNames.size;
  },
  {
    message: 'All player names must be unique within the team',
    path: ['players'],
  }
);

// Partial schemas for different operations
export const TeamCreateSchema = TeamValidationSchema.omit({ id: true });
export const TeamUpdateSchema = TeamValidationSchema.partial().required({ id: true });

// Player creation schema (without ID)
export const PlayerCreateSchema = PlayerValidationSchema.omit({ id: true });
export const PlayerUpdateSchema = PlayerValidationSchema.partial().required({ id: true });

// Team form validation (for UI forms)
export const TeamFormSchema = z.object({
  name: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be 100 characters or less'),
  players: z.array(z.object({
    name: z.string()
      .min(1, 'Player name is required')
      .max(50, 'Player name must be 50 characters or less'),
    number: z.string()
      .min(1, 'Jersey number is required')
      .max(3, 'Jersey number must be 3 characters or less')
      .regex(/^\d+$/, 'Jersey number must be numeric'),
  })).optional(),
});

// Player form validation (for adding/editing individual players)
export const PlayerFormSchema = z.object({
  name: z.string()
    .min(1, 'Player name is required')
    .max(50, 'Player name must be 50 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'Player name can only contain letters, spaces, hyphens, and apostrophes'),
  number: z.string()
    .min(1, 'Jersey number is required')
    .max(3, 'Jersey number must be 3 characters or less')
    .regex(/^\d+$/, 'Jersey number must contain only digits'),
});

// Bulk player import schema
export const BulkPlayerImportSchema = z.array(
  z.object({
    name: z.string().min(1, 'Player name is required'),
    number: z.string().min(1, 'Jersey number is required'),
  })
).min(1, 'Must provide at least one player');

// Team search/filter schema
export const TeamSearchSchema = z.object({
  query: z.string().optional(),
  minPlayers: z.number().int().min(0).optional(),
  maxPlayers: z.number().int().min(0).optional(),
  sortBy: z.enum(['name', 'playerCount', 'dateCreated']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
}).refine(
  (data) => {
    if (data.minPlayers !== undefined && data.maxPlayers !== undefined) {
      return data.minPlayers <= data.maxPlayers;
    }
    return true;
  },
  {
    message: 'Minimum players cannot be greater than maximum players',
    path: ['minPlayers'],
  }
);

// Export validation functions
export const validateTeam = (data: unknown) => TeamValidationSchema.safeParse(data);
export const validateTeamCreate = (data: unknown) => TeamCreateSchema.safeParse(data);
export const validateTeamUpdate = (data: unknown) => TeamUpdateSchema.safeParse(data);
export const validatePlayer = (data: unknown) => PlayerValidationSchema.safeParse(data);
export const validatePlayerCreate = (data: unknown) => PlayerCreateSchema.safeParse(data);
export const validatePlayerUpdate = (data: unknown) => PlayerUpdateSchema.safeParse(data);
export const validateTeamForm = (data: unknown) => TeamFormSchema.safeParse(data);
export const validatePlayerForm = (data: unknown) => PlayerFormSchema.safeParse(data);
export const validateBulkPlayerImport = (data: unknown) => BulkPlayerImportSchema.safeParse(data);
export const validateTeamSearch = (data: unknown) => TeamSearchSchema.safeParse(data);

// Utility functions for team validation

/**
 * Check if a jersey number is available in a team
 */
export const isJerseyNumberAvailable = (
  players: { number: string; id?: string }[],
  number: string,
  excludePlayerId?: string
): boolean => {
  return !players.some(player => 
    player.number === number && 
    (excludePlayerId === undefined || player.id !== excludePlayerId)
  );
};

/**
 * Get available jersey numbers for a team (1-99)
 */
export const getAvailableJerseyNumbers = (players: { number: string }[]): string[] => {
  const usedNumbers = new Set(players.map(p => p.number));
  const available: string[] = [];
  
  for (let i = 1; i <= 99; i++) {
    const numberStr = i.toString();
    if (!usedNumbers.has(numberStr)) {
      available.push(numberStr);
    }
  }
  
  return available;
};

/**
 * Validate team roster for game eligibility
 */
export const validateTeamForGame = (team: { name: string; players: any[] }): {
  isEligible: boolean;
  warnings: string[];
  errors: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!team.name || team.name.trim().length === 0) {
    errors.push('Team must have a name');
  }

  if (team.players.length === 0) {
    errors.push('Team must have at least one player');
  } else if (team.players.length < 5) {
    warnings.push(`Team has only ${team.players.length} players. Consider having at least 5 for substitutions.`);
  }

  if (team.players.length > 15) {
    warnings.push(`Team has ${team.players.length} players. Large rosters may be difficult to manage.`);
  }

  return {
    isEligible: errors.length === 0,
    warnings,
    errors,
  };
};

/**
 * Validate player data for common issues
 */
export const validatePlayerData = (player: { name: string; number: string }): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  if (!player.name || player.name.trim().length === 0) {
    errors.push('Player name is required');
  } else if (player.name.trim().length < 2) {
    warnings.push('Player name is very short');
  } else if (player.name.length > 30) {
    warnings.push('Player name is quite long');
  }

  // Number validation
  if (!player.number || player.number.trim().length === 0) {
    errors.push('Jersey number is required');
  } else {
    const num = parseInt(player.number);
    if (isNaN(num)) {
      errors.push('Jersey number must be numeric');
    } else if (num < 0 || num > 99) {
      warnings.push('Jersey numbers are typically between 0-99');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
};

/**
 * Get validation errors as formatted strings
 */
export const getTeamValidationErrors = (result: z.SafeParseReturnType<any, any>): string[] => {
  if (result.success) return [];
  
  return result.error.errors.map(error => {
    const path = error.path.length > 0 ? `${error.path.join('.')}: ` : '';
    return `${path}${error.message}`;
  });
};