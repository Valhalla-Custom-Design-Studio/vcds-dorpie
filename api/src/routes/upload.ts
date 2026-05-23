import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
const r = Router();

// Cloudflare R2 upload — returns presigned URL
r.post('/presign', authenticate, async (req: AuthRequest, res: Response) => {
  const { fileName, contentType, isPublic = false } = req.body;
  if (!fileName || !contentType) { res.status(400).json({ success: false, message: 'fileName and contentType required' }); return; }
  try {
    const fileId = uuidv4();
    const key = `dorpwag/${req.user!.id}/${fileId}/${fileName}`;
    // Store file record
    const { rows } = await pool.query(
      'INSERT INTO files(id,user_id,file_name,cloud_storage_path,is_public,content_type) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
      [fileId, req.user!.id, fileName, key, isPublic, contentType]
    );
    // Return presigned URL placeholder (R2 integration via env)
    const uploadUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
    res.json({ success: true, data: { fileId, key, uploadUrl, file: rows[0] } });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed' }); }
});

export default r;
