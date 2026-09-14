import Transaction from "../Models/Transaction.js";

// =========================
// ADD TRANSACTION
// =========================

export const addTransaction = async (req, res) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      date,
    } = req.body;

    const transaction = await Transaction.create({
      title,
      amount,
      type,
      category,
      date,
      userId: req.userId,
    });

    res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// GET TRANSACTIONS
// =========================

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.userId,
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// UPDATE TRANSACTION
// =========================

export const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction =
      await Transaction.findOneAndUpdate(
        {
          _id: id,
          userId: req.userId,
        },
        {
          title: req.body.title,
          amount: req.body.amount,
          type: req.body.type,
          category: req.body.category,
          date: req.body.date,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// DELETE TRANSACTION
// =========================

export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction =
      await Transaction.findOneAndDelete({
        _id: id,
        userId: req.userId,
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};