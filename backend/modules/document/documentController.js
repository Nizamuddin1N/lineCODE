import Document from "./documentModel.js"

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
      .select("title language ownerId updatedAt shareToken")
      .populate("ownerId", "name color")
      .sort({ updatedAt: -1 })
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate("ownerId", "name email color")
      .populate("collaborators.userId", "name email color")
    if (!doc) return res.status(404).json({ error: "Document not found" })

    const isOwner = doc.ownerId._id.toString() === req.user.id
    const isCollab = doc.collaborators.some(
      (c) => c.userId._id.toString() === req.user.id
    )
    if (!isOwner && !isCollab)
      return res.status(403).json({ error: "Access denied" })

    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const updateDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Document not found" })

    if (req.body.content !== undefined) {
      if (doc.content !== req.body.content) {
        doc.versions.push({
          content: doc.content,
          savedBy: req.user.id,
          savedByName: req.user.name,
        })
        if (doc.versions.length > 50) doc.versions.shift()
      }
      doc.content = req.body.content
    }

    if (req.body.title) doc.title = req.body.title
    if (req.body.language) doc.language = req.body.language

    await doc.save()
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Not found" })
    if (doc.ownerId.toString() !== req.user.id)
      return res.status(403).json({ error: "Only owner can delete" })
    await doc.deleteOne()
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

export const addCollaborator = async (req, res) => {
  const { userId, role } = req.body
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: "Not found" })
    if (doc.ownerId.toString() !== req.user.id)
      return res.status(403).json({ error: "Only owner can add collaborators" })

    const already = doc.collaborators.find(
      (c) => c.userId.toString() === userId
    )
    if (already) return res.status(400).json({ error: "Already a collaborator" })

    doc.collaborators.push({ userId, role: role || "editor" })
    await doc.save()
    await doc.populate("collaborators.userId", "name email color")
    res.json(doc.collaborators)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const joinByShareToken = async (req, res) => {
  try {
    const doc = await Document.findOne({ shareToken: req.params.token })
    if (!doc) return res.status(404).json({ error: "Invalid share link" })

    const isOwner = doc.ownerId.toString() === req.user.id
    const isCollab = doc.collaborators.some(
      (c) => c.userId.toString() === req.user.id
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