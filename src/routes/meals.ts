// Meals route

import { FastifyInstance } from "fastify";
import { knex } from "../database";
import z from 'zod'
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";
import { randomUUID } from "crypto";

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

  app.get('/meals', async (request, reply) => {
    const meals = await knex('meals').select('*')

    return reply.send({ meals })
  })
}