import { useParams } from "react-router-dom"
import Navbar from "../components/UI/Navbar"

export default function EditorPage() {
  const { id, token } = useParams()
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0a0f" }}>
      <Navbar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "monospace", fontSize: 32, color: "#2a2a3a" }}>{"{ }"}</p>
          <p style={{ color: "#8888a0", marginTop: 12 }}>Editor loads in Phase 2</p>
          <p style={{ color: "#55556a", fontSize: 12, marginTop: 6 }}>doc id: {id || token}</p>
        </div>
      </div>
    </div>
  )
}