import express from "express";

import {
  getFinancialInsights,
} from "../Controllers/aiController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/insights",
  authMiddleware,
  getFinancialInsights
);

export default router;