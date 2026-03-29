import { Router } from "express"
import { getMessages } from "./chatController.js"
import { protect } from "../auth/authMiddleware.js"

const router = Router()

router.use(protect)
router.get("/:docId/messages", getMessages)

export default router