import mongoose from "mongoose"

/*
  Why a separate collection for messages instead of
  embedding in the document?

  Two reasons:
  1. Documents already store versions — embedding messages
     too would make the document grow unboundedly large.
     MongoDB has a 16MB document size limit.
  2. Messages are queried independently (give me last 50
     messages for docId X) — a separate collection with
     an index on docId makes this fast.
*/

const messageSchema = new mongoose.Schema(
  {
    docId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: { type: String, required: true },
    senderColor: { type: String, default: "#7c6fcd" },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
)

export default mongoose.model("Message", messageSchema)