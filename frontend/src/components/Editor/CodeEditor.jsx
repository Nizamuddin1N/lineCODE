import { useEffect, useRef, useState, useCallback } from "react"
import MonacoEditor from "@monaco-editor/react"
import CursorLayer from "./CursorLayer"
import EditorToolbar from "./EditorToolbar"
import AISuggestionPanel from "../AI/AISuggestionPanel"
import useAuthStore from "../../store/authStore"
import api from "../../services/api"

const SAVE_DEBOUNCE = 2000

export default function CodeEditor({
  docId,
  initialContent,
  initialLanguage,
  onContentChange,
  socket,
  connected,
  emitOperation,
  emitCursor,
  readOnly = false,
  restoredContent,
}) {
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const revisionRef = useRef(0)
  const isRemoteChange = useRef(false)
  const saveTimerRef = useRef(null)

  const [content, setContent] = useState(initialContent || "")
  const [language, setLanguage] = useState(initialLanguage || "javascript")
  const [saveStatus, setSaveStatus] = useState("saved")
  const [remoteCursors, setRemoteCursors] = useState([])
  const [hasSelection, setHasSelection] = useState(false)     // ← new
  const [aiLoading, setAiLoading] = useState(false)           // ← new
  const [aiSuggestion, setAiSuggestion] = useState(null)      // ← new
  const [aiType, setAiType] = useState("improve")             // ← new

  const { user } = useAuthStore()

  // ─── Restore version directly into Monaco ───────────────────────
  useEffect(() => {
    if (restoredContent === undefined || restoredContent === null) return
    const editor = editorRef.current
    if (!editor) return
    const model = editor.getModel()
    if (!model) return
    isRemoteChange.current = true
    model.setValue(restoredContent)
    setContent(restoredContent)
    setSaveStatus("saved")
    isRemoteChange.current = false
  }, [restoredContent])

  // ─── Listen to incoming socket events ───────────────────────────
  useEffect(() => {
    if (!socket) return

    socket.on("document-data", ({ content, language, revision }) => {
      setContent(content)
      setLanguage(language)
      revisionRef.current = revision
    })

    socket.on("receive-operation", ({ operation, revision }) => {
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

  // ─── AI suggestion ───────────────────────────────────────────────
  const handleAISuggest = async (type) => {
    const editor = editorRef.current
    if (!editor) return

    setAiLoading(true)
    setAiType(type)
    setAiSuggestion(null)

    // Get selected text if any, otherwise use full content
    const selection = editor.getSelection()
    const selectedText = editor.getModel()?.getValueInRange(selection)
    const code = selectedText?.trim() || ""

    try {
      const res = await api.post("/ai/suggest", {
        code,
        language,
        type,
        fullContent: content,
      })
      setAiSuggestion(res.data.suggestion)
    } catch (err) {
      setAiSuggestion(
        err.response?.data?.error || "AI suggestion failed. Check your API key."
      )
    } finally {
      setAiLoading(false)
    }
  }

  // Apply AI suggestion to editor
  const handleApplySuggestion = () => {
    /*
      Two ways to apply:
      A - Replace entire file content
      B - Replace only the selection if one exists

      We use B with fallback to A.
      More surgical — user keeps code they didn't ask to change.
    */
    const editor = editorRef.current
    if (!editor || !aiSuggestion) return

    const model = editor.getModel()
    const selection = editor.getSelection()
    const selectedText = model?.getValueInRange(selection)

    // Extract code block from suggestion if wrapped in ```
    const codeMatch = aiSuggestion.match(/```[\w]*\n?([\s\S]*?)```/)
    const codeToApply = codeMatch ? codeMatch[1].trim() : aiSuggestion

    if (selectedText?.trim()) {
      // Replace only selection
      model.pushEditOperations([], [{
        range: selection,
        text: codeToApply,
      }], () => null)
    } else {
      // Replace full content
      model.setValue(codeToApply)
    }

    setAiSuggestion(null)
  }

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
    if (newValue === undefined) return

    const oldValue = content
    setContent(newValue)
    onContentChange?.(newValue)

    const operation = buildOperation(oldValue, newValue)
    if (operation) emitOperation?.(operation, revisionRef.current)

    setSaveStatus("unsaved")
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving...")
      onContentChange?.(newValue, true)
    }, SAVE_DEBOUNCE)
  }, [content, emitOperation])

  const buildOperation = (oldStr, newStr) => {
    if (!oldStr && !newStr) return null
    let start = 0
    while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
      start++
    }
    if (oldStr.length < newStr.length) {
      return { type: "insert", position: start, chars: newStr.slice(start, start + (newStr.length - oldStr.length)), userId: user?.id, revision: revisionRef.current }
    }
    if (oldStr.length > newStr.length) {
      return { type: "delete", position: start, count: oldStr.length - newStr.length, userId: user?.id, revision: revisionRef.current }
    }
    return null
  }

  const handleCursorChange = useCallback((e) => {
    emitCursor?.({ lineNumber: e.position.lineNumber, column: e.position.column })
  }, [emitCursor])

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    editor.onDidChangeCursorPosition(handleCursorChange)
    setSaveStatus("saved")

    // Track whether user has text selected
    editor.onDidChangeCursorSelection((e) => {
      const sel = e.selection
      const isEmpty =
        sel.startLineNumber === sel.endLineNumber &&
        sel.startColumn === sel.endColumn
      setHasSelection(!isEmpty)
    })
  }

  return (
    <div style={s.wrap}>
      {/* Status bar */}
      <div style={s.statusBar}>
        <span style={{ ...s.connDot, background: connected ? "#2ecc71" : "#e74c3c" }} />
        <span style={s.connText}>{connected ? "Live" : "Reconnecting..."}</span>
        {readOnly && <span style={s.readOnlyBadge}>read only</span>}
        <span style={s.lang}>{language}</span>
        <span style={s.saveStatus}>{saveStatus === "saved" ? "✓ saved" : saveStatus}</span>
      </div>

      {/* AI toolbar */}
      <EditorToolbar
        language={language}
        onAISuggest={handleAISuggest}
        hasSelection={hasSelection}
        isLoading={aiLoading}
        readOnly={readOnly}
      />

      {/* Editor + AI panel */}
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
            readOnly,
          }}
        />
        <CursorLayer
          editorRef={editorRef}
          cursors={remoteCursors.filter((c) => c.userId !== user?.id)}
        />

        {/* AI suggestion panel slides up from bottom of editor */}
        {aiSuggestion && (
          <AISuggestionPanel
            suggestion={aiSuggestion}
            type={aiType}
            onClose={() => setAiSuggestion(null)}
            onApply={handleApplySuggestion}
          />
        )}
      </div>
    </div>
  )
}

const s = {
  wrap: { display: "flex", flexDirection: "column", height: "100%", background: "#1e1e1e" },
  statusBar: { height: 28, background: "#111118", borderBottom: "1px solid #2a2a3a", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", flexShrink: 0 },
  connDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  connText: { fontSize: 11, color: "#8888a0" },
  readOnlyBadge: { fontSize: 10, background: "rgba(136,136,160,0.1)", color: "#8888a0", border: "1px solid rgba(136,136,160,0.2)", borderRadius: 4, padding: "1px 6px" },
  lang: { fontSize: 11, color: "#55556a", marginLeft: "auto" },
  saveStatus: { fontSize: 11, color: "#55556a", marginLeft: 12 },
  editorWrap: { flex: 1, position: "relative", overflow: "hidden" },
}