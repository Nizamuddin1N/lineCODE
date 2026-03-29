import Message from "./chatModel.js"

/*
  Two decisions here:
  A - Return all messages (dangerous — could be thousands)
  B - Return last N messages with pagination

  We use B with a default limit of 50.
  Enough for context, not enough to kill performance.
*/

export const getMessages = async (req, res) => {
  const { docId } = req.params
  const limit = parseInt(req.query.limit) || 50

  try {
    const messages = await Message.find({ docId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    // Reverse so oldest is first (chat reads top to bottom)
    res.json(messages.reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}