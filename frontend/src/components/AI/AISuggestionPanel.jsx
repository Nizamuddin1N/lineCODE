/*
  Shows AI suggestion result.
  Why a separate panel instead of a modal?
  Modal blocks the code — user can't compare suggestion
  against their code at the same time.
  A panel alongside the editor lets them read both.
*/

export default function AISuggestionPanel({ suggestion, onClose, onApply, type }) {
  if (!suggestion) return null

  const isCode = type === "improve" || type === "fix" || type === "complete"

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={s.title}>AI suggestion — {type}</span>
        <div style={s.actions}>
          {isCode && (
            <button style={s.applyBtn} onClick={onApply}>
              Apply to editor
            </button>
          )}
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>
      </div>
      <div style={s.content}>
        <pre style={s.pre}>{suggestion}</pre>
      </div>
    </div>
  )
}

const s = {
  panel: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "#111118", borderTop: "2px solid #7c6fcd", display: "flex", flexDirection: "column", zIndex: 10 },
  header: { height: 36, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", borderBottom: "1px solid #2a2a3a", flexShrink: 0 },
  title: { fontSize: 12, color: "#7c6fcd", fontWeight: 500 },
  actions: { display: "flex", alignItems: "center", gap: 8 },
  applyBtn: { background: "rgba(124,111,205,0.2)", color: "#7c6fcd", border: "1px solid rgba(124,111,205,0.4)", borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer" },
  closeBtn: { background: "transparent", color: "#55556a", fontSize: 18, cursor: "pointer", lineHeight: 1, border: "none" },
  content: { flex: 1, overflowY: "auto", padding: 14 },
  pre: { fontSize: 12, color: "#e8e8f0", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.6 },
}