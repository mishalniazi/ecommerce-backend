const request = require('supertest');
const { app, initDb } = require('../src/app');
const pool = require('../src/db');

beforeAll(async () => {
  await initDb();
});

afterEach(async () => {
  // Clean up test data after each test
  await pool.query("DELETE FROM users WHERE email LIKE '%@test.com'");
});

afterAll(async () => {
  await pool.end();
});

describe('POST /users', () => {
  it('should create a new user and store it in the database', async () => {
    const payload = { name: 'Jane Doe', email: 'jane@test.com' };

    const res = await request(app).post('/users').send(payload);

    // Verify HTTP response
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Jane Doe', email: 'jane@test.com' });
    expect(res.body.id).toBeDefined();

    // Verify the user is actually stored in the database
    const dbResult = await pool.query('SELECT * FROM users WHERE email = $1', ['jane@test.com']);
    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].name).toBe('Jane Doe');
    expect(dbResult.rows[0].email).toBe('jane@test.com');
  });

  it('should return 400 if name or email is missing', async () => {
    const res = await request(app).post('/users').send({ name: 'No Email' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('name and email are required');
  });

  it('should return 409 if email already exists', async () => {
    const payload = { name: 'Jane Doe', email: 'jane@test.com' };

    await request(app).post('/users').send(payload);
    const res = await request(app).post('/users').send(payload);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already exists');
  });
});
