import { z } from 'zod';

// Core player validation schema
export const PlayerSchema = z.object({
  id: z.string().min(1, 'Player ID is required'),
  name: z.string()
    .min(1, 'Player name is required')
    .max(50, 'Player name must be 50 characters or less')
    .regex(/^[a-zA-Z\s'-\.]+$/, 'Player name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .transform(name => name.trim()),
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

// Player creation schema (without ID)
export const PlayerCreateSchema = PlayerSchema.omit({ id: true });

// Player update schema (ID required, other fields optional)
export const PlayerUpdateSchema = PlayerSchema.partial().required({ id: true });

// Player form schema for UI forms
export const PlayerFormSchema = z.object({
  name: z.string()
    .min(1, 'Player name is required')
    .max(50, 'Player name must be 50 characters or less')
    .regex(/^[a-zA-Z\s'-\.]+$/, 'Player name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .transform(name => name.trim()),
  number: z.string()
    .min(1, 'Jersey number is required')
    .max(3, 'Jersey number must be 3 characters or less')
    .regex(/^\d+$/, 'Jersey number must contain only digits')
    .refine(
      (val) => {
        const num = parseInt(val);
        return num >= 0 && num <= 99;
      },
      { message: 'Jersey number should be between 0 and 99 for basketball' }
    ),
});

// Player search/filter schema
export const PlayerSearchSchema = z.object({
  query: z.string().optional(),
  jerseyNumber: z.string().optional(),
  sortBy: z.enum(['name', 'number']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Player stats validation (for game statistics)
export const PlayerStatsSchema = z.object({
  playerId: z.string().min(1, 'Player ID is required'),
  gameId: z.string().min(1, 'Game ID is required'),
  minutesPlayed: z.number().min(0, 'Minutes played cannot be negative'),
  fouls: z.number().int().min(0, 'Fouls cannot be negative').max(10, 'Too many fouls'),
  substitutions: z.number().int().min(0, 'Substitutions cannot be negative'),
  periodsPlayed: z.number().int().min(0, 'Periods played cannot be negative'),
});

// Player profile schema (extended player info)
export const PlayerProfileSchema = PlayerSchema.extend({
  position: z.enum(['PG', 'SG', 'SF', 'PF', 'C', 'G', 'F']).optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  dateOfBirth: z.date().optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

// Bulk player operations
export const BulkPlayerCreateSchema = z.array(PlayerCreateSchema)
  .min(1, 'Must provide at least one player')
  .max(50, 'Cannot create more than 50 players at once');

export const BulkPlayerUpdateSchema = z.array(PlayerUpdateSchema)
  .min(1, 'Must provide at least one player')
  .max(50, 'Cannot update more than 50 players at once');

// Player import from CSV/text
export const PlayerImportSchema = z.object({
  name: z.string().min(1, 'Player name is required'),
  number: z.string().min(1, 'Jersey number is required'),
  position: z.string().optional(),
  notes: z.string().optional(),
});

export const BulkPlayerImportSchema = z.array(PlayerImportSchema)
  .min(1, 'Must provide at least one player')
  .max(100, 'Cannot import more than 100 players at once');

// Export validation functions
export const validatePlayer = (data: unknown) => PlayerSchema.safeParse(data);
export const validatePlayerCreate = (data: unknown) => PlayerCreateSchema.safeParse(data);
export const validatePlayerUpdate = (data: unknown) => PlayerUpdateSchema.safeParse(data);
export const validatePlayerForm = (data: unknown) => PlayerFormSchema.safeParse(data);
export const validatePlayerSearch = (data: unknown) => PlayerSearchSchema.safeParse(data);
export const validatePlayerStats = (data: unknown) => PlayerStatsSchema.safeParse(data);
export const validatePlayerProfile = (data: unknown) => PlayerProfileSchema.safeParse(data);
export const validateBulkPlayerCreate = (data: unknown) => BulkPlayerCreateSchema.safeParse(data);
export const validateBulkPlayerUpdate = (data: unknown) => BulkPlayerUpdateSchema.safeParse(data);
export const validatePlayerImport = (data: unknown) => PlayerImportSchema.safeParse(data);
export const validateBulkPlayerImport = (data: unknown) => BulkPlayerImportSchema.safeParse(data);

// Utility functions for player validation

/**
 * Validate player name format and common issues
 */
export const validatePlayerName = (name: string): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.push('Player name is required');
    return { isValid: false, warnings, errors };
  }

  if (trimmedName.length < 2) {
    warnings.push('Player name is very short');
  }

  if (trimmedName.length > 30) {
    warnings.push('Player name is quite long');
  }

  // Check for suspicious patterns
  if (/^\d+$/.test(trimmedName)) {
    warnings.push('Player name appears to be only numbers');
  }

  if (/^[^a-zA-Z]*$/.test(trimmedName)) {
    warnings.push('Player name should contain letters');
  }

  // Check for repeated characters (like "aaa" or "xxx")
  if (/(.)\1{3,}/.test(trimmedName)) {
    warnings.push('Player name has repeated characters');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
};

/**
 * Validate jersey number format and basketball conventions
 */
export const validateJerseyNumber = (number: string): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!number || number.trim().length === 0) {
    errors.push('Jersey number is required');
    return { isValid: false, warnings, errors };
  }

  const trimmedNumber = number.trim();
  const num = parseInt(trimmedNumber);

  if (isNaN(num)) {
    errors.push('Jersey number must be numeric');
    return { isValid: false, warnings, errors };
  }

  if (num < 0) {
    errors.push('Jersey number cannot be negative');
  }

  if (num > 99) {
    warnings.push('Jersey numbers above 99 are uncommon in basketball');
  }

  // Basketball-specific conventions
  if (num === 0) {
    warnings.push('Jersey number 0 is allowed but uncommon');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
};

/**
 * Check for duplicate players in a list
 */
export const checkForDuplicates = (players: { name: string; number: string }[]): {
  duplicateNames: string[];
  duplicateNumbers: string[];
} => {
  const nameCount = new Map<string, number>();
  const numberCount = new Map<string, number>();

  players.forEach(player => {
    const normalizedName = player.name.toLowerCase().trim();
    nameCount.set(normalizedName, (nameCount.get(normalizedName) || 0) + 1);
    numberCount.set(player.number, (numberCount.get(player.number) || 0) + 1);
  });

  const duplicateNames = Array.from(nameCount.entries())
    .filter(([, count]) => count > 1)
    .map(([name]) => name);

  const duplicateNumbers = Array.from(numberCount.entries())
    .filter(([, count]) => count > 1)
    .map(([number]) => number);

  return { duplicateNames, duplicateNumbers };
};

/**
 * Suggest available jersey numbers
 */
export const suggestAvailableNumbers = (
  usedNumbers: string[],
  preferredRange: [number, number] = [1, 15]
): string[] => {
  const used = new Set(usedNumbers);
  const suggestions: string[] = [];
  const [min, max] = preferredRange;

  // First, suggest numbers in preferred range
  for (let i = min; i <= max && suggestions.length < 10; i++) {
    const numStr = i.toString();
    if (!used.has(numStr)) {
      suggestions.push(numStr);
    }
  }

  // If we need more suggestions, expand the range
  if (suggestions.length < 10) {
    for (let i = max + 1; i <= 99 && suggestions.length < 10; i++) {
      const numStr = i.toString();
      if (!used.has(numStr)) {
        suggestions.push(numStr);
      }
    }
  }

  return suggestions;
};

/**
 * Parse player data from text input (name and number)
 */
export const parsePlayerFromText = (text: string): {
  name: string;
  number: string;
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  let name = '';
  let number = '';

  const trimmed = text.trim();
  if (!trimmed) {
    errors.push('Input is empty');
    return { name, number, isValid: false, errors };
  }

  // Try to parse formats like "John Doe #23", "23 John Doe", "John Doe (23)", etc.
  const patterns = [
    /^(.+?)\s*#(\d+)$/,           // "John Doe #23"
    /^(.+?)\s*\((\d+)\)$/,        // "John Doe (23)"
    /^(\d+)\s+(.+)$/,             // "23 John Doe"
    /^(.+?)\s+(\d+)$/,            // "John Doe 23"
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      if (pattern.source.startsWith('^(\\d+)')) {
        // Number first format
        number = match[1].trim();
        name = match[2].trim();
      } else {
        // Name first format
        name = match[1].trim();
        number = match[2].trim();
      }
      break;
    }
  }

  // If no pattern matched, assume it's just a name
  if (!name && !number) {
    name = trimmed;
    errors.push('Could not determine jersey number from input');
  }

  return {
    name,
    number,
    isValid: errors.length === 0 && name.length > 0 && number.length > 0,
    errors,
  };
};

/**
 * Get validation errors as formatted strings
 */
export const getPlayerValidationErrors = (result: z.SafeParseReturnType<any, any>): string[] => {
  if (result.success) return [];
  
  return result.error.errors.map(error => {
    const path = error.path.length > 0 ? `${error.path.join('.')}: ` : '';
    return `${path}${error.message}`;
  });
};