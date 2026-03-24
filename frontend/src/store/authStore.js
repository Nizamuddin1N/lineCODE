import { create } from "zustand"

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("lc_user") || "null"),
  token: localStorage.getItem("lc_token") || null,

  setAuth: (user, token) => {
    localStorage.setItem("lc_user", JSON.stringify(user))
    localStorage.setItem("lc_token", token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem("lc_user")
    localStorage.removeItem("lc_token")
    set({ user: null, token: null })
  },

  updateUser: (updates) => {
    set((state) => {
      const updated = { ...state.user, ...updates }
      localStorage.setItem("lc_user", JSON.stringify(updated))
      return { user: updated }
    })
  },
}))

export default useAuthStore