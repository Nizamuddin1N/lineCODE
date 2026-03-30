import { useNavigate } from "react-router-dom"
import useAuthStore from "../../store/authStore"

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <nav style={s.nav}>
      <div style={s.brand} onClick={() => navigate("/dashboard")}>
        <span style={s.logo}>{"</>"}</span>
        <span style={s.name}>line<strong>CODE</strong></span>
      </div>
      <div style={s.right}>
        <div style={s.avatar} title={user?.name}>
          <span style={{ ...s.dot, background: user?.color || "#7c6fcd" }} />
          <span style={s.username}>{user?.name}</span>
        </div>
        <button style={s.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  )
}

const s = {
  nav: {
    height: 52,
    background: "#111118",
    borderBottom: "1px solid #2a2a3a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  logo: {
    fontSize: 18,
    color: "#7c6fcd",
    fontFamily: "monospace",
    fontWeight: 700,
  },
  name: {
    fontSize: 16,
    color: "#e8e8f0",
    letterSpacing: "-0.3px",
  },
  right: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    flexShrink: 0,
  },
  username: {
    fontSize: 13,
    color: "#8888a0",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #2a2a3a",
    color: "#8888a0",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.15s",
  },
}