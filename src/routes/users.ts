// Rota de Usuarios

import { FastifyInstance } from "fastify";
import { knex } from "../database";
import z from 'zod'
import { randomUUID } from "crypto";

export async function usersRoutes(app: FastifyInstance) {
  // list all users
  app.get('/users', async (request, reply) => {
    const users = await knex('users').select('*')

    return { users }
  })

  // create an user
  app.post('/users', async (request, reply) => {
    const createUserBodySchema = z.object({
      name: z.string(),
      email: z.string().email(),
    })

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    const { name, email } = createUserBodySchema.parse(request.body)

    // checking if the user already exist
    const userByEmail = await knex('users').where({ email }).first()

    if (userByEmail) {
      return reply.status(400).send({ message: 'User already exists' })
    }

    await knex('users').insert({
      id: randomUUID(),
      name,
      email,
      session_id: sessionId,
      created_at: new Date(),
    })

    return reply.status(201).send({ message: 'User create successfully!' })
  })
}