import Transaction from "../models/Transaction.js";
import {
  generateFinancialInsights,
} from "../services/aiService.js";

export const getFinancialInsights = async (
  req,
  res
) => {
  try {
    const transactions =
      await Transaction.find({
        userId: req.userId,
      })
        .sort({ date: -1 })
        .limit(100);

    if (transactions.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "Add some transactions to generate AI insights.",
        insights: null,
      });
    }

    const insights =
      await generateFinancialInsights(
        transactions
      );

    res.status(200).json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error(
      "AI insights error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to generate AI insights",
    });
  }
};