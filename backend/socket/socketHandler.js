import jwt from "jsonwebtoken"
import Document from "../modules/document/documentModel.js"
import Message from "../modules/chat/chatModel.js"
import {
  getRevision,
  addOperation,
  transformAgainstHistory,
  applyOperation,
} from "./otEngine.js"

const activeRooms = new Map()

const getUsersInRoom = (docId) => {
  const room = activeRooms.get(docId)
  if (!room) return []
  return Object.entries(room).map(([socketId, data]) => ({
    socketId,
    ...data,
  }))
}

const authenticateSocket = (socket) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.query?.token
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

export const initSocket = (io) => {
  io.use((socket, next) => {
    const user = authenticateSocket(socket)
    if (!user) return next(new Error("Unauthorized"))
    socket.user = user
    next()
  })

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.user.id}`)

    // ─── Join document room ────────────────────────────────────────
    socket.on("join-document", async ({ docId, user }) => {
      try {
        const doc = await Document.findById(docId)
        if (!doc) return socket.emit("error", { message: "Document not found" })

        socket.join(docId)

        if (!activeRooms.has(docId)) activeRooms.set(docId, {})
        activeRooms.get(docId)[socket.id] = {
          userId: user.id,
          name: user.name,
          color: user.color,
          cursor: { line: 1, column: 1 },
        }

        socket.emit("document-data", {
          content: doc.content,
          title: doc.title,
          language: doc.language,
          revision: getRevision(docId),
        })

        io.to(docId).emit("active-users", getUsersInRoom(docId))
        socket.to(docId).emit("user-joined", {
          name: user.name,
          color: user.color,
        })

        // Send last 50 messages as chat history on join
        const history = await Message.find({ docId })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean()
        socket.emit("chat-history", history.reverse())

        console.log(`User ${user.name} joined doc ${docId}`)
      } catch (err) {
        socket.emit("error", { message: err.message })
      }
    })

    // ─── Send message ──────────────────────────────────────────────
    socket.on("send-message", async ({ docId, message }) => {
      /*
        Why save to DB before broadcasting?
        If we broadcast first and DB save fails, users see
        a message that was never actually stored. On refresh
        it would disappear — confusing and broken.
        Save first, broadcast only on success.
      */
      if (!message?.trim()) return

      try {
        const room = activeRooms.get(docId)
        const sender = room?.[socket.id]

        const saved = await Message.create({
          docId,
          senderId: socket.user.id,
          senderName: sender?.name || "Unknown",
          senderColor: sender?.color || "#7c6fcd",
          message: message.trim(),
        })

        const payload = {
          _id: saved._id,
          senderId: saved.senderId,
          senderName: saved.senderName,
          senderColor: saved.senderColor,
          message: saved.message,
          createdAt: saved.createdAt,
        }

        // Broadcast to everyone in the room including sender
        io.to(docId).emit("receive-message", payload)
      } catch (err) {
        socket.emit("error", { message: "Message failed to send" })
      }
    })

    // ─── OT operation ──────────────────────────────────────────────
    socket.on("send-operation", async ({ docId, operation, revision }) => {
      try {
        const transformed = transformAgainstHistory(docId, operation, revision)
        addOperation(docId, transformed)

        const doc = await Document.findById(docId)
        if (doc) {
          doc.content = applyOperation(doc.content, transformed)
          await doc.save()
        }

        socket.to(docId).emit("receive-operation", {
          operation: transformed,
          revision: getRevision(docId),
        })
        socket.emit("operation-ack", { revision: getRevision(docId) })
      } catch (err) {
        socket.emit("error", { message: err.message })
      }
    })

    // ─── Cursor move ───────────────────────────────────────────────
    socket.on("cursor-move", ({ docId, cursor }) => {
      if (!activeRooms.has(docId)) return
      const room = activeRooms.get(docId)
      if (room[socket.id]) room[socket.id].cursor = cursor

      socket.to(docId).emit("cursor-update", {
        socketId: socket.id,
        userId: socket.user.id,
        cursor,
        name: room[socket.id]?.name,
        color: room[socket.id]?.color,
      })
    })

    // ─── Leave document ────────────────────────────────────────────
    socket.on("leave-document", ({ docId }) => {
      handleLeave(socket, io, docId)
    })

    // ─── Disconnect ────────────────────────────────────────────────
    socket.on("disconnect", () => {
      for (const [docId, room] of activeRooms.entries()) {
        if (room[socket.id]) handleLeave(socket, io, docId)
      }
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })
}

const handleLeave = (socket, io, docId) => {
  const room = activeRooms.get(docId)
  if (!room) return

  const leavingUser = room[socket.id]
  delete room[socket.id]

  if (Object.keys(room).length === 0) activeRooms.delete(docId)

  socket.leave(docId)
  io.to(docId).emit("active-users", getUsersInRoom(docId))
  if (leavingUser) io.to(docId).emit("user-left", { name: leavingUser.name })
}