import { Router, Request, Response } from "express";
import { calculateTrustScore } from "../services/TrustScoreService";

const router = Router();

/**
 * POST /api/trustscore/calculate
 * TrustScore™ — Neighbourhood safety intelligence score
 */
router.post("/calculate", (req: Request, res: Response) => {
  try {
    const result = calculateTrustScore(req.body);
    return res.json({ success: true, data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

/**
 * GET /api/trustscore/:neighbourhood_id
 * Get TrustScore for a neighbourhood (from DB — stub)
 */
router.get("/:neighbourhood_id", async (req: Request, res: Response) => {
  try {
    const { neighbourhood_id } = req.params;
    // Fetch last computed TrustScore from DB
    const { pool } = await import("../db/pool");
    const result = await pool.query(
      `SELECT * FROM trust_scores WHERE neighbourhood_id = $1 ORDER BY computed_at DESC LIMIT 1`,
      [neighbourhood_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "No TrustScore found for this neighbourhood" });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default router;
