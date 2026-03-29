import { useState } from "react"

export default function VersionPanel({ versions, onRestore, userRole }) {
  const [preview, setPreview] = useState(null)
  const [restoring, setRestoring] = useState(null)

  const handleRestore = async (version) => {
    if (!confirm(`Restore to version saved by ${version.savedByName}? Your current content will be saved as a version first.`)) return
    setRestoring(version._id)
    await onRestore(version._id)
    setRestoring(null)
  }

  const canRestore = userRole === "owner" || userRole === "editor"

  if (versions.length === 0) {
    return (
      <div style={s.panel}>
        <p style={s.heading}>Version history</p>
        <p style={s.empty}>No versions yet. Versions save automatically as you edit.</p>
      </div>
    )
  }

  return (
    <div style={s.panel}>
      <p style={s.heading}>Version history</p>

      {/* Preview pane */}
      {preview && (
        <div style={s.previewWrap}>
          <div style={s.previewHeader}>
            <span style={s.previewLabel}>Preview</span>
            <button style={s.closeBtn} onClick={() => setPreview(null)}>×</button>
          </div>
          <pre style={s.previewCode}>{preview.content || "(empty)"}</pre>
        </div>
      )}

      <div style={s.list}>
        {versions.map((v, i) => {
          const isFirst = i === 0
          const charCount = v.content?.length || 0
          const shortPreview = v.content?.slice(0, 60).replace(/\n/g, " ") || "(empty)"

          return (
            <div
              key={v._id}
              style={{
                ...s.item,
                ...(isFirst ? s.latestItem : {}),
              }}
            >
              <div style={s.itemHeader}>
                <div style={s.authorRow}>
                  <div style={s.authorDot} />
                  <span style={s.authorName}>{v.savedByName || "Unknown"}</span>
                  {isFirst && <span style={s.latestBadge}>latest</span>}
                </div>
                <span style={s.time}>
                  {new Date(v.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <p style={s.date}>{new Date(v.timestamp).toLocaleDateString()}</p>
              <p style={s.contentPreview}>{shortPreview}</p>
              <p style={s.charCount}>{charCount} characters</p>

              <div style={s.actions}>
                <button
                  style={s.previewBtn}
                  onClick={() => setPreview(preview?._id === v._id ? null : v)}
                >
                  {preview?._id === v._id ? "Hide" : "Preview"}
                </button>
                {canRestore && !isFirst && (
                  <button
                    style={{ ...s.restoreBtn, opacity: restoring === v._id ? 0.6 : 1 }}
                    onClick={() => handleRestore(v)}
                    disabled={restoring === v._id}
                  >
                    {restoring === v._id ? "Restoring..." : "Restore"}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  panel: { padding: "12px 0" },
  heading: { fontSize: 11, color: "#55556a", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 16px", marginBottom: 8 },
  empty: { fontSize: 12, color: "#55556a", padding: "0 16px", lineHeight: 1.6 },
  previewWrap: { margin: "0 12px 12px", background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, overflow: "hidden" },
  previewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderBottom: "1px solid #2a2a3a" },
  previewLabel: { fontSize: 11, color: "#55556a" },
  closeBtn: { background: "transparent", color: "#55556a", fontSize: 16, cursor: "pointer", lineHeight: 1 },
  previewCode: { fontSize: 11, color: "#e8e8f0", fontFamily: "monospace", padding: "10px", maxHeight: 180, overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 },
  list: { display: "flex", flexDirection: "column" },
  item: { padding: "12px 16px", borderBottom: "1px solid #1a1a28" },
  latestItem: { borderLeft: "2px solid #7c6fcd" },
  itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  authorRow: { display: "flex", alignItems: "center", gap: 6 },
  authorDot: { width: 6, height: 6, borderRadius: "50%", background: "#7c6fcd", flexShrink: 0 },
  authorName: { fontSize: 12, color: "#e8e8f0", fontWeight: 500 },
  latestBadge: { fontSize: 10, background: "rgba(124,111,205,0.2)", color: "#7c6fcd", borderRadius: 4, padding: "1px 5px" },
  time: { fontSize: 11, color: "#55556a" },
  date: { fontSize: 11, color: "#55556a", marginBottom: 6 },
  contentPreview: { fontSize: 11, color: "#55556a", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 },
  charCount: { fontSize: 10, color: "#3a3a4a", marginBottom: 8 },
  actions: { display: "flex", gap: 6 },
  previewBtn: { background: "#1e1e2a", color: "#8888a0", border: "1px solid #2a2a3a", borderRadius: 5, padding: "3px 8px", fontSize: 11, cursor: "pointer" },
  restoreBtn: { background: "rgba(124,111,205,0.15)", color: "#7c6fcd", border: "1px solid rgba(124,111,205,0.3)", borderRadius: 5, padding: "3px 8px", fontSize: 11, cursor: "pointer" },
}