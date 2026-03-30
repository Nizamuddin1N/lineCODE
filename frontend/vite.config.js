import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    /*
      Why code splitting?
      Monaco editor alone is ~2MB. Without splitting,
      the browser downloads everything before showing anything.
      With splitting, it downloads only what the current
      page needs — login page never downloads Monaco.
    */
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-monaco": ["@monaco-editor/react"],
          "vendor-socket": ["socket.io-client"],
          "vendor-zustand": ["zustand"],
        },
      },
    },
    // Warn if any chunk exceeds 1MB
    chunkSizeWarningLimit: 1000,
    // Generate source maps for debugging production
    sourcemap: false,
  },
})