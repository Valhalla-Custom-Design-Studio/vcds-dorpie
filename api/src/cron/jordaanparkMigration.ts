import { pool } from '../db/pool';

/**
 * Jordaanpark Migration Cron
 * Runs daily. After 30 Jun 2026:
 *  - Moves all Jordaanpark promo members to Heidelberg, Gauteng
 *  - Resets their tier to 'free' (paygate applies)
 *  - Jordaanpark town remains in DB but is no longer selectable (handled by frontend flag)
 */
export async function runJordaanparkMigration(): Promise<void> {
  const MIGRATION_DATE = new Date('2026-07-01T00:00:00+02:00');
  if (new Date() < MIGRATION_DATE) return;

  try {
    // Find Heidelberg town id
    const heidelbergRes = await pool.query(
      "SELECT id FROM towns WHERE name ILIKE 'Heidelberg' AND province ILIKE '%Gauteng%' LIMIT 1"
    );
    if (!heidelbergRes.rows.length) {
      console.warn('[JordaanparkMigration] Heidelberg town not found in DB');
      return;
    }
    const heidelbergId = heidelbergRes.rows[0].id;

    // Find Jordaanpark town id
    const jpRes = await pool.query("SELECT id FROM towns WHERE name ILIKE 'Jordaanpark' LIMIT 1");
    if (!jpRes.rows.length) return;
    const jpId = jpRes.rows[0].id;

    // Migrate users who redeemed the JPF2026 code and are still on Jordaanpark
    const result = await pool.query(
      `UPDATE users
       SET town_id = $1,
           subscription_tier = 'free',
           updated_at = NOW()
       WHERE id IN (
         SELECT user_id FROM promo_code_redemptions WHERE code = '#JPF2026'
       )
       AND town_id = $2
       AND subscription_tier = 'platinum'`,
      [heidelbergId, jpId]
    );

    if (result.rowCount && result.rowCount > 0) {
      console.log('[JordaanparkMigration] Migrated ' + result.rowCount + ' members to Heidelberg');
    }
  } catch (e) {
    console.error('[JordaanparkMigration] Error:', e);
  }
}
