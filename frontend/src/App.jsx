import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import useAuthStore from "./store/authStore"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import DashboardPage from "./pages/DashboardPage"
import EditorPage from "./pages/EditorPage"
import JoinPage from "./pages/JoinPage"        // ← add this import

const Private = ({ children }) => {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

const Guest = ({ children }) => {
  const token = useAuthStore((s) => s.token)
  return token ? <Navigate to="/" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Guest><LoginPage /></Guest>} />
        <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
        <Route path="/" element={<Private><DashboardPage /></Private>} />
        <Route path="/editor/:id" element={<Private><EditorPage /></Private>} />
        <Route path="/join/:token" element={<Private><JoinPage /></Private>} />  {/* ← fixed */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}