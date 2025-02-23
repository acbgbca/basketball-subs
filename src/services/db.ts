import { openDB } from 'idb';
import { Team, Player, Game } from '../types';

const DB_NAME = 'basketball-stats';
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      db.createObjectStore('teams', { keyPath: 'id' });
      db.createObjectStore('players', { keyPath: 'id' });
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

  // Add more methods as needed
}; 