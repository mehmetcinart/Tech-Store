import { Router } from "express";
import { registerUser, listUsers, updateUserRole } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = Router();

router.post("/register", registerUser);
router.get("/", protect, adminOnly, listUsers);
router.put("/:uid/role", protect, adminOnly, updateUserRole);

export default router;
