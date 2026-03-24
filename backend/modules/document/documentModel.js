import mongoose from "mongoose"

const versionSchema = new mongoose.Schema({
  content: { type: String, default: "" },
  savedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  savedByName: { type: String },
  timestamp: { type: Date, default: Date.now },
})

const collaboratorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["editor", "viewer"], default: "editor" },
  addedAt: { type: Date, default: Date.now },
})

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Untitled", trim: true },
    content: { type: String, default: "" },
    language: {
      type: String,
      default: "javascript",
      enum: [
        "javascript", "typescript", "python", "java",
        "cpp", "c", "go", "rust", "html", "css",
        "json", "markdown", "sql", "bash",
      ],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collaborators: [collaboratorSchema],
    versions: [versionSchema],
    shareToken: {
      type: String,
      default: () => Math.random().toString(36).slice(2, 10),
      unique: true,
    },
    isPublic: { type: Boolean, default: false },
  },
  { timestamps: true }
)

documentSchema.index({ ownerId: 1 })
documentSchema.index({ "collaborators.userId": 1 })

export default mongoose.model("Document", documentSchema)