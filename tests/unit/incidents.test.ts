import request from 'supertest';
import app from '../../api/src/server';

describe('Incidents API', () => {
  it('GET /api/v1/incidents — returns array', async () => {
    const res = await request(app).get('/api/v1/incidents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.incidents)).toBe(true);
  });

  it('POST /api/v1/incidents — requires auth', async () => {
    const res = await request(app).post('/api/v1/incidents').send({ type:'theft', title:'Test' });
    expect(res.status).toBe(401);
  });
});
