// Rota de Usuarios

import { FastifyInstance } from "fastify";
import { knex } from "../database";
import z from 'zod'
import { randomUUID } from "crypto";

export async function usersRoutes(app: FastifyInstance) {
  // list all users
  app.get('/users', async (request, reply) => {
    const users = await knex('users').select('*')

    return reply.send({ users })
  })

  // get a specific user by his id
  app.get('/users/:id', async (request, reply) => {
    const getUserParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = getUserParamsSchema.parse(request.params)

    const user = await knex('users').where({
      id
    }).first()

    return reply.send({ user })
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
    })

    return reply.status(201).send({ message: 'User create successfully!' })
  })

  app.get('/me', async (request, reply) => {
    const sessionId = request.cookies.sessionId

    if (!sessionId) {
      return reply.status(401).send({ message: "Unauthorized." })
    }

    // route to return user's own data
    const user = await knex('users').where({ session_id: sessionId }).first()

    if (!user) {
      return reply.status(404).send({ message: "User not found." })
    }

    return reply.send({ user })
  })
}