import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../services/api"
import Navbar from "../components/UI/Navbar"

const LANGUAGES = ["javascript","typescript","python","java","cpp","go","rust","html","css","sql"]

export default function DashboardPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [shareInput, setShareInput] = useState("")
  const navigate = useNavigate()

  const fetchDocs = async () => {
    try {
      const res = await api.get("/documents")
      setDocs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const createDoc = async () => {
    setCreating(true)
    try {
      const res = await api.post("/documents", { title: "Untitled" })
      navigate(`/editor/${res.data._id}`)
    } finally {
      setCreating(false)
    }
  }

  const deleteDoc = async (e, id) => {
    e.stopPropagation()
    if (!confirm("Delete this document?")) return
    await api.delete(`/documents/${id}`)
    setDocs((d) => d.filter((doc) => doc._id !== id))
  }

  const joinByLink = async () => {
    const token = shareInput.trim().split("/").pop()
    if (!token) return
    try {
      const res = await api.post(`/documents/join/${token}`)
      navigate(`/editor/${res.data.documentId}`)
    } catch {
      alert("Invalid share link")
    }
  }

  useEffect(() => { fetchDocs() }, [])

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.body}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>My workspace</h1>
            <p style={s.sub}>{docs.length} document{docs.length !== 1 ? "s" : ""}</p>
          </div>
          <button style={s.newBtn} onClick={createDoc} disabled={creating}>
            {creating ? "Creating..." : "+ New file"}
          </button>
        </div>

        <div style={s.joinRow}>
          <input
            style={s.joinInput}
            placeholder="Paste a share link to join a document..."
            value={shareInput}
            onChange={(e) => setShareInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinByLink()}
          />
          <button style={s.joinBtn} onClick={joinByLink}>Join</button>
        </div>

        {loading ? (
          <p style={s.empty}>Loading...</p>
        ) : docs.length === 0 ? (
          <div style={s.emptyState}>
            <p style={s.emptyIcon}>{"{ }"}</p>
            <p style={s.emptyText}>No documents yet</p>
            <p style={s.emptySub}>Create your first file to get started</p>
          </div>
        ) : (
          <div style={s.grid}>
            {docs.map((doc) => (
              <div key={doc._id} style={s.card} onClick={() => navigate(`/editor/${doc._id}`)}>
                <div style={s.cardTop}>
                  <span style={s.lang}>{doc.language}</span>
                  <button style={s.deleteBtn} onClick={(e) => deleteDoc(e, doc._id)} title="Delete">×</button>
                </div>
                <p style={s.docTitle}>{doc.title}</p>
                <p style={s.docMeta}>
                  <span style={{ ...s.ownerDot, background: doc.ownerId?.color || "#7c6fcd" }} />
                  {doc.ownerId?.name} · {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0f" },
  body: { flex: 1, padding: "32px 40px", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 600, color: "#e8e8f0" },
  sub: { fontSize: 13, color: "#8888a0", marginTop: 4 },
  newBtn: { background: "#7c6fcd", color: "#fff", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600 },
  joinRow: { display: "flex", gap: 10, marginBottom: 32 },
  joinInput: { flex: 1, background: "#111118", border: "1px solid #2a2a3a", borderRadius: 8, padding: "10px 14px", color: "#e8e8f0", fontSize: 13 },
  joinBtn: { background: "#1e1e2a", border: "1px solid #2a2a3a", color: "#8888a0", borderRadius: 8, padding: "10px 16px", fontSize: 13 },
  empty: { color: "#8888a0", fontSize: 14 },
  emptyState: { textAlign: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 48, color: "#2a2a3a", fontFamily: "monospace", marginBottom: 16 },
  emptyText: { fontSize: 18, color: "#8888a0", marginBottom: 8 },
  emptySub: { fontSize: 13, color: "#55556a" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 },
  card: { background: "#111118", border: "1px solid #2a2a3a", borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "border-color 0.15s" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  lang: { background: "rgba(124,111,205,0.15)", color: "#7c6fcd", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "monospace" },
  deleteBtn: { background: "transparent", color: "#55556a", fontSize: 18, lineHeight: 1, padding: "0 4px" },
  docTitle: { fontSize: 15, fontWeight: 500, color: "#e8e8f0", marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  docMeta: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#55556a" },
  ownerDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
}