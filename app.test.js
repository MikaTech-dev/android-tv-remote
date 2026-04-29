import request from 'supertest';
import app from './app.js';

describe('GET /', () => {
    it('should return success message', async () => {
        const response = await request(app)
            .get('/')
            .expect(200);

        expect(response.body).toEqual({
            success: true,
            statusCode: 200,
            message: 'Hi'
        });
    });
});