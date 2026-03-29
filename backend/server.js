import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import { createAdapter } from "@socket.io/redis-adapter"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/db.js"
import authRoutes from "./modules/auth/authRoutes.js"
import documentRoutes from "./modules/document/documentRoutes.js"
import { initSocket } from "./socket/socketHandler.js"
import { getRedisClients } from "./utils/redis.js"

dotenv.config()
connectDB()

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

/*
  Attach Redis adapter so Socket.IO works across multiple
  server instances. If Redis is unavailable, fall back to
  in-memory (works fine for single instance / local dev).
*/
const attachRedisAdapter = async () => {
  try {
    const { pubClient, subClient } = getRedisClients()
    await Promise.all([
      new Promise((res) => pubClient.once("ready", res)),
      new Promise((res) => subClient.once("ready", res)),
    ])
    io.adapter(createAdapter(pubClient, subClient))
    console.log("Socket.IO Redis adapter attached")
  } catch (err) {
    console.warn("Redis unavailable, using in-memory adapter:", err.message)
  }
}

attachRedisAdapter()

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}))
app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/documents", documentRoutes)
app.get("/api/health", (_, res) => res.json({ status: "ok", app: "lineCODE" }))

initSocket(io)

const PORT = process.env.PORT || 5000
httpServer.listen(PORT, () => console.log(`lineCODE server on port ${PORT}`))

export { io }