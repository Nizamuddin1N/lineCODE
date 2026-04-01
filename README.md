# </> lineCODE

**A real-time collaborative code editor. Think Google Docs, but for code.**

[![Live Demo](https://img.shields.io/badge/Live-linecode--five.vercel.app-7c6fcd?style=flat-square&logo=vercel)](https://linecode-five.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Nizamuddin1N-181717?style=flat-square&logo=github)](https://github.com/Nizamuddin1N/lineCODE)
[![Node](https://img.shields.io/badge/node-20.x-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Socket.IO](https://img.shields.io/badge/socket.io-4.7-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

---

Multiple people. Same file. No conflicts.

lineCODE lets your team edit code together in real time — with live cursors showing exactly where everyone is typing, a built-in chat so you don't need a separate Slack thread, and an AI assistant that can improve, explain, fix, or complete your code on demand. Version history saves automatically so you can always roll back.

No installs. Open a browser, share a link, start coding.

---

## What it actually does

- **Real-time sync** — edits appear on everyone's screen as you type, resolved conflict-free using Operational Transformation (the same algorithm Google Docs uses)
- **Live cursors** — colored, labeled cursors show where each collaborator is in the file
- **Role permissions** — owner, editor, viewer. Viewers get a read-only Monaco, editors can change code, only the owner can delete or manage collaborators
- **Built-in chat** — per-document message history, unread badge, grouped messages, persists across sessions
- **Version history** — up to 50 versions saved automatically. Preview any version inline, restore in one click (restoring saves your current state first so you can undo it)
- **AI code assistant** — select code and ask AI to improve it, explain it, find bugs, or complete it. Powered by OpenRouter with automatic model fallback
- **Share links** — share a URL, collaborator joins and gets added automatically
- **10+ languages** — JavaScript, TypeScript, Python, Java, C++, Go, Rust, HTML, CSS, SQL and more via Monaco Editor

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Monaco Editor, Zustand, Socket.IO Client |
| Backend | Node.js, Express, Socket.IO, Mongoose |
| Database | MongoDB Atlas |
| Cache + Sync | Redis via Upstash (pub/sub adapter for multi-instance Socket.IO) |
| Auth | JWT, bcryptjs |
| AI | OpenRouter (free LLM gateway with fallback) |
| Deploy | Vercel (frontend), Render (backend) |

---

## How the real-time sync works

This was the hardest part to build. The problem: two people type at the same time, both changes need to land correctly without one overwriting the other.

The solution is **Operational Transformation**. Every edit is an operation — `insert at position 5` or `delete 3 chars at position 12`. When two operations arrive at the server simultaneously, the second one gets *transformed* to account for the first before being applied. Position 5 might become position 8 after accounting for what the other person just inserted.

The server keeps a revision history per document. Every client tracks its current revision. When an operation arrives, the server knows exactly which operations the client hasn't seen yet and transforms accordingly.

This is the same fundamental approach as Google Docs, built from scratch.

---

## Getting started locally
```bash
# Clone
git clone https://github.com/Nizamuddin1N/lineCODE.git
cd lineCODE

# Backend
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Environment variables

**backend/.env**
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
UPSTASH_REDIS_URL=rediss://your_upstash_url
OPENROUTER_API_KEY=your_openrouter_key
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Project structure
```
lineCODE/
├── backend/
│   ├── modules/
│   │   ├── auth/          JWT register, login, role middleware
│   │   ├── document/      CRUD, versions, collaborators, share tokens
│   │   ├── chat/          Message model + history endpoint
│   │   └── ai/            OpenRouter AI suggestions
│   ├── socket/
│   │   ├── socketHandler.js   All real-time events
│   │   └── otEngine.js        OT algorithm
│   └── utils/
│       ├── redis.js        Upstash connection + caching
│       └── keepAlive.js    Prevents Render cold starts
└── frontend/
    └── src/
        ├── components/     Editor, Chat, Sidebar, AI panel
        ├── pages/          Landing, Login, Register, Dashboard, Editor
        ├── hooks/          useSocket, useAuth
        └── store/          Zustand auth store
```

---

## Deployment

Frontend is on Vercel — auto-deploys on push to main. Backend is on Render with a keep-alive ping every 10 minutes so it never hits the free-tier sleep threshold. Redis is Upstash serverless, MongoDB is Atlas free cluster.

If you're deploying your own fork, the only things you need to change are the environment variables. Everything else is handled by the CI/CD pipeline.

---

## Known limitations

- Free tier on Render means the backend can occasionally be slow on the very first request after a long idle period (working on it)
- AI suggestions depend on OpenRouter free model availability — response time varies
- No mobile layout yet, designed for desktop

---

## License

MIT — do whatever you want with it.

---

*Built by [Nizamuddin](https://github.com/Nizamuddin1N)*
