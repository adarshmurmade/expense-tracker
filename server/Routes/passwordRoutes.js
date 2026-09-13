import express from "express";

import { changePassword } from "../Controllers/passwordController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/change", authMiddleware, changePassword);

export default router;