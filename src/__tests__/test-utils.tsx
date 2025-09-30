import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Game, Team, Player, Period, Substitution, Foul, SubstitutionEvent } from '../types';

// Mock providers wrapper for testing
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock data factories for testing

/**
 * Create a mock player for testing
 */
export const createMockPlayer = (overrides: Partial<Player> = {}): Player => ({
  id: uuidv4(),
  name: 'Test Player',
  number: '1',
  ...overrides,
});

/**
 * Create multiple mock players
 */
export const createMockPlayers = (count: number, namePrefix = 'Player'): Player[] => {
  return Array.from({ length: count }, (_, index) => 
    createMockPlayer({
      name: `${namePrefix} ${index + 1}`,
      number: (index + 1).toString(),
    })
  );
};

/**
 * Create a mock team for testing
 */
export const createMockTeam = (overrides: Partial<Team> = {}): Team => {
  const players = overrides.players || createMockPlayers(10);
  return {
    id: uuidv4(),
    name: 'Test Team',
    players,
    ...overrides,
  };
};

/**
 * Create a mock period for testing
 */
export const createMockPeriod = (overrides: Partial<Period> = {}): Period => ({
  id: uuidv4(),
  periodNumber: 1,
  length: 20,
  substitutions: [],
  fouls: [],
  subEvents: [],
  ...overrides,
});

/**
 * Create a mock substitution for testing
 */
export const createMockSubstitution = (overrides: Partial<Substitution> = {}): Substitution => ({
  id: uuidv4(),
  player: createMockPlayer(),
  timeInEvent: uuidv4(),
  timeOutEvent: null,
  secondsPlayed: null,
  periodId: uuidv4(),
  ...overrides,
});

/**
 * Create a mock substitution event for testing
 */
export const createMockSubstitutionEvent = (overrides: Partial<SubstitutionEvent> = {}): SubstitutionEvent => ({
  id: uuidv4(),
  eventTime: 1200, // 20:00
  periodId: uuidv4(),
  subbedIn: [],
  playersOut: [],
  ...overrides,
});

/**
 * Create a mock foul for testing
 */
export const createMockFoul = (overrides: Partial<Foul> = {}): Foul => ({
  id: uuidv4(),
  player: createMockPlayer(),
  periodId: uuidv4(),
  timeRemaining: 600, // 10:00
  ...overrides,
});

/**
 * Create a mock game for testing
 */
export const createMockGame = (overrides: Partial<Game> = {}): Game => {
  const team = overrides.team || createMockTeam();
  const periods = overrides.periods || [createMockPeriod()];
  const players = overrides.players || team.players;
  
  return {
    id: uuidv4(),
    date: new Date(),
    team,
    opponent: 'Test Opponent',
    players,
    periods,
    activePlayers: [],
    currentPeriod: 0,
    isRunning: false,
    ...overrides,
  };
};

/**
 * Create a game with realistic data for testing complex scenarios
 */
export const createRealisticMockGame = (): Game => {
  const team = createMockTeam({
    name: 'Lakers',
    players: [
      createMockPlayer({ name: 'LeBron James', number: '6' }),
      createMockPlayer({ name: 'Anthony Davis', number: '3' }),
      createMockPlayer({ name: 'Russell Westbrook', number: '0' }),
      createMockPlayer({ name: 'Carmelo Anthony', number: '7' }),
      createMockPlayer({ name: 'Dwight Howard', number: '39' }),
      createMockPlayer({ name: 'Malik Monk', number: '11' }),
      createMockPlayer({ name: 'Austin Reaves', number: '15' }),
      createMockPlayer({ name: 'Talen Horton-Tucker', number: '5' }),
    ],
  });

  const period1 = createMockPeriod({
    periodNumber: 1,
    length: 20,
    substitutions: [
      createMockSubstitution({
        player: team.players[0],
        timeInEvent: 'event1',
        timeOutEvent: null,
        secondsPlayed: null,
      }),
    ],
    subEvents: [
      createMockSubstitutionEvent({
        id: 'event1',
        eventTime: 1200,
        subbedIn: [team.players[0]],
        playersOut: [],
      }),
    ],
    fouls: [
      createMockFoul({
        player: team.players[0],
        timeRemaining: 900,
      }),
    ],
  });

  return createMockGame({
    team,
    opponent: 'Celtics',
    players: team.players,
    periods: [period1],
    activePlayers: [team.players[0].id],
    currentPeriod: 0,
    isRunning: false,
  });
};

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => storage[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
    length: 0,
    key: jest.fn(),
  };
};

/**
 * Mock IndexedDB for testing
 */
export const mockIndexedDB = () => {
  const databases: Record<string, any> = {};
  
  const mockDB = {
    transaction: jest.fn(() => ({
      objectStore: jest.fn(() => ({
        add: jest.fn(),
        put: jest.fn(),
        get: jest.fn(),
        delete: jest.fn(),
        getAll: jest.fn(() => ({ onsuccess: null })),
        openCursor: jest.fn(),
      })),
      oncomplete: null,
      onerror: null,
    })),
    close: jest.fn(),
  };

  const mockOpenRequest = {
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: mockDB,
  };

  return {
    open: jest.fn(() => mockOpenRequest),
    deleteDatabase: jest.fn(),
    databases,
    mockDB,
    mockOpenRequest,
  };
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Helper to trigger component re-renders
 */
export const act = async (callback: () => void | Promise<void>) => {
  const { act: reactAct } = await import('@testing-library/react');
  await reactAct(callback);
};

/**
 * Helper for testing timers
 */
export const advanceTimers = (ms: number) => {
  jest.advanceTimersByTime(ms);
};

/**
 * Setup and teardown helpers for common test scenarios
 */
export const setupTest = () => {
  // Mock console methods to reduce noise in tests
  const consoleSpy = {
    error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  };

  return {
    consoleSpy,
    cleanup: () => {
      consoleSpy.error.mockRestore();
      consoleSpy.warn.mockRestore();
      consoleSpy.log.mockRestore();
    },
  };
};

/**
 * Common test patterns and assertions
 */
export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(text);
};

export const expectButtonToBeDisabled = (button: HTMLElement | null) => {
  expect(button).toBeInTheDocument();
  expect(button).toBeDisabled();
};

export const expectButtonToBeEnabled = (button: HTMLElement | null) => {
  expect(button).toBeInTheDocument();
  expect(button).toBeEnabled();
};