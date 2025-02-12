import { app } from "./app"
import { env } from "./env";

const port = env.PORT || 3333;

app.listen({
  port: env.PORT
}).then(() => {
  console.log(`HTTP Server is running on port ${[port]}`)
})