import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import useAuthStore from "../store/authStore"
import { useSocket } from "../hooks/useSocket"
import Navbar from "../components/UI/Navbar"
import CodeEditor from "../components/Editor/CodeEditor"
import UsersPanel from "../components/Sidebar/UsersPanel"
import VersionPanel from "../components/Sidebar/VersionPanel"
import ChatPanel from "../components/Chat/ChatPanel"           // ← add

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
  const [unreadCount, setUnreadCount] = useState(0)           // ← add

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

  // Track unread messages when chat tab is not active
  useEffect(() => {
    if (sidebarTab !== "chat" && messages.length > 0) {
      setUnreadCount((c) => c + 1)
    }
  }, [messages])

  // Clear unread count when chat tab is opened
  useEffect(() => {
    if (sidebarTab === "chat") setUnreadCount(0)
  }, [sidebarTab])

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

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
      <p style={{ color: "#55556a", fontFamily: "monospace" }}>Loading...</p>
    </div>
  )

  const isReadOnly = userRole === "viewer"

  return (
    <div style={s.page}>
      <Navbar />

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

          <span style={{ ...s.roleBadge, ...(isReadOnly ? s.viewerBadge : s.editorBadge) }}>
            {userRole}
          </span>
        </div>

        <button style={s.shareBtn} onClick={copyShareLink}>
          {copied ? "Copied!" : "Share link"}
        </button>
      </div>

      <div style={s.body}>
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

        <div style={s.sidebar}>
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
                <span style={s.unreadBadge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </button>
          </div>

          <div style={s.sidebarContent}>
            {sidebarTab === "users" && (
              <UsersPanel users={activeUsers} currentUserId={user?.id} />
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

      {notification && (
        <div style={{ ...s.toast, borderLeft: `3px solid ${notification.color}` }}>
          {notification.message}
        </div>
      )}
    </div>
  )
}

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0f", overflow: "hidden" },
  editorHeader: { height: 48, background: "#111118", borderBottom: "1px solid #2a2a3a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 },
  titleArea: { display: "flex", alignItems: "center", gap: 10 },
  titleText: { fontSize: 14, color: "#e8e8f0", fontWeight: 500, padding: "2px 6px", borderRadius: 4 },
  titleInput: { fontSize: 14, color: "#e8e8f0", background: "#0a0a0f", border: "1px solid #7c6fcd", borderRadius: 4, padding: "3px 8px", width: 200 },
  langSelect: { background: "#0a0a0f", border: "1px solid #2a2a3a", color: "#8888a0", borderRadius: 4, padding: "3px 8px", fontSize: 12, cursor: "pointer" },
  roleBadge: { fontSize: 10, borderRadius: 4, padding: "2px 7px", fontWeight: 500 },
  editorBadge: { background: "rgba(46,204,113,0.1)", color: "#2ecc71", border: "1px solid rgba(46,204,113,0.2)" },
  viewerBadge: { background: "rgba(136,136,160,0.1)", color: "#8888a0", border: "1px solid rgba(136,136,160,0.2)" },
  shareBtn: { background: "rgba(124,111,205,0.15)", color: "#7c6fcd", border: "1px solid rgba(124,111,205,0.3)", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  body: { flex: 1, display: "flex", overflow: "hidden" },
  editorArea: { flex: 1, overflow: "hidden" },
  sidebar: { width: 220, background: "#111118", borderLeft: "1px solid #2a2a3a", display: "flex", flexDirection: "column", flexShrink: 0 },
  tabs: { display: "flex", borderBottom: "1px solid #2a2a3a", flexShrink: 0 },
  tab: { flex: 1, padding: "10px 0", fontSize: 11, color: "#55556a", background: "transparent", borderBottom: "2px solid transparent", cursor: "pointer", position: "relative" },
  activeTab: { color: "#7c6fcd", borderBottom: "2px solid #7c6fcd" },
  unreadBadge: { position: "absolute", top: 4, right: 4, background: "#e74c3c", color: "#fff", borderRadius: 8, fontSize: 9, padding: "1px 4px", lineHeight: 1.4 },
  sidebarContent: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" },
  toast: { position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#e8e8f0", whiteSpace: "nowrap" },
}