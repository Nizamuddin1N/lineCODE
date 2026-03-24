import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await login(form.email, form.password)
    } catch (err) {
      setError(err.response?.data?.error || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <span style={s.logo}>{"</>"}</span>
          <span style={s.appName}>line<strong>CODE</strong></span>
        </div>
        <h2 style={s.title}>Welcome back</h2>
        <p style={s.sub}>Sign in to continue coding</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handle} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={s.footer}>
          No account?{" "}
          <Link to="/register" style={s.link}>Create one</Link>
        </p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 400, background: "#111118", border: "1px solid #2a2a3a", borderRadius: 14, padding: "36px 32px" },
  brand: { display: "flex", alignItems: "center", gap: 8, marginBottom: 28 },
  logo: { fontSize: 20, color: "#7c6fcd", fontFamily: "monospace", fontWeight: 700 },
  appName: { fontSize: 17, color: "#e8e8f0" },
  title: { fontSize: 22, fontWeight: 600, color: "#e8e8f0", marginBottom: 4 },
  sub: { fontSize: 13, color: "#8888a0", marginBottom: 24 },
  error: { background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", color: "#e74c3c", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "#8888a0", fontWeight: 500 },
  input: { background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, padding: "11px 14px", color: "#e8e8f0", fontSize: 14 },
  btn: { background: "#7c6fcd", color: "#fff", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, marginTop: 4, transition: "background 0.15s" },
  footer: { textAlign: "center", marginTop: 20, fontSize: 13, color: "#8888a0" },
  link: { color: "#7c6fcd" },
}