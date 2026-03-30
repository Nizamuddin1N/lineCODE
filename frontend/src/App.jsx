import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import useAuthStore from "./store/authStore"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import EditorPage from "./pages/EditorPage"
import JoinPage from "./pages/JoinPage"

const Private = ({ children }) => {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

const Guest = ({ children }) => {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Landing page — anyone can see this */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth pages — only for logged out users */}
        <Route path="/login" element={<Guest><LoginPage /></Guest>} />
        <Route path="/register" element={<Guest><RegisterPage /></Guest>} />

        {/* App pages — only for logged in users */}
        <Route path="/dashboard" element={<Private><DashboardPage /></Private>} />
        <Route path="/editor/:id" element={<Private><EditorPage /></Private>} />
        <Route path="/join/:token" element={<Private><JoinPage /></Private>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}