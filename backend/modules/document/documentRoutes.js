import { Router } from "express"
import {
  createDocument,
  getMyDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getVersions,
  addCollaborator,
  joinByShareToken,
} from "./documentController.js"
import { protect } from "../auth/authMiddleware.js"

const router = Router()

router.use(protect)

router.get("/", getMyDocuments)
router.post("/", createDocument)
router.get("/:id", getDocument)
router.put("/:id", updateDocument)
router.delete("/:id", deleteDocument)
router.get("/:id/versions", getVersions)
router.post("/:id/collaborators", addCollaborator)
router.post("/join/:token", joinByShareToken)

export default router