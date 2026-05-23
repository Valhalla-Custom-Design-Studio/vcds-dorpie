import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';

// ─── Sentry Error Monitoring ───────────────────────────────
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: 'dorpwag@' + (process.env.npm_package_version || '1.0.0'),
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  integrations: [
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
  ],
});
// ──────────────────────────────────────────────────────────



import { authRouter } from './routes/auth';
import { paymentsRouter } from './routes/payments';
import { subscriptionRouter } from './routes/subscriptions';
import { incidentsRouter } from './routes/incidents';
import { patrolsRouter } from './routes/patrols';
import { areasRouter } from './routes/areas';

const app = express();

  // Sentry request handler (must be first middleware)
  app.use(Sentry.requestHandler());
  app.use(Sentry.tracingHandler());

const PORT = process.env.PORT || 3001;
const API = `/api/v1`;

app.use(helmet());
app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(','), credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => res.json({ success: true, app: 'Dorpwag™ API', status: 'healthy', ts: new Date().toISOString() }));
app.get(`${API}/health`, (_req, res) => res.json({ success: true, status: 'healthy' }));

app.use(`${API}/auth`, authRouter);
app.use(`${API}/payments`, paymentsRouter);
app.use(`${API}/subscriptions`, subscriptionRouter);
app.use(`${API}/incidents`, incidentsRouter);
app.use(`${API}/patrols`, patrolsRouter);
app.use(`${API}/areas`, areasRouter);


  // Sentry error handler (must be before any other error handler)
  app.use(Sentry.errorHandler());

app.listen(PORT, () => console.log(`Dorpwag™ API running on port ${PORT}`));
export default app;
