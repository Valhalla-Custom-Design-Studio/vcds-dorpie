import { Router } from 'express';
import { triggerSOS, resolveSOSAlert, listActiveAlerts } from '../controllers/sos.controller';
import { listIncidents, createIncident } from '../controllers/incidents.controller';
import { listPatrols, checkIn } from '../controllers/patrols.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/sos', triggerSOS);
router.get('/sos/active', listActiveAlerts);
router.patch('/sos/:id/resolve', resolveSOSAlert);

router.get('/incidents', listIncidents);
router.post('/incidents', createIncident);

router.get('/patrols', listPatrols);
router.post('/patrols/checkin', checkIn);

export default router;
