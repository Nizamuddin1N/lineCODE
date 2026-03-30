/*
  This toolbar sits above Monaco.
  It holds the AI suggestion trigger and shows
  what mode the editor is in.
*/

export default function EditorToolbar({
  language,
  onAISuggest,
  hasSelection,
  isLoading,
  readOnly,
}) {
  const types = [
    { key: "improve", label: "Improve" },
    { key: "explain", label: "Explain" },
    { key: "fix",     label: "Fix bugs" },
    { key: "complete",label: "Complete" },
  ]

  return (
    <div style={s.bar}>
      <span style={s.label}>AI assist</span>
      <div style={s.btnGroup}>
        {types.map((t) => (
          <button
            key={t.key}
            style={{
              ...s.btn,
              opacity: readOnly || isLoading ? 0.4 : 1,
            }}
            disabled={readOnly || isLoading}
            onClick={() => onAISuggest(t.key)}
            title={hasSelection ? `${t.label} selected code` : `${t.label} full file`}
          >
            {isLoading ? "..." : t.label}
          </button>
        ))}
      </div>
      {hasSelection && (
        <span style={s.selectionHint}>selection only</span>
      )}
    </div>
  )
}

const s = {
  bar: { height: 36, background: "#0d0d15", borderBottom: "1px solid #1e1e2a", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", flexShrink: 0 },
  label: { fontSize: 11, color: "#55556a", flexShrink: 0 },
  btnGroup: { display: "flex", gap: 4 },
  btn: { background: "#1a1a28", border: "1px solid #2a2a3a", color: "#8888a0", borderRadius: 5, padding: "3px 10px", fontSize: 11, cursor: "pointer" },
  selectionHint: { fontSize: 10, color: "#7c6fcd", background: "rgba(124,111,205,0.1)", borderRadius: 4, padding: "2px 6px" },
}