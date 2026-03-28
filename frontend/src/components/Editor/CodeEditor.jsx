import { useEffect, useRef, useState, useCallback } from "react"
import MonacoEditor from "@monaco-editor/react"
import { useSocket } from "../../hooks/useSocket"
import CursorLayer from "./CursorLayer"
import useAuthStore from "../../store/authStore"

const SAVE_DEBOUNCE = 2000

export default function CodeEditor({ docId, initialContent, initialLanguage, onContentChange, socket, connected, emitOperation, emitCursor,}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const revisionRef = useRef(0)
  const isRemoteChange = useRef(false)
  const saveTimerRef = useRef(null)

  const [content, setContent] = useState(initialContent || "")
  const [language, setLanguage] = useState(initialLanguage || "javascript")
  const [saveStatus, setSaveStatus] = useState("saved")
  const [remoteCursors, setRemoteCursors] = useState([])

  const { user } = useAuthStore()
  // ─── Listen to incoming socket events ──────────────────────────
  useEffect(() => {
    if (!socket) return

    socket.on("document-data", ({ content, language, revision }) => {
      setContent(content)
      setLanguage(language)
      revisionRef.current = revision
    })

    socket.on("receive-operation", ({ operation, revision }) => {
      // Mark as remote so our onChange handler doesn't re-emit
      isRemoteChange.current = true
      applyRemoteOperation(operation)
      revisionRef.current = revision
      isRemoteChange.current = false
    })

    socket.on("operation-ack", ({ revision }) => {
      revisionRef.current = revision
    })

    socket.on("cursor-update", ({ socketId, cursor, name, color, userId }) => {
      setRemoteCursors((prev) => {
        const filtered = prev.filter((c) => c.socketId !== socketId)
        return [...filtered, { socketId, cursor, name, color, userId }]
      })
    })

    return () => {
      socket.off("document-data")
      socket.off("receive-operation")
      socket.off("operation-ack")
      socket.off("cursor-update")
    }
  }, [socket])

  // ─── Apply a remote operation to Monaco ─────────────────────────
  const applyRemoteOperation = (op) => {
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    if (!model) return

    if (op.type === "insert") {
      const pos = model.getPositionAt(op.position)
      model.pushEditOperations([], [{
        range: {
          startLineNumber: pos.lineNumber,
          startColumn: pos.column,
          endLineNumber: pos.lineNumber,
          endColumn: pos.column,
        },
        text: op.chars,
      }], () => null)
    }

    if (op.type === "delete") {
      const startPos = model.getPositionAt(op.position)
      const endPos = model.getPositionAt(op.position + op.count)
      model.pushEditOperations([], [{
        range: {
          startLineNumber: startPos.lineNumber,
          startColumn: startPos.column,
          endLineNumber: endPos.lineNumber,
          endColumn: endPos.column,
        },
        text: "",
      }], () => null)
    }
  }

  // ─── Handle local edits ─────────────────────────────────────────
  const handleChange = useCallback((newValue) => {
    if (isRemoteChange.current) return

    const oldValue = content
    setContent(newValue)
    onContentChange?.(newValue)

    // Build OT operation from the diff
    const operation = buildOperation(oldValue, newValue)
    if (operation) {
      emitOperation(operation, revisionRef.current)
    }

    // Auto-save debounce
    setSaveStatus("unsaved")
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving...")
      onContentChange?.(newValue, true) // true = trigger save
    }, SAVE_DEBOUNCE)
  }, [content, emitOperation])

  // ─── Build OT operation from two strings ────────────────────────
  const buildOperation = (oldStr, newStr) => {
    /*
      Simple diff — find the first position where strings differ.
      Production systems use Myers diff algorithm.
      For our purpose this handles the vast majority of single-edit cases.
    */
    let start = 0
    while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
      start++
    }

    if (oldStr.length < newStr.length) {
      return {
        type: "insert",
        position: start,
        chars: newStr.slice(start, start + (newStr.length - oldStr.length)),
        userId: user?.id,
        revision: revisionRef.current,
      }
    }

    if (oldStr.length > newStr.length) {
      return {
        type: "delete",
        position: start,
        count: oldStr.length - newStr.length,
        userId: user?.id,
        revision: revisionRef.current,
      }
    }

    return null
  }

  // ─── Emit cursor position on selection change ───────────────────
  const handleCursorChange = useCallback((e) => {
    emitCursor({
      lineNumber: e.position.lineNumber,
      column: e.position.column,
    })
  }, [emitCursor])

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    editor.onDidChangeCursorPosition(handleCursorChange)
  }

  return (
    <div style={s.wrap}>
      <div style={s.statusBar}>
        <span style={{ ...s.connDot, background: connected ? "#2ecc71" : "#e74c3c" }} />
        <span style={s.connText}>{connected ? "Live" : "Reconnecting..."}</span>
        <span style={s.lang}>{language}</span>
        <span style={s.saveStatus}>{saveStatus}</span>
      </div>

      <div style={s.editorWrap}>
        <MonacoEditor
          height="100%"
          theme="vs-dark"
          language={language}
          value={content}
          onChange={handleChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineNumbers: "on",
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            tabSize: 2,
          }}
        />
        <CursorLayer
          editorRef={editorRef}
          cursors={remoteCursors.filter((c) => c.userId !== user?.id)}
        />
      </div>
    </div>
  )
}

const s = {
  wrap: { display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" },
  statusBar: { height: 28, background: "#111118", borderBottom: "1px solid #2a2a3a", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", flexShrink: 0 },
  connDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  connText: { fontSize: 11, color: "#8888a0" },
  lang: { fontSize: 11, color: "#55556a", marginLeft: "auto" },
  saveStatus: { fontSize: 11, color: "#55556a", marginLeft: 12 },
  editorWrap: { flex: 1, position: "relative", overflow: "hidden" },
}