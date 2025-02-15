import fastify from "fastify";
import cookie from '@fastify/cookie';
import { usersRoutes } from "./routes/users";
import { mealsRoute } from "./routes/meals";

export const app = fastify();

app.register(cookie)
app.register(usersRoutes)
app.register(mealsRoute)