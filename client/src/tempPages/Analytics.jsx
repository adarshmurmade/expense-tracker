import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  PieChart as PieChartIcon,
  TrendingUp,
  Wallet,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import API from "../api";

function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");

  // AI state
  const [aiInsights, setAiInsights] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const response = await API.get("/transactions");

      if (response.data.success) {
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error("Analytics error:", error);

      toast.error(
        error.response?.data?.message || "Unable to load analytics"
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------
  // AI FINANCIAL INSIGHTS
  // -----------------------------------

  const generateAIInsights = async () => {
    try {
      setAiLoading(true);

      const response = await API.get("/ai/insights");

      if (response.data.success && response.data.insights) {
        setAiInsights(response.data.insights);

        toast.success("AI insights generated!");
      } else {
        setAiInsights(
          response.data.message ||
            "Add some transactions to generate insights."
        );
      }
    } catch (error) {
      console.error("AI insights error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to generate AI insights"
      );
    } finally {
      setAiLoading(false);
    }
  };

  // -----------------------------------
  // AVAILABLE MONTHS
  // -----------------------------------

  const availableMonths = useMemo(() => {
    const months = new Set();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);

      if (!Number.isNaN(date.getTime())) {
        const month = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        months.add(month);
      }
    });

    return [...months].sort().reverse();
  }, [transactions]);

  // -----------------------------------
  // FILTERED TRANSACTIONS
  // -----------------------------------

  const filteredTransactions = useMemo(() => {
    if (selectedMonth === "all") {
      return transactions;
    }

    return transactions.filter((transaction) => {
      const date = new Date(transaction.date);

      if (Number.isNaN(date.getTime())) {
        return false;
      }

      const month = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      return month === selectedMonth;
    });
  }, [transactions, selectedMonth]);

  // -----------------------------------
  // ANALYTICS CALCULATIONS
  // -----------------------------------

  const analytics = useMemo(() => {
    let income = 0;
    let expense = 0;

    const categoryTotals = {};

    filteredTransactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        income += amount;
      } else {
        expense += amount;

        const category = transaction.category || "Other";

        categoryTotals[category] =
          (categoryTotals[category] || 0) + amount;
      }
    });

    const balance = income - expense;

    const savingsRate =
      income > 0 ? (balance / income) * 100 : 0;

    const expenseRatio =
      income > 0 ? (expense / income) * 100 : 0;

    const categoryData = Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    const topCategory =
      categoryData.length > 0
        ? categoryData[0].name
        : "No data";

    return {
      income,
      expense,
      balance,
      savingsRate,
      expenseRatio,
      categoryData,
      topCategory,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // -----------------------------------
  // MONTHLY DATA
  // -----------------------------------

  const monthlyData = useMemo(() => {
    const monthMap = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthMap[key]) {
        monthMap[key] = {
          month: key,
          income: 0,
          expense: 0,
        };
      }

      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        monthMap[key].income += amount;
      } else {
        monthMap[key].expense += amount;
      }
    });

    return Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((item) => ({
        ...item,
        label: new Date(
          `${item.month}-01`
        ).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        }),
      }));
  }, [transactions]);

  // -----------------------------------
  // HELPERS
  // -----------------------------------

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  const formatMonth = (month) => {
    if (month === "all") {
      return "All time";
    }

    const date = new Date(`${month}-01`);

    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  // -----------------------------------
  // LOADING
  // -----------------------------------

  if (loading) {
    return (
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Analytics</h1>
            <p>Understand your financial habits.</p>
          </div>
        </div>

        <div className="analytics-loading">
          Loading your analytics...
        </div>
      </main>
    );
  }

  // -----------------------------------
  // MAIN UI
  // -----------------------------------

  return (
    <main className="main-content">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1>Analytics</h1>

          <p>
            Understand your spending habits and financial performance.
          </p>
        </div>

        <div className="analytics-filter">
          <CalendarDays size={17} />

          <select
            value={selectedMonth}
            onChange={(event) =>
              setSelectedMonth(event.target.value)
            }
          >
            <option value="all">All time</option>

            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-top">
            <span>Total Income</span>

            <div className="stat-icon income-icon">
              <ArrowUpRight size={20} />
            </div>
          </div>

          <h2>{formatCurrency(analytics.income)}</h2>

          <p className="stat-description">
            Income during{" "}
            {formatMonth(selectedMonth).toLowerCase()}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total Expenses</span>

            <div className="stat-icon expense-icon">
              <ArrowDownRight size={20} />
            </div>
          </div>

          <h2>{formatCurrency(analytics.expense)}</h2>

          <p className="stat-description">
            Expenses during{" "}
            {formatMonth(selectedMonth).toLowerCase()}
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Net Savings</span>

            <div className="stat-icon balance-icon">
              <Wallet size={20} />
            </div>
          </div>

          <h2>{formatCurrency(analytics.balance)}</h2>

          <p className="stat-description">
            Money remaining after expenses
          </p>
        </div>

      </section>

      {/* ANALYTICS INSIGHTS */}
      <section
        className="stats-grid"
        style={{ marginTop: "18px" }}
      >

        <div className="stat-card">
          <div className="stat-top">
            <span>Savings Rate</span>

            <div className="stat-icon income-icon">
              <TrendingUp size={20} />
            </div>
          </div>

          <h2>
            {analytics.savingsRate.toFixed(1)}%
          </h2>

          <p className="stat-description">
            Percentage of income saved
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Expense Ratio</span>

            <div className="stat-icon expense-icon">
              <BarChart3 size={20} />
            </div>
          </div>

          <h2>
            {analytics.expenseRatio.toFixed(1)}%
          </h2>

          <p className="stat-description">
            Expenses compared with income
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Top Spending Category</span>

            <div className="stat-icon balance-icon">
              <PieChartIcon size={20} />
            </div>
          </div>

          <h2
            style={{
              fontSize: "22px",
              textTransform: "capitalize",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={analytics.topCategory}
          >
            {analytics.topCategory}
          </h2>

          <p className="stat-description">
            Category with the highest expenses
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Transactions</span>

            <div className="stat-icon balance-icon">
              <Wallet size={20} />
            </div>
          </div>

          <h2>{analytics.transactionCount}</h2>

          <p className="stat-description">
            Financial activities recorded
          </p>
        </div>

      </section>

      {/* AI FINANCIAL INSIGHTS */}
      <section
        className="analytics-card"
        style={{ marginBottom: "20px" }}
      >
        <div
          className="section-header"
          style={{ alignItems: "center" }}
        >
          <div>
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Sparkles size={20} />

              AI Financial Insights
            </h2>

            <p>
              Get personalized insights based on your
              spending activity.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={generateAIInsights}
            disabled={aiLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {aiLoading ? (
              <>
                <RefreshCw
                  size={17}
                  className="ai-spin"
                />

                Analyzing...
              </>
            ) : aiInsights ? (
              <>
                <RefreshCw size={17} />

                Regenerate
              </>
            ) : (
              <>
                <Sparkles size={17} />

                Generate Insights
              </>
            )}
          </button>
        </div>

        <div
          className="ai-insights-content"
          style={{ marginTop: "18px" }}
        >

          {!aiInsights && !aiLoading ? (
            <div
              className="chart-empty"
              style={{ minHeight: "150px" }}
            >
              <Sparkles size={35} />

              <p>
                Your AI financial assistant is ready.
              </p>

              <span>
                Click "Generate Insights" to analyze
                your financial activity.
              </span>
            </div>
          ) : aiLoading ? (
            <div
              className="chart-empty"
              style={{ minHeight: "150px" }}
            >
              <RefreshCw
                size={35}
                className="ai-spin"
              />

              <p>
                Analyzing your finances...
              </p>

              <span>
                AI is looking for spending patterns
                and useful recommendations.
              </span>
            </div>
          ) : (
            <div
              style={{
                whiteSpace: "pre-wrap",
                lineHeight: "1.8",
                fontSize: "15px",
              }}
            >
              {aiInsights}
            </div>
          )}

        </div>
      </section>

      {/* CHARTS */}
      <section className="analytics-grid">

        {/* MONTHLY CHART */}
        <div className="chart-card">

          <div className="chart-header">
            <div>
              <h3>Income vs Expenses</h3>

              <p>Last 6 months</p>
            </div>

            <BarChart3 size={20} />
          </div>

          {monthlyData.length === 0 ? (
            <div className="empty-chart">
              No transaction data available.
            </div>
          ) : (
            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart data={monthlyData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="label" />

                  <YAxis />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="income"
                    name="Income"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    radius={[5, 5, 0, 0]}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>
          )}

        </div>

        {/* CATEGORY CHART */}
        <div className="chart-card">

          <div className="chart-header">
            <div>
              <h3>Expense Breakdown</h3>

              <p>Spending by category</p>
            </div>

            <PieChartIcon size={20} />
          </div>

          {analytics.categoryData.length === 0 ? (
            <div className="empty-chart">
              No expense data available.
            </div>
          ) : (
            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>

                  <Pie
                    data={analytics.categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={55}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(
                        0
                      )}%`
                    }
                  >
                    {analytics.categoryData.map(
                      (entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(Number(value))
                    }
                  />

                  <Legend />

                </PieChart>
              </ResponsiveContainer>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}

export default Analytics;