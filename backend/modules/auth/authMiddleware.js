import jwt from "jsonwebtoken"
import User from "../user/userModel.js"

export const protect = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "No token provided" })

  try {
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select("-password")
    if (!req.user) return res.status(401).json({ error: "User not found" })
    next()
  } catch {
    res.status(401).json({ error: "Token invalid or expired" })
  }
}

export const optionalAuth = async (req, res, next) => {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith("Bearer ")) return next()
  try {
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select("-password")
  } catch {}
  next()
}