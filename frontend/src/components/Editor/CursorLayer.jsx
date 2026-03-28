/*
  Three ways to show other users' cursors in Monaco:
  A - Absolute positioned divs over the editor (hard to align precisely)
  B - Monaco decorations API (built-in, pixel-perfect positioning)
  C - Custom widgets (most flexible but complex)

  We use B — Monaco decorations are designed exactly for this.
  They attach to line/column positions and move with the content.
*/

import { useEffect, useRef } from "react"

export default function CursorLayer({ editorRef, cursors }) {
  const decorationsRef = useRef([])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    // Build decoration array from all remote cursors
    const newDecorations = cursors.map((c) => ({
      range: {
        startLineNumber: c.cursor.lineNumber || 1,
        startColumn: c.cursor.column || 1,
        endLineNumber: c.cursor.lineNumber || 1,
        endColumn: (c.cursor.column || 1) + 1,
      },
      options: {
        className: `remote-cursor-${c.socketId}`,
        beforeContentClassName: `remote-cursor-before-${c.socketId}`,
        stickiness: 1,
        hoverMessage: { value: c.name },
      },
    }))

    // Inject CSS for each cursor color dynamically
    cursors.forEach((c) => {
      const styleId = `cursor-style-${c.socketId}`
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style")
        style.id = styleId
        style.textContent = `
          .remote-cursor-${c.socketId} {
            border-left: 2px solid ${c.color};
          }
          .remote-cursor-before-${c.socketId}::before {
            content: "${c.name}";
            background: ${c.color};
            color: #fff;
            font-size: 10px;
            padding: 1px 4px;
            border-radius: 3px 3px 3px 0;
            position: absolute;
            top: -18px;
            white-space: nowrap;
            pointer-events: none;
          }
        `
        document.head.appendChild(style)
      }
    })

    // Apply decorations and store IDs to update next time
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    )
  }, [cursors, editorRef])

  return null
}