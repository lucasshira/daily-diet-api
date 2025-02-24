// e2e meals routes

import { app } from "../src/app";
import { execSync } from "child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from 'supertest'

describe('Meals route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  // test create
  it('it should be able to create a new meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: 'It is a breakfast',
        is_on_diet: true,
        date: new Date()
      })
      .expect(201)

      await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Lunch',
        description: 'It is a lunch',
        is_on_diet: true,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day after
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .expect(200)

    expect(mealsResponse.body.meals[0].name).toBe('Breakfast')
    expect(mealsResponse.body.meals[1].name).toBe('Lunch')
  })

  // test get id
  it('should be able to show a single meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: 'Its a breakfast',
        is_on_diet: false,
        date: new Date()
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .expect(200)

    expect(mealResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Breakfast',
        description: 'Its a breakfast',
        is_on_diet: 0,
        date: expect.any(Number),
      })
    })
  })

  // test update
  it('should be able to update a meal from an user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: 'Its a breakfast',
        is_on_diet: true,
        date: new Date()
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    await request(app.server)
      .put(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Dinner',
        description: 'Its a dinner',
        is_on_diet: false,
        date: new Date(),
      })
      .expect(204)
  })

  // test delete
  it('should be able to delete a meal from an user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: 'Its a breakfast',
        is_on_diet: true,
        date: new Date()
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .expect(204)
  })

  // test metrics
  it('should be able to get metrics from an user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Breakfast',
        description: 'Its a breakfast',
        is_on_diet: true,
        date: new Date(),
      })
      .expect(201)

      await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Lunch',
        description: 'Its a lunch',
        is_on_diet: true,
        date: new Date(Date.now() + 300)
      })
      .expect(201)

      await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .send({
        name: 'Dinner',
        description: 'Its a dinner',
        is_on_diet: false,
        date: new Date(Date.now() + 600)
      })
      .expect(201)
    
    const metricsResponse = await request(app.server)
      .get('/metrics')
      .set('Cookie', userResponse.get('Set-Cookie')!)
      .expect(200)

    expect(metricsResponse.body).toEqual({
      totalMeals: 3,
      totalMealsOnDiet: 2,
      totalMealsOffDiet: 1,
      bestOnDietSequence: 2
    })
  })
})