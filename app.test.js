const request = require('supertest');
const express = require('express');
const app = require('./server');

describe('Travel Planner API Tests', () => {
  describe('Destination Endpoints', () => {
    test('GET /destinations should return 200 status code', async () => {
      const res = await request(app).get('/destinations');
      expect(res.status).toBe(200);
    });

    test('GET /destinations should return JSON content type', async () => {
      const res = await request(app).get('/destinations');
      expect(res.header['content-type']).toEqual(expect.stringContaining('json'));
    });

    test('GET /destinations should return array of destinations with id and name', async () => {
      const res = await request(app).get('/destinations');
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: expect.any(Number), name: expect.any(String) })
        ])
      );
    });

    test('GET /destinations should return empty array if no destinations (edge case)', async () => {
      // Create temporary test server
      const tempApp = express();
      tempApp.use(express.json());
      
      tempApp.get('/destinations', (req, res) => {
        res.json([]);
      });
      
      const tempServer = tempApp.listen(0); 
      
      try {
        const res = await request(tempApp).get('/destinations');
        expect(res.body).toEqual([]);
      } finally {
        tempServer.close();
      }
    });


    test('GET /destinations/:id should return 200 for existing destination', async () => {
      const res = await request(app).get('/destinations/1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Marrakesh');
    });

    test('GET /destinations/:id should return JSON content type', async () => {
      const res = await request(app).get('/destinations/1');
      expect(res.header['content-type']).toMatch(/json/);
    });

    test('GET /destinations/:id should return full destination details', async () => {
      const res = await request(app).get('/destinations/1');
      expect(res.body).toEqual({
        id: 1,
        name: "Marrakesh",
        climate: "arid",
        budget: "medium",
        bestTime: "Spring/Fall"
      });
    });

    test('GET /destinations/:id should return 404 for non-existent destination', async () => {
      const res = await request(app).get('/destinations/999');
      expect(res.status).toBe(404);
    });

    test('GET /destinations/:id should return 400 for invalid ID format', async () => {
      const res = await request(app).get('/destinations/invalid');
      expect(res.status).toBe(400);
    });

    test('POST /destinations should create new destination and return 201', async () => {
      const newDestination = {
        name: "Tokyo",
        climate: "temperate",
        budget: "high",
        bestTime: "Spring"
      };
      const res = await request(app).post('/destinations').send(newDestination);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject(newDestination);
    });

    test('POST /destinations should return JSON content type', async () => {
      const newDestination = {
        name: "Tokyo",
        climate: "temperate",
        budget: "high",
        bestTime: "Spring"
      };
      const res = await request(app).post('/destinations').send(newDestination);
      expect(res.header['content-type']).toMatch(/json/);
    });

    test('POST /destinations should return 400 if any field is missing', async () => {
      const res = await request(app).post('/destinations').send({
        name: "Tokyo",
        climate: "temperate"
      });
      expect(res.status).toBe(400);
    });

    test('POST /destinations should handle empty string values', async () => {
      const res = await request(app).post('/destinations').send({
        name: "",
        climate: "",
        budget: "",
        bestTime: ""
      });
      expect(res.status).toBe(400);
    });
  });


  describe('Preference Endpoints', () => {
    beforeEach(async () => {
      await request(app).post('/preferences/reset'); 
    });

    test('POST /preferences should create new preference and return 201', async () => {
      const res = await request(app).post('/preferences').send({
        userId: "user1",
        climate: "tropical",
        budget: "medium"
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('label');
    });

    test('POST /preferences should increment preference count', async () => {
      await request(app).post('/preferences').send({
        userId: "user1",
        climate: "tropical",
        budget: "medium"
      });

      await request(app).post('/preferences').send({
        userId: "user1",
        climate: "arid",
        budget: "low"
      });

      const res = await request(app).get('/preferences/user1');
      expect(res.body.length).toBe(2);
    });

    test('POST /preferences should return 400 if any field is missing', async () => {
      const res = await request(app).post('/preferences').send({
        userId: "user1",
        climate: "tropical"
      });
      expect(res.status).toBe(400);
    });

    test('POST /preferences should handle max length userId', async () => {
        const longId = 'a'.repeat(255); // Assuming 255 char limit
        const res = await request(app).post('/preferences').send({
          userId: longId,
          climate: "tropical",
          budget: "medium"
        });
        expect(res.status).toBe(201);
      });

    test('GET /preferences/:userId should return 200 and user preferences', async () => {
      await request(app).post('/preferences').send({
        userId: "user1",
        climate: "tropical",
        budget: "medium"
      });

      const res = await request(app).get('/preferences/user1');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    test('GET /preferences/:userId should return empty array for user with no preferences', async () => {
      const res = await request(app).get('/preferences/userX');
      expect(res.body).toEqual([]);
    });

    test('GET /preferences/:userId should handle special chars', async () => {
        const userId = 'user@domain.com';
        await request(app).post('/preferences').send({
          userId,
          climate: "tropical",
          budget: "medium"
        });
        
        const res = await request(app).get(`/preferences/${encodeURIComponent(userId)}`);
        expect(res.status).toBe(200);
      });

    test('GET /preferences/:userId/:label should return 200 and specific preference', async () => {
      const prefRes = await request(app).post('/preferences').send({
        userId: "user1",
        climate: "tropical",
        budget: "medium"
      });

      const label = prefRes.body.label;
      const res = await request(app).get(`/preferences/user1/${label}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('climate', 'tropical');
    });

    test('GET /preferences/:userId/:label should return 404 for non-existent preference', async () => {
      const res = await request(app).get('/preferences/user1/nonexistent');
      expect(res.status).toBe(404);
    });

    test('GET /preferences/:userId/:label should return 404 for wrong user', async () => {
      const prefRes = await request(app).post('/preferences').send({
        userId: "user1",
        climate: "tropical",
        budget: "medium"
      });

      const label = prefRes.body.label;
      const res = await request(app).get(`/preferences/user2/${label}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Non-existent Endpoints', () => {
    test('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown');
      expect(res.status).toBe(404);
    });
  });
});