import { z, ZodError } from 'zod';

// Player validation schema
export const PlayerSchema = z.object({
  id: z.string().min(1, 'Player ID is required'),
  name: z.string().min(1, 'Player name is required').max(50, 'Player name too long'),
  number: z.string().min(1, 'Jersey number is required').max(3, 'Jersey number too long'),
});

// Team validation schema
export const TeamSchema = z.object({
  id: z.string().min(1, 'Team ID is required'),
  name: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  players: z.array(PlayerSchema).min(1, 'Team must have at least one player'),
});

// Foul validation schema
export const FoulSchema = z.object({
  id: z.string().min(1, 'Foul ID is required'),
  player: PlayerSchema,
  periodId: z.string().min(1, 'Period ID is required'),
  timeRemaining: z.number().min(0, 'Time remaining cannot be negative'),
});

// Substitution validation schema
export const SubstitutionSchema = z.object({
  id: z.string().min(1, 'Substitution ID is required'),
  player: PlayerSchema,
  timeInEvent: z.string().min(1, 'Time in event ID is required'),
  timeOutEvent: z.string().nullable(),
  secondsPlayed: z.number().nullable(),
  periodId: z.string().min(1, 'Period ID is required'),
});

// Substitution Event validation schema
export const SubstitutionEventSchema = z.object({
  id: z.string().min(1, 'Event ID is required'),
  eventTime: z.number().min(0, 'Event time cannot be negative'),
  periodId: z.string().min(1, 'Period ID is required'),
  subbedIn: z.array(PlayerSchema),
  playersOut: z.array(PlayerSchema),
});

// Period validation schema
export const PeriodSchema = z.object({
  id: z.string().min(1, 'Period ID is required'),
  periodNumber: z.number().int().min(1, 'Period number must be at least 1'),
  length: z.union([z.literal(10), z.literal(20)], {
    errorMap: () => ({ message: 'Period length must be 10 or 20 minutes' }),
  }),
  substitutions: z.array(SubstitutionSchema),
  fouls: z.array(FoulSchema),
  subEvents: z.array(SubstitutionEventSchema),
});

// Game validation schema
export const GameSchema = z.object({
  id: z.string().min(1, 'Game ID is required'),
  date: z.date(),
  team: TeamSchema,
  opponent: z.string().min(1, 'Opponent name is required').max(100, 'Opponent name too long'),
  players: z.array(PlayerSchema).min(1, 'Game must have at least one player'),
  periods: z.array(PeriodSchema).min(1, 'Game must have at least one period'),
  activePlayers: z.array(z.string()),
  currentPeriod: z.number().int().min(0, 'Current period cannot be negative'),
  isRunning: z.boolean(),
  periodStartTime: z.number().optional(),
  periodTimeElapsed: z.number().optional(),
}).refine(
  (data) => data.currentPeriod < data.periods.length,
  {
    message: 'Current period must be within available periods',
    path: ['currentPeriod'],
  }
).refine(
  (data) => {
    // Check that active players are all from the game's player list
    const gamePlayerIds = new Set(data.players.map(p => p.id));
    return data.activePlayers.every(id => gamePlayerIds.has(id));
  },
  {
    message: 'All active players must be from the game roster',
    path: ['activePlayers'],
  }
).refine(
  (data) => data.activePlayers.length <= 5,
  {
    message: 'Cannot have more than 5 active players',
    path: ['activePlayers'],
  }
);

// Partial schemas for forms and updates
export const GameCreateSchema = GameSchema.omit({ id: true });
export const GameUpdateSchema = GameSchema.partial().required({ id: true });

// Validation for substitution forms
export const SubstitutionFormSchema = z.object({
  subbedIn: z.array(z.string()).optional(),
  playersOut: z.array(z.string()).optional(),
  eventTime: z.number().min(0, 'Event time cannot be negative'),
}).refine(
  (data) => (data.subbedIn && data.subbedIn.length > 0) || (data.playersOut && data.playersOut.length > 0),
  {
    message: 'Must select at least one player to substitute in or out',
    path: ['subbedIn'],
  }
);

// Validation for foul forms
export const FoulFormSchema = z.object({
  playerId: z.string().min(1, 'Player must be selected'),
  timeRemaining: z.number().min(0, 'Time remaining cannot be negative'),
});

// Game settings validation
export const GameSettingsSchema = z.object({
  periodLength: z.union([z.literal(10), z.literal(20)], {
    errorMap: () => ({ message: 'Period length must be 10 or 20 minutes' }),
  }),
  numberOfPeriods: z.number().int().min(1, 'Must have at least 1 period').max(10, 'Too many periods'),
  teamName: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  opponent: z.string().min(1, 'Opponent name is required').max(100, 'Opponent name too long'),
  selectedPlayers: z.array(z.string()).min(1, 'Must select at least one player'),
  startingPlayers: z.array(z.string()).max(5, 'Cannot start with more than 5 players'),
});

// Timer validation
export const TimerSchema = z.object({
  timeRemaining: z.number().min(0, 'Time cannot be negative'),
  isRunning: z.boolean(),
  periodStartTime: z.number().nullable(),
  periodTimeElapsed: z.number().min(0, 'Elapsed time cannot be negative'),
});

// Export validation functions
export const validateGame = (data: unknown) => GameSchema.safeParse(data);
export const validateGameCreate = (data: unknown) => GameCreateSchema.safeParse(data);
export const validateGameUpdate = (data: unknown) => GameUpdateSchema.safeParse(data);
export const validateSubstitutionForm = (data: unknown) => SubstitutionFormSchema.safeParse(data);
export const validateFoulForm = (data: unknown) => FoulFormSchema.safeParse(data);
export const validateGameSettings = (data: unknown) => GameSettingsSchema.safeParse(data);
export const validateTimer = (data: unknown) => TimerSchema.safeParse(data);

// Utility function to get validation errors as strings
export const getValidationErrors = (result: z.SafeParseReturnType<any, any>): string[] => {
  if (result.success) return [];
  
  if (!result.error) return [];
  
  // Handle ZodError structure - access the issues property
  const errors = result.error.issues || result.error.errors || [];
  
  return errors.map((error: any) => {
    const path = error.path && error.path.length > 0 ? `${error.path.join('.')}: ` : '';
    return `${path}${error.message}`;
  });
};

// Utility function to validate player jersey numbers are unique
export const validateUniquePlayerNumbers = (players: { id: string; number: string }[]): string[] => {
  const errors: string[] = [];
  const numberCounts = new Map<string, number>();
  
  players.forEach(player => {
    const count = numberCounts.get(player.number) || 0;
    numberCounts.set(player.number, count + 1);
  });
  
  numberCounts.forEach((count, number) => {
    if (count > 1) {
      errors.push(`Jersey number ${number} is used by multiple players`);
    }
  });
  
  return errors;
};