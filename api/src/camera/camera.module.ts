/**
 * Dorpwag™ Camera Module
 * Wires Hikvision ISAPI bridge into the Express server
 */
import { Router } from 'express';
import lprRouter from '../routes/lpr';

export const CameraModule = {
  /**
   * Mount LPR routes on the Express app
   * Call this in server.ts: app.use('/api/lpr', CameraModule.router())
   */
  router(): Router {
    return lprRouter;
  },
};

export { CameraModule as default };
