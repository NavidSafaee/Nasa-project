const request = require('supertest');
const app = require('../../app');
const { 
    mongoConnect,
    mongoDisconnect 
} = require('../../services/mongo')

const {
    loadPlanetsData
} = require('../../models/planets.model')


describe('Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
        await loadPlanetsData();
    })

    afterAll(async () => {
        await mongoDisconnect();
    })

    describe('Test GET /launches', () => {
        test("It should respond with 200 success", async () => {
            await request(app)
            .get('/v1/launches')
            .expect('Content-Type', /json/)
            .expect(200)
        })
    })
    
    describe('Test POST /launches', () => {
        const completeLaunchData = {
            mission: 'mission 1',
            rocket: 'my guguli rocket',
            launchDate: 'january 5, 2030',
            target: 'kepler-186 f',
        }
    
        const launchDataWithoutDate = {
            mission: 'mission 1',
            rocket: 'my guguli rocket',
            target: 'kepler-186 f',
        }
    
        const launchDataWitInvalidDate = {
            mission: 'mission 1',
            rocket: 'my guguli rocket',
            launchDate: 'invalid date',
            target: 'kepler-186 f',
        }
    
        test("It shoud respond with 201 created", async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send({
                mission: 'mission 1',
                rocket: 'my guguli rocket',
                launchDate: 'january 5, 2030',
                target: 'kepler-186 f',
            })
            .expect('Content-Type', /json/)
            .expect(201);
    
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(responseDate).toBe(requestDate);
    
            expect(response.body).toMatchObject(launchDataWithoutDate);
        })
    
        test("It should catch missing requierd properties", async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send(launchDataWithoutDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
            expect(response.body).toStrictEqual({
                error: "Missing required launch property"
            })
        })
    
        test("It should catch invalid dates", async () => {
            const response = await request(app)
            .post('/v1/launches')
            .send(launchDataWitInvalidDate)
            .expect('Content-Type', /json/)
            .expect(400);
    
            expect(response.body).toStrictEqual({
                error: "invalid launch date"
            })
        })
    })
    
    // describe('DELETE /launch/:id', () => {
    //     test('It should respond with 200 success', async () => {
    //         await request(app)
    //         .delete('/launches/{{id}}')
    //         .expect('Content-Type', /json/)
    //         .expect(200)
    //     })
    // })
})

