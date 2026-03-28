import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"
import useAuthStore from "../store/authStore"
import { useSocket } from "../hooks/useSocket"
import Navbar from "../components/UI/Navbar"
import CodeEditor from "../components/Editor/CodeEditor"
import UsersPanel from "../components/Sidebar/UsersPanel"
import VersionPanel from "../components/Sidebar/VersionPanel"

const LANGUAGES = [
  "javascript","typescript","python","java",
  "cpp","go","rust","html","css","sql","bash","json"
]

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [doc, setDoc] = useState(null)
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarTab, setSidebarTab] = useState("users")
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState("")
  const [copied, setCopied] = useState(false)

  const { socket, connected, activeUsers, notification, emitOperation, emitCursor } = useSocket(id)

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await api.get(`/documents/${id}`)
        setDoc(res.data)
        setTitleInput(res.data.title)
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
      setVersions(res.data)
    } catch {}
  }

  const saveContent = async (content, shouldSave) => {
    if (!shouldSave) return
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
    try {
      await api.put(`/documents/${id}`, { title: titleInput })
      setDoc((d) => ({ ...d, title: titleInput }))
    } finally {
      setEditingTitle(false)
    }
  }

  const changeLanguage = async (lang) => {
    setDoc((d) => ({ ...d, language: lang }))
    await api.put(`/documents/${id}`, { language: lang })
  }

  const copyShareLink = () => {
    const link = `${window.location.origin}/join/${doc.shareToken}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const restoreVersion = async (content) => {
    await api.put(`/documents/${id}`, { content })
    setDoc((d) => ({ ...d, content }))
    fetchVersions()
  }

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0f" }}>
      <p style={{ color: "#55556a", fontFamily: "monospace" }}>Loading...</p>
    </div>
  )

  return (
    <div style={s.page}>
      <Navbar />

      {/* Editor header */}
      <div style={s.editorHeader}>
        <div style={s.titleArea}>
          {editingTitle ? (
            <input
              style={s.titleInput}
              value={titleInput}
              autoFocus
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
            />
          ) : (
            <span style={s.titleText} onClick={() => setEditingTitle(true)} title="Click to rename">
              {doc?.title}
            </span>
          )}

          <select
            style={s.langSelect}
            value={doc?.language}
            onChange={(e) => changeLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <button style={s.shareBtn} onClick={copyShareLink}>
          {copied ? "Copied!" : "Share link"}
        </button>
      </div>

      <div style={s.body}>
        {/* Main editor */}
        <div style={s.editorArea}>
          <CodeEditor
            docId={id}
            initialContent={doc?.content}
            initialLanguage={doc?.language}
            onContentChange={saveContent}
            socket={socket}              // ← add
            connected={connected}       // ← add
            emitOperation={emitOperation}  // ← add
            emitCursor={emitCursor}     // ← add
          />
        </div>

        {/* Sidebar */}
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
          </div>

          <div style={s.sidebarContent}>
            {sidebarTab === "users" ? (
              <UsersPanel users={activeUsers} currentUserId={user?.id} />
            ) : (
              <VersionPanel versions={versions} onRestore={restoreVersion} />
            )}
          </div>
        </div>
      </div>

      {/* Join/leave notification toast */}
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
  titleArea: { display: "flex", alignItems: "center", gap: 12 },
  titleText: { fontSize: 14, color: "#e8e8f0", cursor: "pointer", fontWeight: 500, padding: "2px 6px", borderRadius: 4 },
  titleInput: { fontSize: 14, color: "#e8e8f0", background: "#0a0a0f", border: "1px solid #7c6fcd", borderRadius: 4, padding: "3px 8px", width: 200 },
  langSelect: { background: "#0a0a0f", border: "1px solid #2a2a3a", color: "#8888a0", borderRadius: 4, padding: "3px 8px", fontSize: 12, cursor: "pointer" },
  shareBtn: { background: "rgba(124,111,205,0.15)", color: "#7c6fcd", border: "1px solid rgba(124,111,205,0.3)", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  body: { flex: 1, display: "flex", overflow: "hidden" },
  editorArea: { flex: 1, overflow: "hidden" },
  sidebar: { width: 220, background: "#111118", borderLeft: "1px solid #2a2a3a", display: "flex", flexDirection: "column", flexShrink: 0 },
  tabs: { display: "flex", borderBottom: "1px solid #2a2a3a", flexShrink: 0 },
  tab: { flex: 1, padding: "10px 0", fontSize: 12, color: "#55556a", background: "transparent", borderBottom: "2px solid transparent", cursor: "pointer" },
  activeTab: { color: "#7c6fcd", borderBottom: "2px solid #7c6fcd" },
  sidebarContent: { flex: 1, overflowY: "auto" },
  toast: { position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#16161f", border: "1px solid #2a2a3a", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#e8e8f0", whiteSpace: "nowrap" },
}