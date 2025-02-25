import { openDB } from 'idb';
import { Team, Game } from '../types';

const DB_NAME = 'basketball-stats';
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      db.createObjectStore('teams', { keyPath: 'id' });
      db.createObjectStore('games', { keyPath: 'id' });
    },
  });
  return db;
};

export const dbService = {
  async getTeams(): Promise<Team[]> {
    const db = await initDB();
    return db.getAll('teams');
  },

  async addTeam(team: Team): Promise<void> {
    const db = await initDB();
    await db.add('teams', team);
  },

  async getGames(): Promise<Game[]> {
    const db = await initDB();
    return db.getAll('games');
  },

  async addGame(game: Game): Promise<void> {
    const db = await initDB();
    await db.add('games', game);
  },

  async getGame(id: string): Promise<Game> {
    const db = await initDB();
    return db.get('games', id);
  },

  async updateGame(game: Game): Promise<void> {
    const db = await initDB();
    await db.put('games', game);
  },

  async getTeam(id: string): Promise<Team> {
    const db = await initDB();
    return db.get('teams', id);
  },

  async updateTeam(team: Team): Promise<void> {
    const db = await initDB();
    await db.put('teams', team);
  },

  async deleteGame(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('games', id);
  },

  async deleteTeam(id: string): Promise<void> {
    const db = await initDB();
    await db.delete('teams', id);
  },

  // Add more methods as needed
}; 