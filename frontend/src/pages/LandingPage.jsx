import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

const CODE_LINES = [
  { text: "// lineCODE — collaborative editor", color: "#55556a" },
  { text: "import { collaborate } from 'linecode'", color: "#7c6fcd" },
  { text: "", color: "" },
  { text: "const team = await Room.join({", color: "#e8e8f0" },
  { text: "  document: 'api-service.js',", color: "#9387dd" },
  { text: "  users: ['nizam', 'Nizamuddin', 'sara'],", color: "#9387dd" },
  { text: "  mode: 'realtime',", color: "#9387dd" },
  { text: "})", color: "#e8e8f0" },
  { text: "", color: "" },
  { text: "team.on('edit', (op) => {", color: "#e8e8f0" },
  { text: "  editor.apply(transform(op))", color: "#2ecc71" },
  { text: "  cursors.update(op.user)", color: "#2ecc71" },
  { text: "})", color: "#e8e8f0" },
  { text: "", color: "" },
  { text: "// everyone sees every keystroke", color: "#55556a" },
  { text: "team.sync() // ✓ live", color: "#7c6fcd" },
]

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-time sync",
    desc: "Every keystroke synced instantly across all collaborators using Operational Transformation.",
  },
  {
    icon: "👁",
    title: "Live cursors",
    desc: "See exactly where your teammates are typing with colored labeled cursors.",
  },
  {
    icon: "💬",
    title: "Built-in chat",
    desc: "Discuss code without leaving the editor. Messages scoped per document.",
  },
  {
    icon: "🕐",
    title: "Version history",
    desc: "Every edit is versioned. Preview and restore any previous state in one click.",
  },
  {
    icon: "🤖",
    title: "AI assistance",
    desc: "Improve, explain, fix, or complete your code with AI — right inside the editor.",
  },
  {
    icon: "🔒",
    title: "Role permissions",
    desc: "Owner, editor, viewer roles. Share with a link. Control who can edit.",
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [visibleLines, setVisibleLines] = useState(0)
  const [cursorVisible, setCursorVisible] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const [featuresVisible, setFeaturesVisible] = useState(false)

  // Typewriter effect for code block
  useEffect(() => {
    if (visibleLines >= CODE_LINES.length) return
    const timer = setTimeout(() => {
      setVisibleLines((v) => v + 1)
    }, visibleLines === 0 ? 600 : 120)
    return () => clearTimeout(timer)
  }, [visibleLines])

  // Blinking cursor
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v)
    }, 530)
    return () => clearInterval(timer)
  }, [])

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Features section reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setFeaturesVisible(true) },
      { threshold: 0.1 }
    )
    if (featuresRef.current) observer.observe(featuresRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div style={s.page}>
      {/* Animated background grid */}
      <div style={s.grid} />

      {/* Floating orbs */}
      <div style={{ ...s.orb, ...s.orb1, transform: `translateY(${scrollY * 0.15}px)` }} />
      <div style={{ ...s.orb, ...s.orb2, transform: `translateY(${scrollY * -0.1}px)` }} />
      <div style={{ ...s.orb, ...s.orb3, transform: `translateY(${scrollY * 0.2}px)` }} />

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navBrand}>
          <span style={s.navLogo}>{"</>"}</span>
          <span style={s.navName}>line<strong>CODE</strong></span>
        </div>
        <div style={s.navActions}>
          <button style={s.navLogin} onClick={() => navigate("/login")}>
            Sign in
          </button>
          <button style={s.navSignup} onClick={() => navigate("/register")}>
            Get started free
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <section style={s.hero} ref={heroRef}>
        <div style={s.heroLeft}>
          {/* Badge */}
          <div style={s.badge}>
            <span style={s.badgeDot} />
            Real-time collaborative editing
          </div>

          {/* Headline */}
          <h1 style={s.headline}>
            Code together,
            <br />
            <span style={s.headlineAccent}>ship faster.</span>
          </h1>

          <p style={s.subline}>
            A VS Code–grade editor where your entire team edits
            the same file simultaneously — with live cursors,
            built-in chat, AI assistance, and zero setup.
          </p>

          {/* CTA buttons */}
          <div style={s.ctaRow}>
            <button
              style={s.ctaPrimary}
              onClick={() => navigate("/register")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(124,111,205,0.4)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,111,205,0.25)"
              }}
            >
              Start coding for free
              <span style={s.ctaArrow}>→</span>
            </button>
            <button
              style={s.ctaSecondary}
              onClick={() => navigate("/login")}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#7c6fcd"
                e.currentTarget.style.color = "#e8e8f0"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#2a2a3a"
                e.currentTarget.style.color = "#8888a0"
              }}
            >
              Sign in
            </button>
          </div>

          {/* Social proof */}
          <div style={s.proof}>
            <div style={s.proofAvatars}>
              {["#7c6fcd", "#2ecc71", "#e74c3c", "#f39c12"].map((color, i) => (
                <div key={i} style={{ ...s.proofAvatar, background: color, marginLeft: i > 0 ? -8 : 0 }} />
              ))}
            </div>
            <span style={s.proofText}>
              Built for real-time collaboration
            </span>
          </div>
        </div>

        {/* Code block */}
        <div style={s.heroRight}>
          <div style={s.codeWindow}>
            {/* Window chrome */}
            <div style={s.windowBar}>
              <div style={s.windowDots}>
                <span style={{ ...s.dot, background: "#e74c3c" }} />
                <span style={{ ...s.dot, background: "#f39c12" }} />
                <span style={{ ...s.dot, background: "#2ecc71" }} />
              </div>
              <span style={s.windowTitle}>api-service.js — lineCODE</span>
              <div style={s.windowLive}>
                <span style={s.liveDot} />
                3 editing
              </div>
            </div>

            {/* Code content */}
            <div style={s.codeBody}>
              <div style={s.lineNumbers}>
                {CODE_LINES.slice(0, visibleLines).map((_, i) => (
                  <span key={i} style={s.lineNum}>{i + 1}</span>
                ))}
              </div>
              <div style={s.codeLines}>
                {CODE_LINES.slice(0, visibleLines).map((line, i) => (
                  <div key={i} style={s.codeLine}>
                    <span style={{ color: line.color || "#e8e8f0", fontFamily: "monospace" }}>
                      {line.text}
                    </span>
                    {i === visibleLines - 1 && (
                      <span style={{
                        ...s.cursor,
                        opacity: cursorVisible ? 1 : 0,
                      }}>|</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fake cursors */}
            {visibleLines > 5 && (
              <div style={s.fakeCursors}>
                <div style={{ ...s.fakeCursor, top: 72, left: 180, background: "#2ecc71" }}>
                  <span style={s.fakeCursorLabel}>Nizamuddin</span>
                </div>
                <div style={{ ...s.fakeCursor, top: 112, left: 220, background: "#e74c3c" }}>
                  <span style={s.fakeCursorLabel}>sara</span>
                </div>
              </div>
            )}
          </div>

          {/* Floating chat bubble */}
          {visibleLines > 10 && (
            <div style={s.chatBubble}>
              <span style={s.chatAvatar}>A</span>
              <div style={s.chatContent}>
                <span style={s.chatName}>Nizamuddin</span>
                <span style={s.chatMsg}>the transform looks good 👍</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features section */}
      <section style={s.features} ref={featuresRef}>
        <div style={s.featuresInner}>
          <p style={s.featuresLabel}>Everything you need</p>
          <h2 style={s.featuresTitle}>
            Built for teams who move fast
          </h2>

          <div style={s.featureGrid}>
            {FEATURES.map((f, i) => (
              <div
                key={i}
                style={{
                  ...s.featureCard,
                  opacity: featuresVisible ? 1 : 0,
                  transform: featuresVisible ? "translateY(0)" : "translateY(30px)",
                  transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#7c6fcd"
                  e.currentTarget.style.background = "#13131e"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e1e2a"
                  e.currentTarget.style.background = "#0f0f18"
                }}
              >
                <span style={s.featureIcon}>{f.icon}</span>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <p style={s.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={s.bottomCta}>
        <div style={s.bottomCtaInner}>
          <h2 style={s.bottomTitle}>
            Ready to code together?
          </h2>
          <p style={s.bottomSub}>
            Free forever. No credit card required.
          </p>
          <button
            style={s.bottomBtn}
            onClick={() => navigate("/register")}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.background = "#9387dd"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.background = "#7c6fcd"
            }}
          >
            Get started — it's free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <span style={s.footerBrand}>
          <span style={{ color: "#7c6fcd", fontFamily: "monospace" }}>{"</>"}</span>
          {" "}line<strong>CODE</strong>
        </span>
        <span style={s.footerCopy}>
          Built with React, Node.js, Socket.IO, Monaco Editor
        </span>
      </footer>
    </div>
  )
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#07070f",
    color: "#e8e8f0",
    overflowX: "hidden",
    position: "relative",
  },

  // Background
  grid: {
    position: "fixed",
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(124,111,205,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(124,111,205,0.03) 1px, transparent 1px)
    `,
    backgroundSize: "40px 40px",
    pointerEvents: "none",
    zIndex: 0,
  },
  orb: {
    position: "fixed",
    borderRadius: "50%",
    filter: "blur(80px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  orb1: {
    width: 500,
    height: 500,
    background: "rgba(124,111,205,0.08)",
    top: -100,
    right: -100,
  },
  orb2: {
    width: 400,
    height: 400,
    background: "rgba(46,204,113,0.05)",
    bottom: 200,
    left: -100,
  },
  orb3: {
    width: 300,
    height: 300,
    background: "rgba(124,111,205,0.06)",
    top: "40%",
    left: "30%",
  },

  // Nav
  nav: {
    position: "relative",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 48px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  navLogo: {
    fontSize: 22,
    color: "#7c6fcd",
    fontFamily: "monospace",
    fontWeight: 700,
  },
  navName: {
    fontSize: 18,
    color: "#e8e8f0",
    letterSpacing: "-0.5px",
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  navLogin: {
    background: "transparent",
    border: "1px solid #2a2a3a",
    color: "#8888a0",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  navSignup: {
    background: "#7c6fcd",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },

  // Hero
  hero: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 60,
    padding: "80px 48px 100px",
    maxWidth: 1200,
    margin: "0 auto",
  },
  heroLeft: {
    flex: 1,
    minWidth: 0,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(124,111,205,0.1)",
    border: "1px solid rgba(124,111,205,0.2)",
    borderRadius: 20,
    padding: "5px 14px",
    fontSize: 12,
    color: "#9387dd",
    marginBottom: 28,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#7c6fcd",
    animation: "pulse 2s infinite",
  },
  headline: {
    fontSize: "clamp(40px, 5vw, 64px)",
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: "-2px",
    color: "#f0f0f8",
    margin: "0 0 20px",
  },
  headlineAccent: {
    background: "linear-gradient(135deg, #7c6fcd, #9387dd, #2ecc71)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subline: {
    fontSize: 17,
    color: "#8888a0",
    lineHeight: 1.7,
    maxWidth: 480,
    margin: "0 0 36px",
  },
  ctaRow: {
    display: "flex",
    gap: 12,
    marginBottom: 32,
    flexWrap: "wrap",
  },
  ctaPrimary: {
    background: "#7c6fcd",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "14px 28px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    boxShadow: "0 4px 20px rgba(124,111,205,0.25)",
    transition: "all 0.2s",
  },
  ctaArrow: {
    fontSize: 16,
    transition: "transform 0.2s",
  },
  ctaSecondary: {
    background: "transparent",
    color: "#8888a0",
    border: "1px solid #2a2a3a",
    borderRadius: 10,
    padding: "14px 28px",
    fontSize: 15,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  proof: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  proofAvatars: {
    display: "flex",
  },
  proofAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "2px solid #07070f",
  },
  proofText: {
    fontSize: 13,
    color: "#55556a",
  },

  // Code window
  heroRight: {
    flex: 1,
    minWidth: 0,
    position: "relative",
  },
  codeWindow: {
    background: "#0d0d18",
    border: "1px solid #1e1e2a",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,111,205,0.1)",
    position: "relative",
  },
  windowBar: {
    height: 40,
    background: "#111118",
    borderBottom: "1px solid #1e1e2a",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    gap: 10,
  },
  windowDots: {
    display: "flex",
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  windowTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    color: "#55556a",
    marginLeft: -80,
  },
  windowLive: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11,
    color: "#2ecc71",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#2ecc71",
    animation: "pulse 1.5s infinite",
  },
  codeBody: {
    display: "flex",
    padding: "16px 0",
    minHeight: 280,
  },
  lineNumbers: {
    display: "flex",
    flexDirection: "column",
    padding: "0 16px",
    gap: 2,
    borderRight: "1px solid #1a1a28",
    marginRight: 16,
    flexShrink: 0,
  },
  lineNum: {
    fontSize: 13,
    color: "#2a2a3a",
    fontFamily: "monospace",
    lineHeight: "22px",
    textAlign: "right",
    minWidth: 16,
  },
  codeLines: {
    flex: 1,
    padding: "0 16px 0 0",
  },
  codeLine: {
    fontSize: 13,
    lineHeight: "22px",
    whiteSpace: "pre",
    fontFamily: "monospace",
  },
  cursor: {
    color: "#7c6fcd",
    fontWeight: 100,
    transition: "opacity 0.1s",
  },

  // Fake cursors
  fakeCursors: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
  },
  fakeCursor: {
    position: "absolute",
    width: 2,
    height: 18,
    borderRadius: 1,
    display: "flex",
    alignItems: "flex-start",
  },
  fakeCursorLabel: {
    position: "absolute",
    top: -18,
    left: 0,
    fontSize: 10,
    padding: "1px 5px",
    borderRadius: "3px 3px 3px 0",
    color: "#fff",
    background: "inherit",
    whiteSpace: "nowrap",
  },

  // Chat bubble
  chatBubble: {
    position: "absolute",
    bottom: -20,
    right: -20,
    background: "#111118",
    border: "1px solid #1e1e2a",
    borderRadius: 12,
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    animation: "slideUp 0.4s ease",
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#2ecc71",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "#fff",
    flexShrink: 0,
  },
  chatContent: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  chatName: {
    fontSize: 11,
    color: "#2ecc71",
    fontWeight: 600,
  },
  chatMsg: {
    fontSize: 12,
    color: "#e8e8f0",
  },

  // Features
  features: {
    position: "relative",
    zIndex: 1,
    padding: "100px 48px",
    background: "rgba(255,255,255,0.01)",
    borderTop: "1px solid rgba(255,255,255,0.04)",
  },
  featuresInner: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  featuresLabel: {
    fontSize: 12,
    color: "#7c6fcd",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: "clamp(28px, 3vw, 42px)",
    fontWeight: 700,
    letterSpacing: "-1px",
    color: "#f0f0f8",
    marginBottom: 56,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 16,
  },
  featureCard: {
    background: "#0f0f18",
    border: "1px solid #1e1e2a",
    borderRadius: 14,
    padding: "28px 28px",
    cursor: "default",
    transition: "all 0.2s",
  },
  featureIcon: {
    fontSize: 24,
    display: "block",
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#e8e8f0",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 13,
    color: "#8888a0",
    lineHeight: 1.7,
  },

  // Bottom CTA
  bottomCta: {
    position: "relative",
    zIndex: 1,
    padding: "100px 48px",
    textAlign: "center",
    borderTop: "1px solid rgba(255,255,255,0.04)",
  },
  bottomCtaInner: {
    maxWidth: 560,
    margin: "0 auto",
  },
  bottomTitle: {
    fontSize: "clamp(28px, 3vw, 44px)",
    fontWeight: 700,
    letterSpacing: "-1.5px",
    color: "#f0f0f8",
    marginBottom: 14,
  },
  bottomSub: {
    fontSize: 15,
    color: "#8888a0",
    marginBottom: 36,
  },
  bottomBtn: {
    background: "#7c6fcd",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "16px 36px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 20px rgba(124,111,205,0.3)",
  },

  // Footer
  footer: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 48px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
  },
  footerBrand: {
    fontSize: 14,
    color: "#e8e8f0",
  },
  footerCopy: {
    fontSize: 12,
    color: "#2a2a3a",
  },
}