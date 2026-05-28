import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import * as Sentry from '@sentry/node';
import { runMigrations } from './db/migrate';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: 'dorpwag@' + (process.env.npm_package_version || '2.0.0'),
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
import careRouter from './routes/care';
import subscriptionsRouter from './routes/subscriptions';

const app = express();
const PORT = process.env.PORT || 3001;
const API = `/api`;

app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '*').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true }));
app.use(express.json({ limit: '10mb' }));

// Health
app.get('/health', (_req, res) => res.json({ success: true, app: 'Dorpwag™ API', status: 'healthy', version: '2.1.0', ts: new Date().toISOString() }));
app.get(`${API}/health`, (_req, res) => res.json({ success: true, status: 'healthy', version: '2.1.0' }));

// ─── SHARED ROUTES (all apps) ────────────────────────────────────────────────
app.use(`${API}/auth`, authRouter);
app.use(`${API}/towns`, townsRouter);
app.use(`${API}/push-tokens`, pushTokensRouter);
app.use(`${API}/profile`, profileRouter);
app.use(`${API}/files`, filesRouter);
app.use(`${API}/upload`, uploadRouter);
app.use(`${API}/payments`, paymentsRouter);

// ─── SAFETY ROUTES (all apps — shared) ──────────────────────────────────────
app.use(`${API}/guardian`, guardianRouter);
app.use(`${API}/guardian-public`, guardianPublicRouter);
app.use(`${API}/sos`, sosRouter);
app.use(`${API}/heatmap`, heatmapRouter);
app.use(`${API}/movement`, movementRouter);
app.use(`${API}/movement-public`, movementPublicRouter);
app.use(`${API}/safety`, safetyRouter);
app.use(`${API}/emergency-alerts`, emergencyAlertsRouter);

// ─── DORPWAG™ SPECIFIC ROUTES ────────────────────────────────────────────────
app.use(`${API}/notices`, noticesRouter);
app.use(`${API}/listings`, listingsRouter);
app.use(`${API}/message-threads`, messageThreadsRouter);
app.use(`${API}/events`, eventsRouter);
app.use(`${API}/businesses`, businessesRouter);
app.use(`${API}/topics`, topicsRouter);
app.use(`${API}/reports`, reportsRouter);
app.use(`${API}/admin`, adminRouter);

// ─── OUMA EN OPPAS™ SPECIFIC ROUTES ─────────────────────────────────────────
app.use(`${API}/care`, careRouter);

// ─── SUITE / INTERNAL ────────────────────────────────────────────────────────
app.use(`${API}/suite`, suiteRouter);
app.use(`${API}/subscriptions`, subscriptionsRouter);

app.use(Sentry.expressErrorHandler());
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

(async () => {
  try {
    await runMigrations();
  } catch (err) {
    console.error('[STARTUP] ⚠️  Migration error (non-fatal) — server will start anyway:', err);
  }
  app.listen(PORT, () => {
    // server started
  });
})();
export default app;
