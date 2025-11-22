import { sql } from '@vercel/postgres';

export interface WishlistItem {
  id: number;
  link: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewWishlistItem {
  link: string;
  notes?: string;
}

// Initialize database table
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id SERIAL PRIMARY KEY,
        link TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export const getAll = async (): Promise<WishlistItem[]> => {
  try {
    await initializeDatabase();
    const { rows } = await sql`SELECT * FROM wishlist_items ORDER BY created_at DESC`;
    return rows as WishlistItem[];
  } catch (error) {
    console.error('Error in getAll:', error);
    return [];
  }
};

export const getById = async (id: number): Promise<WishlistItem | undefined> => {
  try {
    const { rows } = await sql`SELECT * FROM wishlist_items WHERE id = ${id}`;
    return rows[0] as WishlistItem | undefined;
  } catch (error) {
    console.error('Error in getById:', error);
    return undefined;
  }
};

export const create = async (item: NewWishlistItem): Promise<WishlistItem> => {
  try {
    await initializeDatabase();
    const { rows } = await sql`
      INSERT INTO wishlist_items (link, notes)
      VALUES (${item.link}, ${item.notes || null})
      RETURNING *
    `;
    return rows[0] as WishlistItem;
  } catch (error) {
    console.error('Error in create:', error);
    throw error;
  }
};

export const update = async (
  id: number,
  item: Partial<NewWishlistItem>
): Promise<WishlistItem | undefined> => {
  try {
    const existing = await getById(id);
    if (!existing) return undefined;

    const { rows } = await sql`
      UPDATE wishlist_items
      SET link = ${item.link !== undefined ? item.link : existing.link},
          notes = ${item.notes !== undefined ? item.notes : existing.notes},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] as WishlistItem | undefined;
  } catch (error) {
    console.error('Error in update:', error);
    return undefined;
  }
};

export const remove = async (id: number): Promise<boolean> => {
  try {
    const result = await sql`DELETE FROM wishlist_items WHERE id = ${id}`;
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error in remove:', error);
    return false;
  }
};
