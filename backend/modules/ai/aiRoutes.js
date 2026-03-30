import { Router } from "express"
import { getSuggestion } from "./aiController.js"
import { protect } from "../auth/authMiddleware.js"

const router = Router()

router.use(protect)
router.post("/suggest", getSuggestion)

export default router