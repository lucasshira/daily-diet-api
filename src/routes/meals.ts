// Meals route

import { FastifyInstance } from "fastify";
import { knex } from "../database";
import z from 'zod'
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";
import { randomUUID } from "crypto";
import { uuidSchema } from "./schema/uuid-schema";

export function mealsRoute(app: FastifyInstance) {
  // create a meal
  app.post('/meals', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      is_on_diet: z.boolean(),
      date: z.coerce.date()
    })

    const { name, description, is_on_diet, date } = 
      createMealBodySchema.parse(request.body)

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      is_on_diet: is_on_diet,
      date: date.getTime(),
      user_id: request.user?.id
    })

    return reply.status(201).send({ message: "Meal created successfully!" })
  })

  // list all meals
  app.get('/meals', async (request, reply) => {
    const meals = await knex('meals').select('*')

    return reply.send({ meals })
  })

  // get a specific meal by its id
  app.get('/meals/:id', { preHandler: checkSessionIdExists }, async (request, reply) => {
    const { id } = uuidSchema.parse(request.params)
    const userId = request.user?.id

    const meal = await knex('meals').where({
      id
    }).first()

    if (!meal) {
      return reply.status(404).send({ message: 'Meal not found.' })
    }

    if (meal.user_id !== userId) {
      return reply.status(403).send({ message: 'You are not authorized to access this meal.' })
    }

    return reply.send({ meal })
  })

  // get all meals of an user
  app.get('/meals/user/:id', async (request, reply) => {
    const { id } = uuidSchema.parse(request.params)

    const meals = await knex('meals').where({
      user_id: id
    }).orderBy('date', 'desc')

    if (meals.length === 0) {
      return reply.status(404).send({ message: 'No meals found for this user.' })
    }

    return reply.send({ meals })
  })

  // editing info about a meal
  app.put('/meals/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
    const { id } = uuidSchema.parse(request.params)
    const userId = request.user?.id

    const updateMealSchemaBody = z.object({
      name: z.string(),
      description: z.string(),
      is_on_diet: z.boolean(),
      date: z.coerce.date(),
    })

    const { name, description, is_on_diet, date } = updateMealSchemaBody.parse(request.body)

    const meal = await knex('meals').where({ id }).first()

    if (!meal) {
      return reply.status(404).send({ message: 'Meal not found.' })
    }

    if (meal.user_id !== userId) {
      return reply.status(403).send({ message: 'You are not authorized to access this meal.' })
    }

    await knex('meals').where({ id }).update({
      name,
      description,
      is_on_diet,
      date
    })

    return reply.status(204).send()
  })

  // delete a meal
  app.delete('/meals/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
    const { id } = uuidSchema.parse(request.params)
    const userId = request.user?.id

    const meal = await knex('meals').where({
      id
    }).first()
    
    if (!meal) {
      return reply.status(404).send({ message: 'Meal not found.' })
    }
    
    if (meal.user_id !== userId) {
      return reply.status(403).send({ message: 'You are not authorized to delete this meal.' })
    }

    await knex('meals').where({ id }).first().delete()

    return reply.status(204).send()
  })

  // metrics
  app.get('/metrics', { preHandler: checkSessionIdExists }, async (request, reply) => {
    const userId = request.user?.id

    const totalMealsOnDiet = await knex('meals')
      .where({ user_id: userId, is_on_diet: true })
      .count('id', { as: 'total' })
      .first()

    const totalMealsOffDiet = await knex('meals')
      .where({ user_id: userId, is_on_diet: false })
      .count('id', { as: 'total' })
      .first()

    const totalMeals = await knex('meals')
      .where({ user_id: userId })
      .orderBy('date', 'desc')

    const { bestOnDietSequence } = totalMeals.reduce((acc, meal) => {
      if (meal.is_on_diet) {
        acc.currentSequence += 1
      } else {
        acc.currentSequence = 0
      }

      if (acc.currentSequence > acc.bestOnDietSequence) {
        acc.bestOnDietSequence = acc.currentSequence
      }

      return acc;
    }, { bestOnDietSequence: 0, currentSequence: 0 })

    return reply.send({
      totalMeals: totalMeals.length,
      totalMealsOnDiet: totalMealsOnDiet?.total,
      totalMealsOffDiet: totalMealsOffDiet?.total,
      bestOnDietSequence
    })
  })
}