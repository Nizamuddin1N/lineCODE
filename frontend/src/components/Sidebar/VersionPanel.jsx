export default function VersionPanel({ versions, onRestore }) {
  if (versions.length === 0) {
    return (
      <div style={s.panel}>
        <p style={s.heading}>Version history</p>
        <p style={s.empty}>No versions saved yet</p>
      </div>
    )
  }

  return (
    <div style={s.panel}>
      <p style={s.heading}>Version history</p>
      <div style={s.list}>
        {versions.map((v, i) => (
          <div key={i} style={s.item}>
            <div style={s.meta}>
              <span style={s.by}>{v.savedByName || "Unknown"}</span>
              <span style={s.time}>
                {new Date(v.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p style={s.date}>{new Date(v.timestamp).toLocaleDateString()}</p>
            <button style={s.restore} onClick={() => onRestore(v.content)}>
              Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  panel: { padding: "12px 0" },
  heading: { fontSize: 11, color: "#55556a", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 16px", marginBottom: 8 },
  list: { display: "flex", flexDirection: "column", gap: 2 },
  item: { padding: "10px 16px", borderBottom: "1px solid #1e1e2a" },
  meta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  by: { fontSize: 12, color: "#e8e8f0", fontWeight: 500 },
  time: { fontSize: 11, color: "#55556a" },
  date: { fontSize: 11, color: "#55556a", marginBottom: 8 },
  restore: { background: "rgba(124,111,205,0.15)", color: "#7c6fcd", border: "1px solid rgba(124,111,205,0.3)", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" },
  empty: { fontSize: 12, color: "#55556a", padding: "0 16px" },
}