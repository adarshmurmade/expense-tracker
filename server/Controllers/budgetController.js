import Budget from "../Models/Budget.js";

// Create or update a budget
export const upsertBudget = async (req, res) => {
  try {
    const { category, amount, month, year } = req.body;

    if (!category || amount === undefined || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Category, amount, month and year are required",
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Budget amount cannot be negative",
      });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.userId,
        category: category.trim(),
        month: Number(month),
        year: Number(year),
      },
      {
        userId: req.userId,
        category: category.trim(),
        amount: Number(amount),
        month: Number(month),
        year: Number(year),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Budget saved successfully",
      budget,
    });
  } catch (error) {
    console.error("Budget save error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to save budget",
    });
  }
};

// Get budgets for the logged-in user
export const getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;

    const filter = {
      userId: req.userId,
    };

    if (month) {
      filter.month = Number(month);
    }

    if (year) {
      filter.year = Number(year);
    }

    const budgets = await Budget.find(filter).sort({
      category: 1,
    });

    res.status(200).json({
      success: true,
      budgets,
    });
  } catch (error) {
    console.error("Get budgets error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch budgets",
    });
  }
};

// Delete a budget
export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Delete budget error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete budget",
    });
  }
};