// e2e users route

import { app } from '../src/app'
import { execSync } from 'child_process'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

describe('Users route', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback -all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new user', async () => {
    const response = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })
      .expect(201)

    const cookies = response.get('Set-Cookie')

    expect(cookies).toEqual(
      expect.arrayContaining([expect.stringContaining('sessionId')]),
    )
  })

  it(`should be able to return user's data`, async () => {
    const response = await request(app.server)
      .post('/users')
      .send({ name: 'John Doe', email: 'johndoe@email.com' })
      .expect(201)

    const cookies = response.get('Set-Cookie')

    const meResponse = await request(app.server)
      .get('/me')
      .set('Cookie', cookies!)
      .expect(200)

    expect(meResponse.body.user).toMatchObject({
      name: 'John Doe',
      email: 'johndoe@email.com'
    })
  })
})

