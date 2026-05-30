import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: 'dorpwag@' + (process.env.npm_package_version || '2.1.0'),
  tracesSampleRate: 0.2,
  integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
});

import authRouter from './routes/auth';
import townsRouter from './routes/towns';
import noticesRouter from './routes/notices';
import listingsRouter from './routes/listings';
import messageThreadsRouter from './routes/messageThreads';
import eventsRouter from './routes/events';
import businessesRouter from './routes/businesses';
import topicsRouter from './routes/topics';
import reportsRouter from './routes/reports';
import emergencyAlertsRouter from './routes/emergencyAlerts';
import guardianRouter from './routes/guardian';
import guardianPublicRouter from './routes/guardianPublic';
import sosRouter from './routes/sos';
import sosContactsRouter from './routes/sos_contacts';
import heatmapRouter from './routes/heatmap';
import movementRouter from './routes/movement';
import movementPublicRouter from './routes/movementPublic';
import profileRouter from './routes/profile';
import adminRouter from './routes/admin';
import uploadRouter from './routes/upload';
import filesRouter from './routes/files';
import pushTokensRouter from './routes/pushTokens';
import paymentsRouter from './routes/payments';
import safetyRouter from './routes/safety';
import suiteRouter from './routes/suite';
import lprRouter from './routes/lpr';
import aiCrimeRouter from './routes/ai_crime';
import areasRouter from './routes/areas';
import trustScoreRouter from './routes/trustscore.routes';
import { runMigrations } from './db/migrate';
import { runDeadManCheck, runMovementAnomalyCheck } from './cron/deadman.cron';

const app = express();
const PORT = process.env.PORT || 3001;
const API = `/api`;

app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '*').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true }));
app.use(express.json({ limit: '10mb' }));

// Health
app.get('/health', (_req, res) => res.json({ success: true, app: 'Dorpwag™ API', status: 'healthy', version: '2.1.0', ts: new Date().toISOString() }));
app.get(`${API}/health`, (_req, res) => res.json({ success: true, status: 'healthy' }));

// Routes
app.use(`${API}/auth`, authRouter);
app.use(`${API}/towns`, townsRouter);
app.use(`${API}/notices`, noticesRouter);
app.use(`${API}/listings`, listingsRouter);
app.use(`${API}/message-threads`, messageThreadsRouter);
app.use(`${API}/events`, eventsRouter);
app.use(`${API}/businesses`, businessesRouter);
app.use(`${API}/topics`, topicsRouter);
app.use(`${API}/reports`, reportsRouter);
app.use(`${API}/emergency-alerts`, emergencyAlertsRouter);
app.use(`${API}/guardian`, guardianRouter);
app.use(`${API}/guardian-public`, guardianPublicRouter);
app.use(`${API}/sos`, sosRouter);
app.use(`${API}/sos`, sosContactsRouter);
app.use(`${API}/heatmap`, heatmapRouter);
app.use(`${API}/movement`, movementRouter);
app.use(`${API}/movement-public`, movementPublicRouter);
app.use(`${API}/profile`, profileRouter);
app.use(`${API}/admin`, adminRouter);
app.use(`${API}/upload`, uploadRouter);
app.use(`${API}/files`, filesRouter);
app.use(`${API}/push-tokens`, pushTokensRouter);
app.use(`${API}/payments`, paymentsRouter);
app.use(`${API}/safety`, safetyRouter);
app.use(`${API}/suite`, suiteRouter);
app.use(`${API}/lpr`, lprRouter);
app.use(`${API}/ai-crime`, aiCrimeRouter);
app.use(`${API}/areas`, areasRouter);
app.use(`${API}/trust-score`, trustScoreRouter);

app.use(Sentry.expressErrorHandler());
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ─── CRON JOBS (Render background worker) ───────────────────
function startCronJobs() {
  // Dead Man Switch check — every 60 seconds
  setInterval(runDeadManCheck, 60 * 1000);
  // Movement anomaly check — every 5 minutes
  setInterval(runMovementAnomalyCheck, 5 * 60 * 1000);
  console.log('⏱️  Cron jobs started: DeadMan (60s), MovementAnomaly (5m)');
}

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🛡️  Dorpwag™ API v2.1.0 running on port ${PORT}`);
      startCronJobs();
    });
  })
  .catch((err) => {
    console.error('[STARTUP] ❌ Migration failed, aborting:', err);
    process.exit(1);
  });

export default app;
