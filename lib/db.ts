import Database from 'better-sqlite3';
import path from 'path';

export interface TravelDestination {
  id: number;
  rank: number;
  destination: string;
  country: string;
  latitude: number;
  longitude: number;
  reason: string;
  budget: string;
  timeline: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewTravelDestination {
  rank: number;
  destination: string;
  country: string;
  latitude: number;
  longitude: number;
  reason: string;
  budget: string;
  timeline: string;
  image_url?: string;
}

// Check if we're in production (Vercel) or local development
const isProduction = process.env.POSTGRES_URL !== undefined;

// Helper to convert Postgres row to proper types (DECIMAL comes as string)
function normalizeRow(row: Record<string, unknown>): TravelDestination {
  return {
    ...row,
    latitude: typeof row.latitude === 'string' ? parseFloat(row.latitude) : row.latitude,
    longitude: typeof row.longitude === 'string' ? parseFloat(row.longitude) : row.longitude,
    rank: typeof row.rank === 'string' ? parseInt(row.rank, 10) : row.rank,
    id: typeof row.id === 'string' ? parseInt(row.id, 10) : row.id,
  } as TravelDestination;
}

// SQLite database for local development
let sqliteDb: Database.Database | null = null;

function getLocalDb(): Database.Database {
  if (!sqliteDb) {
    const dbPath = path.join(process.cwd(), 'data', 'travel-wishlist.db');
    sqliteDb = new Database(dbPath);
    
    // Create table if not exists
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS travel_destinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rank INTEGER NOT NULL,
        destination TEXT NOT NULL,
        country TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        reason TEXT NOT NULL DEFAULT '',
        budget TEXT NOT NULL DEFAULT 'moderate',
        timeline TEXT NOT NULL DEFAULT 'someday',
        image_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  return sqliteDb;
}

// Vercel Postgres for production
async function getProductionDb() {
  const { sql } = await import('@vercel/postgres');
  return sql;
}

async function initProductionDb() {
  const sql = await getProductionDb();
  await sql`
    CREATE TABLE IF NOT EXISTS travel_destinations (
      id SERIAL PRIMARY KEY,
      rank INTEGER NOT NULL,
      destination TEXT NOT NULL,
      country TEXT NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      reason TEXT NOT NULL DEFAULT '',
      budget TEXT NOT NULL DEFAULT 'moderate',
      timeline TEXT NOT NULL DEFAULT 'someday',
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

export const getAll = async (): Promise<TravelDestination[]> => {
  try {
    if (isProduction) {
      await initProductionDb();
      const sql = await getProductionDb();
      const { rows } = await sql`SELECT * FROM travel_destinations ORDER BY rank ASC`;
      return rows.map(normalizeRow);
    } else {
      const db = getLocalDb();
      const rows = db.prepare('SELECT * FROM travel_destinations ORDER BY rank ASC').all();
      return rows as TravelDestination[];
    }
  } catch (error) {
    console.error('Error in getAll:', error);
    return [];
  }
};

export const getById = async (id: number): Promise<TravelDestination | undefined> => {
  try {
    if (isProduction) {
      const sql = await getProductionDb();
      const { rows } = await sql`SELECT * FROM travel_destinations WHERE id = ${id}`;
      return rows[0] ? normalizeRow(rows[0]) : undefined;
    } else {
      const db = getLocalDb();
      const row = db.prepare('SELECT * FROM travel_destinations WHERE id = ?').get(id);
      return row as TravelDestination | undefined;
    }
  } catch (error) {
    console.error('Error in getById:', error);
    return undefined;
  }
};

export const create = async (item: NewTravelDestination): Promise<TravelDestination> => {
  try {
    if (isProduction) {
      await initProductionDb();
      const sql = await getProductionDb();
      const { rows } = await sql`
        INSERT INTO travel_destinations (rank, destination, country, latitude, longitude, reason, budget, timeline, image_url)
        VALUES (${item.rank}, ${item.destination}, ${item.country}, ${item.latitude}, ${item.longitude}, ${item.reason}, ${item.budget}, ${item.timeline}, ${item.image_url || null})
        RETURNING *
      `;
      return normalizeRow(rows[0]);
    } else {
      const db = getLocalDb();
      const stmt = db.prepare(`
        INSERT INTO travel_destinations (rank, destination, country, latitude, longitude, reason, budget, timeline, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        item.rank,
        item.destination,
        item.country,
        item.latitude,
        item.longitude,
        item.reason,
        item.budget,
        item.timeline,
        item.image_url || null
      );
      const newItem = db.prepare('SELECT * FROM travel_destinations WHERE id = ?').get(result.lastInsertRowid);
      return newItem as TravelDestination;
    }
  } catch (error) {
    console.error('Error in create:', error);
    throw error;
  }
};

export const update = async (
  id: number,
  item: Partial<NewTravelDestination>
): Promise<TravelDestination | undefined> => {
  try {
    const existing = await getById(id);
    if (!existing) return undefined;

    if (isProduction) {
      const sql = await getProductionDb();
      const { rows } = await sql`
        UPDATE travel_destinations
        SET rank = ${item.rank !== undefined ? item.rank : existing.rank},
            destination = ${item.destination !== undefined ? item.destination : existing.destination},
            country = ${item.country !== undefined ? item.country : existing.country},
            latitude = ${item.latitude !== undefined ? item.latitude : existing.latitude},
            longitude = ${item.longitude !== undefined ? item.longitude : existing.longitude},
            reason = ${item.reason !== undefined ? item.reason : existing.reason},
            budget = ${item.budget !== undefined ? item.budget : existing.budget},
            timeline = ${item.timeline !== undefined ? item.timeline : existing.timeline},
            image_url = ${item.image_url !== undefined ? item.image_url : existing.image_url},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
      return rows[0] ? normalizeRow(rows[0]) : undefined;
    } else {
      const db = getLocalDb();
      db.prepare(`
        UPDATE travel_destinations
        SET rank = ?,
            destination = ?,
            country = ?,
            latitude = ?,
            longitude = ?,
            reason = ?,
            budget = ?,
            timeline = ?,
            image_url = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        item.rank !== undefined ? item.rank : existing.rank,
        item.destination !== undefined ? item.destination : existing.destination,
        item.country !== undefined ? item.country : existing.country,
        item.latitude !== undefined ? item.latitude : existing.latitude,
        item.longitude !== undefined ? item.longitude : existing.longitude,
        item.reason !== undefined ? item.reason : existing.reason,
        item.budget !== undefined ? item.budget : existing.budget,
        item.timeline !== undefined ? item.timeline : existing.timeline,
        item.image_url !== undefined ? item.image_url : existing.image_url,
        id
      );
      return await getById(id);
    }
  } catch (error) {
    console.error('Error in update:', error);
    return undefined;
  }
};

export const remove = async (id: number): Promise<boolean> => {
  try {
    if (isProduction) {
      const sql = await getProductionDb();
      const result = await sql`DELETE FROM travel_destinations WHERE id = ${id}`;
      return (result.rowCount ?? 0) > 0;
    } else {
      const db = getLocalDb();
      const result = db.prepare('DELETE FROM travel_destinations WHERE id = ?').run(id);
      return result.changes > 0;
    }
  } catch (error) {
    console.error('Error in remove:', error);
    return false;
  }
};

export const updateRanks = async (ranks: { id: number; rank: number }[]): Promise<boolean> => {
  try {
    if (isProduction) {
      const sql = await getProductionDb();
      for (const { id, rank } of ranks) {
        await sql`UPDATE travel_destinations SET rank = ${rank}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id}`;
      }
    } else {
      const db = getLocalDb();
      const stmt = db.prepare('UPDATE travel_destinations SET rank = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
      for (const { id, rank } of ranks) {
        stmt.run(rank, id);
      }
    }
    return true;
  } catch (error) {
    console.error('Error in updateRanks:', error);
    return false;
  }
};
