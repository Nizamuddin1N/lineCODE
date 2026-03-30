import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import useAuthStore from "../store/authStore"
import { useSocket } from "../hooks/useSocket"
import Navbar from "../components/UI/Navbar"
import CodeEditor from "../components/Editor/CodeEditor"
import UsersPanel from "../components/Sidebar/UsersPanel"
import VersionPanel from "../components/Sidebar/VersionPanel"
import ChatPanel from "../components/Chat/ChatPanel"

const LANGUAGES = [
  "javascript","typescript","python","java",
  "cpp","go","rust","html","css","sql","bash","json",
]

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [doc, setDoc] = useState(null)
  const [versions, setVersions] = useState([])
  const [restoredContent, setRestoredContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarTab, setSidebarTab] = useState("users")
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState("")
  const [copied, setCopied] = useState(false)
  const [userRole, setUserRole] = useState("viewer")
  const [unreadCount, setUnreadCount] = useState(0)

  // ─── Resizable sidebar state ─────────────────────────────────────
  /*
    Why useRef for isDragging instead of useState?
    Because we don't need a re-render when dragging starts/stops.
    We only need re-renders when the width changes.
    useRef is synchronous — no batching delay — so mousemove
    reads the correct value instantly without stale closure issues.
  */
  const [sidebarWidth, setSidebarWidth] = useState(220)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(0)

  const {
    socket,
    connected,
    activeUsers,
    notification,
    messages,
    sendMessage,
    emitOperation,
    emitCursor,
  } = useSocket(id)

  // ─── Unread message tracking ─────────────────────────────────────
  useEffect(() => {
    if (sidebarTab !== "chat" && messages.length > 0) {
      setUnreadCount((c) => c + 1)
    }
  }, [messages])

  useEffect(() => {
    if (sidebarTab === "chat") setUnreadCount(0)
  }, [sidebarTab])

  // ─── Fetch document ──────────────────────────────────────────────
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/documents/${id}`)
        setDoc(res.data)
        setTitleInput(res.data.title)
        setUserRole(res.data.userRole || "viewer")
      } catch {
        navigate("/")
      } finally {
        setLoading(false)
      }
    }
    fetchDoc()
    fetchVersions()
  }, [id])

  const fetchVersions = async () => {
    try {
      const res = await api.get(`/documents/${id}/versions`)
      setVersions(Array.isArray(res.data) ? res.data : [])
    } catch {
      setVersions([])
    }
  }

  // ─── Drag resize handlers ────────────────────────────────────────
  const handleDragStart = (e) => {
    isDragging.current = true
    dragStartX.current = e.clientX
    dragStartWidth.current = sidebarWidth
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const handleDragMove = useCallback((e) => {
    if (!isDragging.current) return
    /*
      Delta is positive when mouse moves left (sidebar grows).
      Delta is negative when mouse moves right (sidebar shrinks).
      Clamp between 160px (minimum readable) and 500px (max useful).
    */
    const delta = dragStartX.current - e.clientX
    const newWidth = Math.min(500, Math.max(160, dragStartWidth.current + delta))
    setSidebarWidth(newWidth)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [])

  // Attach to window so fast mouse movement doesn't lose the drag
  useEffect(() => {
    window.addEventListener("mousemove", handleDragMove)
    window.addEventListener("mouseup", handleDragEnd)
    return () => {
      window.removeEventListener("mousemove", handleDragMove)
      window.removeEventListener("mouseup", handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  // ─── Document actions ────────────────────────────────────────────
  const saveContent = async (content, shouldSave) => {
    if (!shouldSave) return
    if (userRole === "viewer") return
    try {
      await api.put(`/documents/${id}`, { content })
      fetchVersions()
    } catch {}
  }

  const saveTitle = async () => {
    if (!titleInput.trim() || titleInput === doc.title) {
      setEditingTitle(false)
      return
    }
    if (userRole === "viewer") return
    try {
      await api.put(`/documents/${id}`, { title: titleInput })
      setDoc((d) => ({ ...d, title: titleInput }))
    } finally {
      setEditingTitle(false)
    }
  }

  const changeLanguage = async (lang) => {
    if (userRole === "viewer") return
    setDoc((d) => ({ ...d, language: lang }))
    await api.put(`/documents/${id}`, { language: lang })
  }

  const copyShareLink = () => {
    const link = `${window.location.origin}/join/${doc.shareToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const restoreVersion = async (versionId) => {
    try {
      const res = await api.post(`/documents/${id}/versions/restore`, { versionId })
      setRestoredContent(res.data.content)
      setDoc((d) => ({ ...d, content: res.data.content }))
      fetchVersions()
    } catch (err) {
      alert(err.response?.data?.error || "Restore failed")
    }
  }

  // ─── Loading state ───────────────────────────────────────────────
  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
      <p style={{ color: "#55556a", fontFamily: "monospace" }}>Loading...</p>
    </div>
  )

  const isReadOnly = userRole === "viewer"

  return (
    <div style={s.page}>
      <Navbar />

      {/* Editor header */}
      <div style={s.editorHeader}>
        <div style={s.titleArea}>
          {editingTitle && !isReadOnly ? (
            <input
              style={s.titleInput}
              value={titleInput}
              autoFocus
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            />
          ) : (
            <span
              style={{ ...s.titleText, cursor: isReadOnly ? "default" : "pointer" }}
              onClick={() => !isReadOnly && setEditingTitle(true)}
              title={isReadOnly ? "Viewers cannot rename" : "Click to rename"}
            >
              {doc?.title}
            </span>
          )}

          <select
            style={s.langSelect}
            value={doc?.language}
            onChange={(e) => changeLanguage(e.target.value)}
            disabled={isReadOnly}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <span style={{
            ...s.roleBadge,
            ...(isReadOnly ? s.viewerBadge : s.editorBadge),
          }}>
            {userRole}
          </span>
        </div>

        <button style={s.shareBtn} onClick={copyShareLink}>
          {copied ? "Copied!" : "Share link"}
        </button>
      </div>

      {/* Main body — editor + drag handle + sidebar */}
      <div style={s.body}>

        {/* Editor area — flex: 1 so it fills remaining space */}
        <div style={s.editorArea}>
          <CodeEditor
            docId={id}
            initialContent={doc?.content}
            initialLanguage={doc?.language}
            onContentChange={saveContent}
            socket={socket}
            connected={connected}
            emitOperation={emitOperation}
            emitCursor={emitCursor}
            readOnly={isReadOnly}
            restoredContent={restoredContent}
          />
        </div>

        {/* Drag handle — 4px wide, full height, sits between editor and sidebar */}
        <div
          style={s.dragHandle}
          onMouseDown={handleDragStart}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2a2a3a"
          }}
          onMouseLeave={(e) => {
            if (!isDragging.current)
              e.currentTarget.style.background = "transparent"
          }}
          title="Drag to resize"
        />

        {/* Sidebar — dynamic width from state */}
        <div style={{ ...s.sidebar, width: sidebarWidth }}>
          <div style={s.tabs}>
            <button
              style={{ ...s.tab, ...(sidebarTab === "users" ? s.activeTab : {}) }}
              onClick={() => setSidebarTab("users")}
            >
              Users ({activeUsers.length})
            </button>
            <button
              style={{ ...s.tab, ...(sidebarTab === "versions" ? s.activeTab : {}) }}
              onClick={() => setSidebarTab("versions")}
            >
              History
            </button>
            <button
              style={{ ...s.tab, ...(sidebarTab === "chat" ? s.activeTab : {}) }}
              onClick={() => setSidebarTab("chat")}
            >
              Chat
              {unreadCount > 0 && sidebarTab !== "chat" && (
                <span style={s.unreadBadge}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          <div style={s.sidebarContent}>
            {sidebarTab === "users" && (
              <UsersPanel
                users={activeUsers}
                currentUserId={user?.id}
              />
            )}
            {sidebarTab === "versions" && (
              <VersionPanel
                versions={versions}
                onRestore={restoreVersion}
                userRole={userRole}
              />
            )}
            {sidebarTab === "chat" && (
              <ChatPanel
                messages={messages}
                sendMessage={sendMessage}
              />
            )}
          </div>
        </div>
      </div>

      {/* Join / leave toast notification */}
      {notification && (
        <div style={{
          ...s.toast,
          borderLeft: `3px solid ${notification.color}`,
        }}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

const s = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0a0a0f",
    overflow: "hidden",
  },
  editorHeader: {
    height: 48,
    background: "#111118",
    borderBottom: "1px solid #2a2a3a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    flexShrink: 0,
  },
  titleArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  titleText: {
    fontSize: 14,
    color: "#e8e8f0",
    fontWeight: 500,
    padding: "2px 6px",
    borderRadius: 4,
  },
  titleInput: {
    fontSize: 14,
    color: "#e8e8f0",
    background: "#0a0a0f",
    border: "1px solid #7c6fcd",
    borderRadius: 4,
    padding: "3px 8px",
    width: 200,
  },
  langSelect: {
    background: "#0a0a0f",
    border: "1px solid #2a2a3a",
    color: "#8888a0",
    borderRadius: 4,
    padding: "3px 8px",
    fontSize: 12,
    cursor: "pointer",
  },
  roleBadge: {
    fontSize: 10,
    borderRadius: 4,
    padding: "2px 7px",
    fontWeight: 500,
  },
  editorBadge: {
    background: "rgba(46,204,113,0.1)",
    color: "#2ecc71",
    border: "1px solid rgba(46,204,113,0.2)",
  },
  viewerBadge: {
    background: "rgba(136,136,160,0.1)",
    color: "#8888a0",
    border: "1px solid rgba(136,136,160,0.2)",
  },
  shareBtn: {
    background: "rgba(124,111,205,0.15)",
    color: "#7c6fcd",
    border: "1px solid rgba(124,111,205,0.3)",
    borderRadius: 6,
    padding: "6px 14px",
    fontSize: 12,
    cursor: "pointer",
  },
  body: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  editorArea: {
    flex: 1,
    overflow: "hidden",
    minWidth: 0, // prevents flex child from overflowing
  },
  dragHandle: {
    width: 4,
    background: "transparent",
    cursor: "col-resize",
    flexShrink: 0,
    transition: "background 0.15s",
    zIndex: 10,
  },
  sidebar: {
    background: "#111118",
    borderLeft: "1px solid #2a2a3a",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    minWidth: 160,
    maxWidth: 500,
  },
  tabs: {
    display: "flex",
    borderBottom: "1px solid #2a2a3a",
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    fontSize: 11,
    color: "#55556a",
    background: "transparent",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    position: "relative",
  },
  activeTab: {
    color: "#7c6fcd",
    borderBottom: "2px solid #7c6fcd",
  },
  unreadBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    background: "#e74c3c",
    color: "#fff",
    borderRadius: 8,
    fontSize: 9,
    padding: "1px 4px",
    lineHeight: 1.4,
  },
  sidebarContent: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  toast: {
    position: "absolute",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#16161f",
    border: "1px solid #2a2a3a",
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 13,
    color: "#e8e8f0",
    whiteSpace: "nowrap",
  },
}