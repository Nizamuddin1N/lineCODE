import { useNavigate } from "react-router-dom"
import useAuthStore from "../store/authStore"
import api from "../services/api"

export const useAuth = () => {
  const { user, token, setAuth, logout } = useAuthStore()
  const navigate = useNavigate()

    const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password })
    setAuth(res.data.user, res.data.token)
    navigate("/dashboard")   // ← was "/"
    }

    const register = async (name, email, password) => {
    const res = await api.post("/auth/register", { name, email, password })
    setAuth(res.data.user, res.data.token)
    navigate("/dashboard")   // ← was "/"
    }

  const signOut = () => {
    logout()
    navigate("/login")
  }

  return { user, token, login, register, signOut, isAuthenticated: !!token }
}