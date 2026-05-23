import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendBulkSMS, sendExpoPush } from '../services/NotificationService';
const r = Router();
r.use(authenticate);

async function triggerSOSAlarm(sosId: string, userId: string, userName: string, lat: number|null, lng: number|null, triggerMethod: string) {
  const coords = lat && lng ? `GPS: https://maps.google.com?q=${lat},${lng}` : 'GPS nie beskikbaar nie';
  const smsText = `🚨 DORPWAG™ NOODALARM — ${userName} het 'n SOS geaktiveer (${triggerMethod}). ${coords}. Reageer onmiddellik!`;
  const contacts = await pool.query(
    'SELECT gc.phone,gc.push_token FROM guardian_contacts gc WHERE gc.user_id=$1 AND gc.is_primary=false UNION SELECT st.phone,NULL FROM sos_trusted_contacts st WHERE st.user_id=$1 AND st.is_active=true',
    [userId]
  );
  const contactList = contacts.rows.map((c: any) => ({ name: 'Contact', phone: c.phone, pushToken: c.push_token }));
  const pushTokens = contactList.filter((c: any) => c.pushToken).map((c: any) => c.pushToken!);
  await Promise.all([
    sendBulkSMS(contactList, smsText),
    sendExpoPush(pushTokens, '🚨 NOODALARM', `${userName} het hulp nodig!`, { sosId }, 'dorpie-emergency'),
  ]);
  await pool.query('UPDATE sos_events SET escalation_attempts=escalation_attempts+1,last_escalation_at=NOW() WHERE id=$1',[sosId]);
}

r.post('/trigger', async (req: AuthRequest, res: Response) => {
  const {lat,lng,message,source='manual',triggerMethod='button'}=req.body;
  try {
    const u=await pool.query('SELECT name FROM users WHERE id=$1',[req.user!.id]);
    const {rows}=await pool.query('INSERT INTO sos_events(user_id,lat,lng,message,source,trigger_method) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[req.user!.id,lat,lng,message,source,triggerMethod]);
    const sos=rows[0];
    await triggerSOSAlarm(sos.id,req.user!.id,u.rows[0].name,lat,lng,triggerMethod);
    res.status(201).json({success:true,data:sos});
  } catch(e){console.error(e);res.status(500).json({success:false,message:'Failed'});}
});

r.post('/silent', async (req: AuthRequest, res: Response) => {
  const {lat,lng,triggerMethod='shake'}=req.body;
  try {
    const u=await pool.query('SELECT name FROM users WHERE id=$1',[req.user!.id]);
    const {rows}=await pool.query('INSERT INTO sos_events(user_id,lat,lng,source,trigger_method) VALUES($1,$2,$3,$4,$5) RETURNING *',[req.user!.id,lat||null,lng||null,'silent',triggerMethod]);
    const sos=rows[0];
    await triggerSOSAlarm(sos.id,req.user!.id,u.rows[0].name,lat,lng,triggerMethod);
    res.status(201).json({success:true,data:sos});
  } catch(e){res.status(500).json({success:false,message:'Failed'});}
});

r.post('/:sosId/gps-update', async (req: AuthRequest, res: Response) => {
  const {lat,lng,speed,heading}=req.body;
  try {
    await pool.query('INSERT INTO sos_gps_trail(sos_event_id,lat,lng,speed,heading) VALUES($1,$2,$3,$4,$5)',[req.params.sosId,lat,lng,speed,heading]);
    res.json({success:true});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.get('/:sosId/trail', async (req: AuthRequest, res: Response) => {
  try {
    const {rows}=await pool.query('SELECT * FROM sos_gps_trail WHERE sos_event_id=$1 ORDER BY created_at',[req.params.sosId]);
    res.json({success:true,data:rows});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.post('/:sosId/resolve', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE sos_events SET status=''resolved'',resolved_at=NOW(),resolved_by=$1 WHERE id=$2',[req.user!.id,req.params.sosId]);
    res.json({success:true});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.post('/:sosId/acknowledge', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE sos_events SET acknowledged_by=$1,acknowledged_at=NOW(),status=''acknowledged'' WHERE id=$2',[req.user!.id,req.params.sosId]);
    res.json({success:true});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.get('/:sosId/evidence', async (req: AuthRequest, res: Response) => {
  try {
    const {rows}=await pool.query('SELECT * FROM sos_evidence WHERE sos_event_id=$1 ORDER BY captured_at',[req.params.sosId]);
    res.json({success:true,data:rows});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.post('/:sosId/evidence/upload-url', async (req: AuthRequest, res: Response) => {
  res.json({success:true,data:{uploadUrl:'CONFIGURE_S3_PRESIGNED_URL',note:'Configure AWS_S3_BUCKET in env'}});
});

r.post('/:sosId/evidence/complete', async (req: AuthRequest, res: Response) => {
  const {type,cloudStoragePath,duration,fileSize}=req.body;
  try {
    const {rows}=await pool.query('INSERT INTO sos_evidence(sos_event_id,user_id,type,cloud_storage_path,duration,file_size,uploaded_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) RETURNING *',[req.params.sosId,req.user!.id,type,cloudStoragePath,duration,fileSize]);
    res.status(201).json({success:true,data:rows[0]});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.post('/:sosId/gps-burst', async (req: AuthRequest, res: Response) => {
  const {points=[]}=req.body;
  try {
    for(const p of points){await pool.query('INSERT INTO sos_gps_trail(sos_event_id,lat,lng,speed,heading,accuracy,altitude) VALUES($1,$2,$3,$4,$5,$6,$7)',[req.params.sosId,p.lat,p.lng,p.speed,p.heading,p.accuracy,p.altitude]);}
    res.json({success:true,count:points.length});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.get('/:sosId/timeline', async (req: AuthRequest, res: Response) => {
  try {
    const sos=await pool.query('SELECT * FROM sos_events WHERE id=$1',[req.params.sosId]);
    const evidence=await pool.query('SELECT * FROM sos_evidence WHERE sos_event_id=$1 ORDER BY captured_at',[req.params.sosId]);
    const trail=await pool.query('SELECT * FROM sos_gps_trail WHERE sos_event_id=$1 ORDER BY created_at',[req.params.sosId]);
    const logs=await pool.query('SELECT * FROM notification_log WHERE sos_event_id=$1 ORDER BY created_at',[req.params.sosId]);
    res.json({success:true,data:{event:sos.rows[0],evidence:evidence.rows,trail:trail.rows,notifications:logs.rows}});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.patch('/:sosId/evidence/keep', async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE sos_evidence SET keep_forever=true WHERE sos_event_id=$1',[req.params.sosId]);
    res.json({success:true});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.get('/trusted-contacts', async (req: AuthRequest, res: Response) => {
  try {
    const {rows}=await pool.query('SELECT * FROM sos_trusted_contacts WHERE user_id=$1 ORDER BY sort_order',[req.user!.id]);
    res.json({success:true,data:rows});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

r.put('/trusted-contacts', async (req: AuthRequest, res: Response) => {
  const {contacts=[]}=req.body;
  try {
    await pool.query('DELETE FROM sos_trusted_contacts WHERE user_id=$1',[req.user!.id]);
    for(let i=0;i<contacts.length;i++){
      const c=contacts[i];
      await pool.query('INSERT INTO sos_trusted_contacts(user_id,name,phone,is_active,sort_order) VALUES($1,$2,$3,$4,$5)',[req.user!.id,c.name,c.phone,c.isActive!==false,i]);
    }
    res.json({success:true});
  } catch{res.status(500).json({success:false,message:'Failed'});}
});

export default r;
