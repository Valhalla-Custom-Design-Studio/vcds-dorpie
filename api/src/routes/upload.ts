import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const r = Router();

// Cloudflare R2 — S3-compatible endpoint
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.R2_BUCKET || 'lingering-glade-2094';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

// POST /api/upload/presign — Get presigned URL for direct R2 upload
r.post('/presign', authenticate, async (req: AuthRequest, res: Response) => {
  const { fileName, contentType, isPublic = false } = req.body;
  if (!fileName || !contentType) {
    res.status(400).json({ success: false, message: 'fileName and contentType required' });
    return;
  }
  try {
    const fileId = uuidv4();
    const key = `dorpwag/${req.user!.id}/${fileId}/${fileName}`;
    const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const { rows } = await pool.query(
      'INSERT INTO files(id,user_id,file_name,cloud_storage_path,is_public,content_type) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [fileId, req.user!.id, fileName, key, isPublic, contentType]
    );
    res.json({ success: true, data: { fileId, key, uploadUrl, file: rows[0] } });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

// POST /api/upload/complete — Get signed view URL
r.post('/complete', authenticate, async (req: AuthRequest, res: Response) => {
  const { key, isPublic = false } = req.body;
  try {
    if (isPublic) {
      return res.json({ success: true, viewUrl: `${R2_PUBLIC_URL}/${key}` });
    }
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const viewUrl = await getSignedUrl(s3, command, { expiresIn: 86400 * 7 });
    return res.json({ success: true, viewUrl });
  } catch(e: any) { return res.status(500).json({ success: false, message: e.message }); }
});

export default r;
