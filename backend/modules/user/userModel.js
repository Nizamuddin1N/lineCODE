import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    avatar: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: () => {
        const colors = [
          "#7c6fcd", "#2ecc71", "#e74c3c",
          "#3498db", "#f39c12", "#1abc9c",
          "#9b59b6", "#e67e22",
        ]
        return colors[Math.floor(Math.random() * colors.length)]
      },
    },
  },
  { timestamps: true }
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password)
}

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    color: this.color,
  }
}

export default mongoose.model("User", userSchema)