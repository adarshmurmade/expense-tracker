import express from "express";

import {
  upsertBudget,
  getBudgets,
  deleteBudget,
} from "../Controllers/budgetController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create or update budget
router.post("/", authMiddleware, upsertBudget);

// Get budgets
router.get("/", authMiddleware, getBudgets);

// Delete budget
router.delete("/:id", authMiddleware, deleteBudget);

export default router;