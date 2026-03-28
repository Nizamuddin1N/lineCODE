export default function UsersPanel({ users, currentUserId }) {
  return (
    <div style={s.panel}>
      <p style={s.heading}>In this file</p>
      <div style={s.list}>
        {users.map((u) => (
          <div key={u.socketId} style={s.user}>
            <div style={{ ...s.dot, background: u.color }} />
            <span style={s.name}>
              {u.name}
              {u.userId === currentUserId && (
                <span style={s.you}> you</span>
              )}
            </span>
            <div style={s.online} title="Online" />
          </div>
        ))}
        {users.length === 0 && (
          <p style={s.empty}>Only you</p>
        )}
      </div>
    </div>
  )
}

const s = {
  panel: { padding: "12px 0" },
  heading: { fontSize: 11, color: "#55556a", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 16px", marginBottom: 8 },
  list: { display: "flex", flexDirection: "column", gap: 2 },
  user: { display: "flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 6 },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  name: { fontSize: 13, color: "#e8e8f0", flex: 1 },
  you: { fontSize: 11, color: "#55556a" },
  online: { width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", flexShrink: 0 },
  empty: { fontSize: 12, color: "#55556a", padding: "0 16px" },
}