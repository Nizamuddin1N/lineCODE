import jwt from "jsonwebtoken"
import User from "../user/userModel.js"
import Document from "../document/documentModel.js"

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

/*
  checkRole middleware factory.
  Usage: router.put("/:id", protect, checkRole("editor", "owner"), handler)

  Three levels:
  - owner  → full control (edit, delete, manage collaborators)
  - editor → can edit content and title
  - viewer → read only, cannot modify anything
*/
export const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const doc = await Document.findById(req.params.id)
      if (!doc) return res.status(404).json({ error: "Document not found" })

      const userId = req.user.id.toString()
      const ownerId = doc.ownerId.toString()

      // Owner always has full access
      if (ownerId === userId) {
        req.userRole = "owner"
        req.doc = doc
        return next()
      }

      // Check collaborator role
      const collab = doc.collaborators.find(
        (c) => c.userId.toString() === userId
      )

      if (!collab) {
        return res.status(403).json({ error: "Access denied" })
      }

      if (!allowedRoles.includes(collab.role)) {
        return res.status(403).json({
          error: `This action requires ${allowedRoles.join(" or ")} role. You are a ${collab.role}.`,
        })
      }

      req.userRole = collab.role
      req.doc = doc
      next()
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  }
}