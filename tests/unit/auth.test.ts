import request from 'supertest';
import app from '../../api/src/server';

describe('Dorpwag Auth API', () => {
  const user = { email: `test_${Date.now()}@dorpwag.co.za`, password: 'TestPass123!', firstName: 'Test', lastName: 'User' };

  it('POST /register — creates user', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it('GET /health — healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
