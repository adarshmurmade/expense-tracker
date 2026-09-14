import express from "express";

import {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} from "../Controllers/transactionController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/add",
  authMiddleware,
  addTransaction
);

router.get(
  "/",
  authMiddleware,
  getTransactions
);

router.put(
  "/:id",
  authMiddleware,
  updateTransaction
);

router.delete(
  "/:id",
  authMiddleware,
  deleteTransaction
);

export default router;