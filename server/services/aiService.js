import OpenAI from "openai";

const generateLocalInsights = (transactions) => {
  let income = 0;
  let expense = 0;

  const categoryTotals = {};
  const monthlyExpenses = {};

  transactions.forEach((transaction) => {
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === "income") {
      income += amount;
    } else {
      expense += amount;

      const category = transaction.category || "Other";

      categoryTotals[category] =
        (categoryTotals[category] || 0) + amount;

      const date = new Date(transaction.date);

      if (!Number.isNaN(date.getTime())) {
        const month = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        monthlyExpenses[month] =
          (monthlyExpenses[month] || 0) + amount;
      }
    }
  });

  const balance = income - expense;

  const savingsRate =
    income > 0 ? (balance / income) * 100 : 0;

  const categoryData = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const topCategory =
    categoryData.length > 0
      ? categoryData[0][0]
      : null;

  const topCategoryAmount =
    categoryData.length > 0
      ? categoryData[0][1]
      : 0;

  const topCategoryPercentage =
    expense > 0
      ? (topCategoryAmount / expense) * 100
      : 0;

  const insights = [];

  // -----------------------------------
  // OVERALL FINANCIAL HEALTH
  // -----------------------------------

  if (income === 0 && expense > 0) {
    insights.push(
      `⚠️ You have recorded ₹${expense.toLocaleString(
        "en-IN"
      )} in expenses but no income yet. Consider adding your income transactions to get a clearer picture of your finances.`
    );
  } else if (income > 0) {
    if (balance > 0) {
      insights.push(
        `💰 You are currently saving ₹${balance.toLocaleString(
          "en-IN"
        )}. Your savings rate is ${savingsRate.toFixed(
          1
        )}%, which means you are spending less than you earn.`
      );
    } else if (balance === 0) {
      insights.push(
        `⚖️ Your income and expenses are currently equal. There is no money left over for savings, so reducing some expenses could improve your financial position.`
      );
    } else {
      insights.push(
        `⚠️ Your expenses are ₹${Math.abs(
          balance
        ).toLocaleString(
          "en-IN"
        )} higher than your recorded income. Review your largest spending categories and consider reducing non-essential expenses.`
      );
    }
  }

  // -----------------------------------
  // TOP SPENDING CATEGORY
  // -----------------------------------

  if (topCategory) {
    insights.push(
      `📊 Your highest spending category is "${topCategory}" with ₹${topCategoryAmount.toLocaleString(
        "en-IN"
      )} spent. This represents approximately ${topCategoryPercentage.toFixed(
        1
      )}% of your total expenses.`
    );
  }

  // -----------------------------------
  // SECOND HIGHEST CATEGORY
  // -----------------------------------

  if (categoryData.length >= 2) {
    const secondCategory = categoryData[1][0];
    const secondAmount = categoryData[1][1];

    insights.push(
      `🔎 Your second-highest spending category is "${secondCategory}" at ₹${secondAmount.toLocaleString(
        "en-IN"
      )}. These two categories are good places to review when looking for potential savings.`
    );
  }

  // -----------------------------------
  // SAVINGS RECOMMENDATION
  // -----------------------------------

  if (income > 0 && savingsRate < 10) {
    insights.push(
      `💡 Recommendation: Your current savings rate is below 10%. Try identifying one or two non-essential expenses that you can reduce each month.`
    );
  } else if (income > 0 && savingsRate < 20) {
    insights.push(
      `💡 Recommendation: You are saving money, but there is room to improve. A practical goal could be gradually increasing your savings rate toward 20%.`
    );
  } else if (income > 0) {
    insights.push(
      `🎯 Recommendation: Your savings rate is ${savingsRate.toFixed(
        1
      )}%. Keep maintaining this habit and continue monitoring your largest expense categories.`
    );
  }

  // -----------------------------------
  // EXPENSE CATEGORY ADVICE
  // -----------------------------------

  if (topCategoryPercentage >= 40) {
    insights.push(
      `🚨 More than 40% of your recorded expenses are concentrated in "${topCategory}". Reviewing this category could have the biggest impact on your monthly budget.`
    );
  }

  // -----------------------------------
  // TRANSACTION ACTIVITY
  // -----------------------------------

  if (transactions.length >= 10) {
    insights.push(
      `📈 You have recorded ${transactions.length} transactions. This gives you a useful amount of data to identify spending patterns and improve your budgeting habits.`
    );
  } else {
    insights.push(
      `📝 You currently have ${transactions.length} recorded transaction${
        transactions.length === 1 ? "" : "s"
      }. Keep adding transactions regularly so ExpenseFlow can provide more meaningful financial analysis.`
    );
  }

  return `
Financial Overview

${insights.join("\n\n")}

Summary
• Total Income: ₹${income.toLocaleString("en-IN")}
• Total Expenses: ₹${expense.toLocaleString("en-IN")}
• Net Savings: ₹${balance.toLocaleString("en-IN")}
• Savings Rate: ${savingsRate.toFixed(1)}%
• Top Category: ${topCategory || "No expense data"}

Note: These insights are generated from your ExpenseFlow transaction data and are intended for general budgeting guidance.
`;
};

// -----------------------------------
// MAIN INSIGHTS FUNCTION
// -----------------------------------

export const generateFinancialInsights = async (
  transactions
) => {
  // Set USE_OPENAI=true in .env when you want
  // to use the OpenAI API again.
  const useOpenAI =
    process.env.USE_OPENAI === "true";

  if (!useOpenAI) {
    return generateLocalInsights(transactions);
  }

  if (!process.env.OPENAI_API_KEY) {
    return generateLocalInsights(transactions);
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const simplifiedTransactions =
      transactions.map((transaction) => ({
        title: transaction.title,
        amount: Number(transaction.amount),
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
      }));

    const prompt = `
You are a helpful personal finance assistant.

Analyze the following user's financial transactions.

Provide practical and easy-to-understand financial insights.

Focus on:
1. Spending patterns
2. Savings behavior
3. Highest spending categories
4. Potential areas where the user can reduce spending
5. Positive financial habits
6. One or two practical recommendations

Important:
- Do not invent transactions or numbers.
- Use only the data provided.
- Do not provide investment, tax, or legal advice.
- Keep the response concise and useful.
- Use Indian Rupee (₹) when discussing amounts.

Transactions:

${JSON.stringify(
  simplifiedTransactions,
  null,
  2
)}
`;

    const response =
      await openai.responses.create({
        model: "gpt-5.6-luna",
        input: prompt,
      });

    return response.output_text;
  } catch (error) {
    console.error(
      "OpenAI unavailable. Using local insights:",
      error.message
    );

    // If OpenAI fails for any reason, the app
    // still provides financial insights.
    return generateLocalInsights(transactions);
  }
};