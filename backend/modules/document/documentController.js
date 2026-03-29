import Document from "./documentModel.js"
import { deleteCache } from "../../utils/redis.js"

export const createDocument = async (req, res) => {
  try {
    const doc = await Document.create({
      title: req.body.title || "Untitled",
      language: req.body.language || "javascript",
      ownerId: req.user.id,
    })
    await doc.populate("ownerId", "name email color")
    res.status(201).json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({
      $or: [
        { ownerId: req.user.id },
        { "collaborators.userId": req.user.id },
      ],
    })
      .select("title language ownerId updatedAt shareToken collaborators")
      .populate("ownerId", "name color")
      .sort({ updatedAt: -1 })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate("ownerId", "name email color")
      .populate("collaborators.userId", "name email color")

    if (!doc) return res.status(404).json({ error: "Document not found" })

    const userId = req.user.id.toString()
    const isOwner = doc.ownerId._id.toString() === userId
    const isCollab = doc.collaborators.some(
      (c) => c.userId._id.toString() === userId
    )

    if (!isOwner && !isCollab)
      return res.status(403).json({ error: "Access denied" })

    // Attach role to request for downstream use
    req.userRole = isOwner
      ? "owner"
      : doc.collaborators.find((c) => c.userId._id.toString() === userId)?.role

    res.json({ ...doc.toObject(), userRole: req.userRole })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateDocument = async (req, res) => {
  try {
    const doc = req.doc || await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Document not found" })

    if (req.body.content !== undefined && doc.content !== req.body.content) {
      doc.versions.push({
        content: doc.content,
        savedBy: req.user.id,
        savedByName: req.user.name,
      })
      if (doc.versions.length > 50) doc.versions.shift()
      doc.content = req.body.content
    }

    if (req.body.title) doc.title = req.body.title
    if (req.body.language) doc.language = req.body.language

    await doc.save()
    await deleteCache(`doc:${req.params.id}`)
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteDocument = async (req, res) => {
  try {
    const doc = req.doc || await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Not found" })
    await doc.deleteOne()
    await deleteCache(`doc:${req.params.id}`)
    res.json({ message: "Document deleted" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getVersions = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).select("versions")
    if (!doc) return res.status(404).json({ error: "Not found" })
    res.json([...doc.versions].reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const restoreVersion = async (req, res) => {
  /*
    Two ways to restore a version:
    A - Overwrite current content with version content directly
    B - Create a new version from current content first, then restore

    B is safer — you never lose the current state when restoring.
    Restoring itself becomes a version, so you can undo a restore.
  */
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Not found" })

    const { versionId } = req.body
    const version = doc.versions.id(versionId)
    if (!version) return res.status(404).json({ error: "Version not found" })

    // Save current as a version before restoring
    doc.versions.push({
      content: doc.content,
      savedBy: req.user.id,
      savedByName: req.user.name,
    })

    doc.content = version.content
    await doc.save()
    await deleteCache(`doc:${req.params.id}`)

    res.json({ message: "Version restored", content: doc.content })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const addCollaborator = async (req, res) => {
  const { userId, role } = req.body
  try {
    const doc = req.doc || await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Not found" })

    const already = doc.collaborators.find(
      (c) => c.userId.toString() === userId
    )
    if (already) return res.status(400).json({ error: "Already a collaborator" })
    if (doc.ownerId.toString() === userId)
      return res.status(400).json({ error: "User is the owner" })

    doc.collaborators.push({ userId, role: role || "editor" })
    await doc.save()
    await doc.populate("collaborators.userId", "name email color")
    res.json(doc.collaborators)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const removeCollaborator = async (req, res) => {
  try {
    const doc = req.doc || await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Not found" })

    doc.collaborators = doc.collaborators.filter(
      (c) => c.userId.toString() !== req.params.userId
    )
    await doc.save()
    res.json({ message: "Collaborator removed" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const joinByShareToken = async (req, res) => {
  try {
    const doc = await Document.findOne({ shareToken: req.params.token })
    if (!doc) return res.status(404).json({ error: "Invalid share link" })

    const userId = req.user.id.toString()
    const isOwner = doc.ownerId.toString() === userId
    const isCollab = doc.collaborators.some(
      (c) => c.userId.toString() === userId
    )

    if (!isOwner && !isCollab) {
      doc.collaborators.push({ userId: req.user.id, role: "editor" })
      await doc.save()
    }

    res.json({ documentId: doc._id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}