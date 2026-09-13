import Notification from "../Models/Notification.js";
import Budget from "../Models/Budget.js";
import Transaction from "../models/Transaction.js";

const createNotificationIfNotExists = async ({
  userId,
  title,
  message,
  type,
  priority,
  metadata = {},
  uniqueKey,
}) => {
  try {
    // Prevent duplicate notifications for the same event
    const existingNotification = await Notification.findOne({
      userId,
      type,
      "metadata.uniqueKey": uniqueKey,
    });

    if (existingNotification) {
      return null;
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      priority,
      metadata: {
        ...metadata,
        uniqueKey,
      },
    });

    return notification;
  } catch (error) {
    console.error("Create notification error:", error);
    return null;
  }
};

export const generateFinancialNotifications = async (userId) => {
  try {
    const now = new Date();

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // =========================================================
    // FETCH CURRENT MONTH DATA
    // =========================================================

    const [budgets, transactions] = await Promise.all([
      Budget.find({
        userId,
        month: currentMonth,
        year: currentYear,
      }),

      Transaction.find({
        userId,
        date: {
          $gte: new Date(currentYear, currentMonth - 1, 1),
          $lt: new Date(currentYear, currentMonth, 1),
        },
      }),
    ]);

    // =========================================================
    // BUDGET ALERTS
    // =========================================================

    for (const budget of budgets) {
      const categoryExpenses = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.category.toLowerCase() ===
              budget.category.toLowerCase()
        )
        .reduce(
          (total, transaction) =>
            total + Number(transaction.amount),
          0
        );

      const percentage =
        budget.amount > 0
          ? (categoryExpenses / budget.amount) * 100
          : 0;

      // -------------------------
      // Budget exceeded
      // -------------------------

      if (percentage >= 100) {
        const overAmount =
          categoryExpenses - budget.amount;

        await createNotificationIfNotExists({
          userId,
          title: `${budget.category} budget exceeded`,
          message: `You've exceeded your ${budget.category} budget by ₹${overAmount.toLocaleString(
            "en-IN"
          )}.`,
          type: "budget_exceeded",
          priority: "high",
          metadata: {
            category: budget.category,
            budgetAmount: budget.amount,
            spentAmount: categoryExpenses,
            percentage,
            month: currentMonth,
            year: currentYear,
          },
          uniqueKey: `budget-exceeded-${budget._id}-${currentYear}-${currentMonth}`,
        });

        continue;
      }

      // -------------------------
      // Budget warning
      // -------------------------

      if (percentage >= 80) {
        const remaining =
          budget.amount - categoryExpenses;

        await createNotificationIfNotExists({
          userId,
          title: `${budget.category} budget nearly reached`,
          message: `You've used ${percentage.toFixed(
            0
          )}% of your ${budget.category} budget. ₹${remaining.toLocaleString(
            "en-IN"
          )} remaining.`,
          type: "budget_warning",
          priority: "medium",
          metadata: {
            category: budget.category,
            budgetAmount: budget.amount,
            spentAmount: categoryExpenses,
            percentage,
            remaining,
            month: currentMonth,
            year: currentYear,
          },
          uniqueKey: `budget-warning-${budget._id}-${currentYear}-${currentMonth}`,
        });
      }
    }

    // =========================================================
    // SPENDING ANALYSIS
    // =========================================================

    const currentMonthExpense = transactions
      .filter(
        (transaction) => transaction.type === "expense"
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );

    // =========================================================
    // UNUSUALLY LARGE EXPENSE
    // =========================================================

    const expenseAmounts = transactions
      .filter(
        (transaction) => transaction.type === "expense"
      )
      .map((transaction) => Number(transaction.amount));

    if (expenseAmounts.length >= 3) {
      const averageExpense =
        expenseAmounts.reduce(
          (total, amount) => total + amount,
          0
        ) / expenseAmounts.length;

      const largeExpenseThreshold =
        averageExpense * 2.5;

      const largeExpenses = transactions.filter(
        (transaction) =>
          transaction.type === "expense" &&
          Number(transaction.amount) >=
            largeExpenseThreshold
      );

      for (const transaction of largeExpenses) {
        await createNotificationIfNotExists({
          userId,
          title: "Unusually high expense detected",
          message: `Your ₹${Number(
            transaction.amount
          ).toLocaleString(
            "en-IN"
          )} ${transaction.category.toLowerCase()} expense is significantly higher than your usual spending.`,
          type: "overspending",
          priority: "medium",
          metadata: {
            transactionId: transaction._id,
            amount: transaction.amount,
            category: transaction.category,
          },
          uniqueKey: `large-expense-${transaction._id}`,
        });
      }
    }

    // =========================================================
    // PREVIOUS MONTH COMPARISON
    // =========================================================

    const previousMonthDate = new Date(
      currentYear,
      currentMonth - 2,
      1
    );

    const previousMonth =
      previousMonthDate.getMonth() + 1;

    const previousYear =
      previousMonthDate.getFullYear();

    const previousMonthTransactions =
      await Transaction.find({
        userId,
        type: "expense",
        date: {
          $gte: new Date(
            previousYear,
            previousMonth - 1,
            1
          ),
          $lt: new Date(
            previousYear,
            previousMonth,
            1
          ),
        },
      });

    const previousMonthExpense =
      previousMonthTransactions.reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );

    // =========================================================
    // SPENDING INCREASE ALERT
    // =========================================================

    if (
      previousMonthExpense > 0 &&
      currentMonthExpense >
        previousMonthExpense * 1.25
    ) {
      const increasePercentage =
        ((currentMonthExpense -
          previousMonthExpense) /
          previousMonthExpense) *
        100;

      await createNotificationIfNotExists({
        userId,
        title: "Your spending has increased",
        message: `Your spending is ${increasePercentage.toFixed(
          0
        )}% higher than last month.`,
        type: "spending_increase",
        priority: "medium",
        metadata: {
          currentMonthExpense,
          previousMonthExpense,
          increasePercentage,
          month: currentMonth,
          year: currentYear,
        },
        uniqueKey: `spending-increase-${currentYear}-${currentMonth}`,
      });
    }

    // =========================================================
    // LOW SAVINGS ALERT
    // =========================================================

    const currentMonthIncome = transactions
      .filter(
        (transaction) => transaction.type === "income"
      )
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount),
        0
      );

    if (currentMonthIncome > 0) {
      const savings =
        currentMonthIncome - currentMonthExpense;

      const savingsRate =
        (savings / currentMonthIncome) * 100;

      if (savingsRate < 10) {
        await createNotificationIfNotExists({
          userId,
          title: "Your savings rate is low",
          message: `You've saved only ${Math.max(
            savingsRate,
            0
          ).toFixed(
            0
          )}% of your income this month. Consider reviewing your spending.`,
          type: "low_savings",
          priority: "medium",
          metadata: {
            income: currentMonthIncome,
            expense: currentMonthExpense,
            savings,
            savingsRate,
            month: currentMonth,
            year: currentYear,
          },
          uniqueKey: `low-savings-${currentYear}-${currentMonth}`,
        });
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Generate financial notifications error:",
      error
    );

    return {
      success: false,
      message: "Unable to generate financial notifications",
    };
  }
};