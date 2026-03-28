import jwt from "jsonwebtoken"
import Document from "../modules/document/documentModel.js"
import {
  getRevision,
  addOperation,
  transformAgainstHistory,
  applyOperation,
} from "./otEngine.js"

/*
  activeRooms shape:
  {
    [docId]: {
      [socketId]: { userId, name, color, cursor: { line, column } }
    }
  }
*/
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
  /*
    Three ways to authenticate a socket:
    A - Pass token in handshake auth (most secure)
    B - Pass token in query string (simpler but less secure)
    C - No auth (public rooms only)
    
    We use A with fallback to B.
  */
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

    // ─── Join a document room ───────────────────────────────────────
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

        // Send document state to the joining user
        socket.emit("document-data", {
          content: doc.content,
          title: doc.title,
          language: doc.language,
          revision: getRevision(docId),
        })

        // Tell everyone in the room about the updated user list
        io.to(docId).emit("active-users", getUsersInRoom(docId))

        // Tell others someone joined
        socket.to(docId).emit("user-joined", {
          name: user.name,
          color: user.color,
        })

        console.log(`User ${user.name} joined doc ${docId}`)
      } catch (err) {
        socket.emit("error", { message: err.message })
      }
    })

    // ─── Receive and broadcast an edit operation ────────────────────
    socket.on("send-operation", async ({ docId, operation, revision }) => {
      try {
        // Transform operation against any ops that happened after client's revision
        const transformed = transformAgainstHistory(docId, operation, revision)

        // Add to server history
        addOperation(docId, transformed)

        // Apply to document in DB (debounced — only save every 30 ops or on disconnect)
        const doc = await Document.findById(docId)
        if (doc) {
          doc.content = applyOperation(doc.content, transformed)
          await doc.save()
        }

        // Broadcast the transformed operation to everyone else in the room
        socket.to(docId).emit("receive-operation", {
          operation: transformed,
          revision: getRevision(docId),
        })

        // Send acknowledgment back to sender with new revision
        socket.emit("operation-ack", { revision: getRevision(docId) })
      } catch (err) {
        socket.emit("error", { message: err.message })
      }
    })

    // ─── Cursor position update ─────────────────────────────────────
    socket.on("cursor-move", ({ docId, cursor }) => {
      if (!activeRooms.has(docId)) return
      const room = activeRooms.get(docId)
      if (room[socket.id]) {
        room[socket.id].cursor = cursor
      }

      // Broadcast to others — not back to sender
      socket.to(docId).emit("cursor-update", {
        socketId: socket.id,
        userId: socket.user.id,
        cursor,
        name: room[socket.id]?.name,
        color: room[socket.id]?.color,
      })
    })

    // ─── Leave a document room ──────────────────────────────────────
    socket.on("leave-document", ({ docId }) => {
      handleLeave(socket, io, docId)
    })

    // ─── Disconnect ─────────────────────────────────────────────────
    socket.on("disconnect", () => {
      // Find which rooms this socket was in and clean up
      for (const [docId, room] of activeRooms.entries()) {
        if (room[socket.id]) {
          handleLeave(socket, io, docId)
        }
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

  if (Object.keys(room).length === 0) {
    activeRooms.delete(docId)
  }

  socket.leave(docId)
  io.to(docId).emit("active-users", getUsersInRoom(docId))

  if (leavingUser) {
    io.to(docId).emit("user-left", { name: leavingUser.name })
  }
}