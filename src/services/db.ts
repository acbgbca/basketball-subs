import { openDB, IDBPDatabase } from 'idb';
import { Team, Game } from '../types';

const DB_NAME = 'basketball-stats';
const DB_VERSION = 1;

// Singleton pattern for database connection
let dbInstance: IDBPDatabase | null = null;

export const initDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      db.createObjectStore('teams', { keyPath: 'id' });
      db.createObjectStore('games', { keyPath: 'id' });
    },
  });
  return dbInstance;
};

// Private helper to get database instance
const getDB = async () => {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
};

export const dbService = {
  async getTeams(): Promise<Team[]> {
    const db = await getDB();
    return db.getAll('teams');
  },

  async addTeam(team: Team): Promise<void> {
    const db = await getDB();
    await db.add('teams', team);
  },

  async getGames(): Promise<Game[]> {
    const db = await getDB();
    return db.getAll('games');
  },

  async addGame(game: Game): Promise<void> {
    const db = await getDB();
    await db.add('games', game);
  },

  async getGame(id: string): Promise<Game> {
    const db = await getDB();
    return db.get('games', id);
  },

  async updateGame(game: Game): Promise<void> {
    const db = await getDB();
    await db.put('games', game);
  },

  async getTeam(id: string): Promise<Team> {
    const db = await getDB();
    return db.get('teams', id);
  },

  async updateTeam(team: Team): Promise<void> {
    const db = await getDB();
    await db.put('teams', team);
  },

  async deleteGame(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('games', id);
  },

  async deleteTeam(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('teams', id);
  },

  // Add more methods as needed
}; 