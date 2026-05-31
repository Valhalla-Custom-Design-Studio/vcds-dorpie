import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { pool } from '../db/pool';

const router = Router();

// Lazy-init OpenAI — avoids crash at module load if env var not yet set
let _openai: any = null;
function getOpenAI() {
  if (!_openai) {
    const { default: OpenAI } = require('openai');
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY env var not set');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// POST /api/mood/analyze — analyze facial expression via OpenAI Vision
router.post('/analyze', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

  try {
    const openai = getOpenAI();
    const imageDataUrl = 'data:image/jpeg;base64,' + imageBase64;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze the facial expression in this image. Respond ONLY with valid JSON:\n{\n  "mood": "happy|sad|neutral|pain|anxious|confused|unknown",\n  "confidence": 0.0-1.0,\n  "description": "Brief description in Afrikaans (max 20 words)",\n  "recommendation": "Care recommendation in Afrikaans if mood is concerning (max 25 words)",\n  "alert": true/false\n}\nOnly set alert=true for clear signs of pain or severe distress.',
          },
          {
            type: 'image_url',
            image_url: { url: imageDataUrl, detail: 'low' },
          },
        ],
      }],
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');
    const result = JSON.parse(jsonMatch[0]);

    const validMoods = ['happy', 'sad', 'neutral', 'pain', 'anxious', 'confused', 'unknown'];
    if (!validMoods.includes(result.mood)) result.mood = 'unknown';

    await pool.query(
      'INSERT INTO mood_logs(user_id, mood, confidence, alert, created_at) VALUES($1, $2, $3, $4, NOW())',
      [userId, result.mood, result.confidence || 0, result.alert || false]
    ).catch(() => {});

    res.json(result);
  } catch (err: any) {
    console.error('Mood analysis error:', err.message);
    res.status(500).json({ error: 'Mood analysis failed', mood: 'unknown', confidence: 0, description: 'Analise misluk', recommendation: '', alert: false });
  }
});

// GET /api/mood/history — last 30 mood logs for user
router.get('/history', authenticate, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    const { rows } = await pool.query(
      'SELECT mood, confidence, alert, created_at FROM mood_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
    res.json({ logs: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mood history' });
  }
});

export default router;
