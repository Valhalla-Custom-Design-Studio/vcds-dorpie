import fs from 'fs';
import path from 'path';
import { pool } from './pool';

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id        SERIAL PRIMARY KEY,
        filename  TEXT UNIQUE NOT NULL,
        ran_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1', [file]
      );
      if (rows.length > 0) {
continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
}
  } catch (err) {
    console.error('[MIGRATE] ❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
  }
}
