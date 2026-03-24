import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./config/db.js"
import authRoutes from "./modules/auth/authRoutes.js"
import documentRoutes from "./modules/document/documentRoutes.js"
import { initSocket } from "./socket/socketHandler.js"

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