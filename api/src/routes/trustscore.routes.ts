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
router.get("/:neighbourhood_id", (req: Request, res: Response) => {
  return res.json({
    success: true,
    message: "Connect to DB to retrieve stored TrustScore",
    neighbourhood_id: req.params.neighbourhood_id,
  });
});

export default router;
