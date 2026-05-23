import request from 'supertest';
import app from '../../api/src/server';

describe('Patrols API', () => {
  it('GET /api/v1/patrols — returns array', async () => {
    const res = await request(app).get('/api/v1/patrols');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.patrols)).toBe(true);
  });

  it('POST /api/v1/patrols — requires auth', async () => {
    const res = await request(app).post('/api/v1/patrols').send({});
    expect(res.status).toBe(401);
  });
});
