import { useState, useEffect, useRef } from "react"
import useAuthStore from "../../store/authStore"

export default function ChatPanel({ messages, sendMessage }) {
  const [input, setInput] = useState("")
  const bottomRef = useRef(null)
  const { user } = useAuthStore()

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setInput("")
  }

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isOwnMessage = (msg) =>
    msg.senderId?.toString() === user?.id?.toString()

  return (
    <div style={s.wrap}>
      {/* Messages list */}
      <div style={s.messageList}>
        {messages.length === 0 ? (
          <div style={s.emptyState}>
            <p style={s.emptyIcon}>{"[ ]"}</p>
            <p style={s.emptyText}>No messages yet</p>
            <p style={s.emptySub}>Start the conversation</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const own = isOwnMessage(msg)
            const prevMsg = messages[i - 1]
            // Group consecutive messages from same sender
            const isContinuation =
              prevMsg && prevMsg.senderId?.toString() === msg.senderId?.toString()

            return (
              <div key={msg._id || i} style={{ ...s.msgWrap, ...(own ? s.msgWrapOwn : {}) }}>
                {/* Show sender name only on first message in a group */}
                {!isContinuation && !own && (
                  <div style={s.senderRow}>
                    <span
                      style={{ ...s.senderDot, background: msg.senderColor }}
                    />
                    <span style={s.senderName}>{msg.senderName}</span>
                    <span style={s.msgTime}>{formatTime(msg.createdAt)}</span>
                  </div>
                )}

                <div style={{
                  ...s.bubble,
                  ...(own ? s.bubbleOwn : s.bubbleOther),
                  ...(isContinuation ? s.bubbleContinuation : {}),
                }}>
                  {msg.message}
                </div>

                {own && !isContinuation && (
                  <span style={{ ...s.msgTime, textAlign: "right", display: "block", marginTop: 2 }}>
                    {formatTime(msg.createdAt)}
                  </span>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={s.inputWrap}>
        <textarea
          style={s.input}
          placeholder="Message... (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          maxLength={1000}
        />
        <button
          style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
          onClick={handleSend}
          disabled={!input.trim()}
        >
          ↑
        </button>
      </div>
    </div>
  )
}

const s = {
  wrap: { display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" },
  messageList: { flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 },
  emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0" },
  emptyIcon: { fontSize: 28, color: "#2a2a3a", fontFamily: "monospace", marginBottom: 10 },
  emptyText: { fontSize: 13, color: "#55556a", marginBottom: 4 },
  emptySub: { fontSize: 11, color: "#3a3a4a" },
  msgWrap: { display: "flex", flexDirection: "column", maxWidth: "85%", alignSelf: "flex-start" },
  msgWrapOwn: { alignSelf: "flex-end" },
  senderRow: { display: "flex", alignItems: "center", gap: 5, marginBottom: 3, marginLeft: 2 },
  senderDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  senderName: { fontSize: 11, color: "#8888a0", fontWeight: 500 },
  msgTime: { fontSize: 10, color: "#3a3a4a", marginLeft: 4 },
  bubble: { fontSize: 13, lineHeight: 1.5, padding: "7px 10px", borderRadius: 10, wordBreak: "break-word", whiteSpace: "pre-wrap" },
  bubbleOther: { background: "#1e1e2a", color: "#e8e8f0", borderTopLeftRadius: 3 },
  bubbleOwn: { background: "rgba(124,111,205,0.25)", color: "#e8e8f0", borderTopRightRadius: 3 },
  bubbleContinuation: { marginTop: 2 },
  inputWrap: { padding: "8px 10px", borderTop: "1px solid #1e1e2a", display: "flex", gap: 6, alignItems: "flex-end", flexShrink: 0 },
  input: { flex: 1, background: "#0a0a0f", border: "1px solid #2a2a3a", borderRadius: 8, padding: "8px 10px", color: "#e8e8f0", fontSize: 13, resize: "none", lineHeight: 1.4, maxHeight: 80, overflowY: "auto", fontFamily: "inherit" },
  sendBtn: { width: 32, height: 32, background: "#7c6fcd", color: "#fff", borderRadius: 8, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none", flexShrink: 0 },
}