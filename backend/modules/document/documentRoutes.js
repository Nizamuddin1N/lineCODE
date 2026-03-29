import { Router } from "express"
import {
  createDocument,
  getMyDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getVersions,
  restoreVersion,
  addCollaborator,
  removeCollaborator,
  joinByShareToken,
} from "./documentController.js"
import { protect, checkRole } from "../auth/authMiddleware.js"

const router = Router()

router.use(protect)

router.get("/", getMyDocuments)
router.post("/", createDocument)
router.post("/join/:token", joinByShareToken)

router.get("/:id", getDocument)
router.put("/:id", checkRole("editor", "owner"), updateDocument)
router.delete("/:id", checkRole("owner"), deleteDocument)

// Fix: remove getDocument middleware from here
router.get("/:id/versions", getVersions)
router.post("/:id/versions/restore", checkRole("editor", "owner"), restoreVersion)

router.post("/:id/collaborators", checkRole("owner"), addCollaborator)
router.delete("/:id/collaborators/:userId", checkRole("owner"), removeCollaborator)

export default router