import { useEffect, useRef, useState, useCallback } from "react"
import { io } from "socket.io-client"
import useAuthStore from "../store/authStore"

export const useSocket = (docId) => {
  const socketRef = useRef(null)
  const { user, token } = useAuthStore()
  const [activeUsers, setActiveUsers] = useState([])
  const [connected, setConnected] = useState(false)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (!docId || !token || !user) return

    // Disconnect any existing socket before creating new one
    if (socketRef.current) {
      socketRef.current.disconnect()
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    })

    socketRef.current = socket

    socket.on("connect", () => {
      setConnected(true)
      console.log("Socket connected, joining doc:", docId)
      // Emit join with full user object
      socket.emit("join-document", {
        docId,
        user: {
          id: user.id,
          name: user.name,
          color: user.color,
        },
      })
    })

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message)
      setConnected(false)
    })

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason)
      setConnected(false)
    })

    socket.on("active-users", (users) => {
      console.log("Active users received:", users)
      setActiveUsers(users)
    })

    socket.on("user-joined", ({ name, color }) => {
      showNotification(`${name} joined`, color)
    })

    socket.on("user-left", ({ name }) => {
      showNotification(`${name} left`, "#888")
    })

    socket.on("error", ({ message }) => {
      console.error("Socket error:", message)
    })

    return () => {
      console.log("Leaving doc:", docId)
      socket.emit("leave-document", { docId })
      socket.disconnect()
    }
  }, [docId, token, user?.id])  // user?.id ensures re-run if user changes

  const showNotification = (message, color) => {
    setNotification({ message, color, id: Date.now() })
    setTimeout(() => setNotification(null), 3000)
  }

  const emitOperation = useCallback((operation, revision) => {
    socketRef.current?.emit("send-operation", { docId, operation, revision })
  }, [docId])

  const emitCursor = useCallback((cursor) => {
    socketRef.current?.emit("cursor-move", { docId, cursor })
  }, [docId])

  return {
    socket: socketRef.current,
    connected,
    activeUsers,
    notification,
    emitOperation,
    emitCursor,
  }
}