import jwt from "jsonwebtoken"
import User from "../user/userModel.js"

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" })

export const register = async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" })

  try {
    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ error: "Email already in use" })

    const user = await User.create({ name, email, password })
    res.status(201).json({ token: signToken(user._id), user: user.toPublic() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" })

  try {
    const user = await User.findOne({ email })
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: "Invalid email or password" })

    res.json({ token: signToken(user._id), user: user.toPublic() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const getMe = async (req, res) => {
  res.json(req.user.toPublic())
}

export const updateProfile = async (req, res) => {
  const { name, avatar } = req.body
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...(name && { name }), ...(avatar && { avatar }) },
      { new: true }
    )
    res.json(user.toPublic())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}