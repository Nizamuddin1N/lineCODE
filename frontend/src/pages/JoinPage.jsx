import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../services/api"

export default function JoinPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState("")

  useEffect(() => {
    const resolve = async () => {
      try {
        const res = await api.post(`/documents/join/${token}`)
        // Token resolved → redirect to actual editor
        navigate(`/editor/${res.data.documentId}`, { replace: true })
      } catch (err) {
        setError(err.response?.data?.error || "Invalid or expired share link")
      }
    }
    resolve()
  }, [token])

  if (error) return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={s.icon}>{"{ }"}</p>
        <p style={s.title}>Invalid share link</p>
        <p style={s.sub}>{error}</p>
        <button style={s.btn} onClick={() => navigate("/")}>
          Go to dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={s.icon}>{"{ }"}</p>
        <p style={s.title}>Joining document...</p>
        <p style={s.sub}>Resolving share link</p>
      </div>
    </div>
  )
}

const s = {
  page: { height: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" },
  card: { textAlign: "center", padding: 40 },
  icon: { fontSize: 40, color: "#2a2a3a", fontFamily: "monospace", marginBottom: 16 },
  title: { fontSize: 18, color: "#e8e8f0", marginBottom: 8 },
  sub: { fontSize: 13, color: "#8888a0", marginBottom: 24 },
  btn: { background: "#7c6fcd", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, cursor: "pointer" },
}