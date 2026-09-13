import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Plus,
  Target,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";

const DEFAULT_CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Bills",
  "Shopping",
  "Health",
  "Education",
  "Travel",
  "Home",
  "Other",
];

function BudgetSection({ transactions = [] }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    category: "Food",
    amount: "",
  });

  const monthName = new Date(selectedYear, selectedMonth - 1, 1)
    .toLocaleString("en-IN", { month: "long" });

  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await API.get(
        `/budgets?month=${selectedMonth}&year=${selectedYear}`
      );
      setBudgets(response.data.budgets || []);
    } catch (error) {
      console.error("Budget fetch error:", error);
      toast.error(
        error.response?.data?.message || "Failed to load budgets"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const monthExpenses = useMemo(() => {
    const totals = {};

    transactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;

      const date = new Date(transaction.date);

      if (
        date.getMonth() + 1 !== selectedMonth ||
        date.getFullYear() !== selectedYear
      ) {
        return;
      }

      const category = transaction.category || "Other";
      totals[category] =
        (totals[category] || 0) + Number(transaction.amount || 0);
    });

    return totals;
  }, [transactions, selectedMonth, selectedYear]);

  const budgetRows = useMemo(
    () =>
      budgets.map((budget) => {
        const spent = monthExpenses[budget.category] || 0;
        const limit = Number(budget.amount || 0);
        const percentage = limit > 0 ? (spent / limit) * 100 : 0;

        return {
          ...budget,
          spent,
          limit,
          percentage,
          remaining: limit - spent,
          exceeded: spent > limit,
          nearLimit: percentage >= 80 && percentage <= 100,
        };
      }),
    [budgets, monthExpenses]
  );

  const totalBudget = budgetRows.reduce(
    (sum, budget) => sum + budget.limit,
    0
  );
  const totalSpent = budgetRows.reduce(
    (sum, budget) => sum + budget.spent,
    0
  );
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentage =
    totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const openAddModal = () => {
    setEditingId(null);

    const existing = new Set(budgets.map((budget) => budget.category));
    const firstAvailable =
      DEFAULT_CATEGORIES.find((category) => !existing.has(category)) ||
      DEFAULT_CATEGORIES[0];

    setFormData({
      category: firstAvailable,
      amount: "",
    });
    setShowModal(true);
  };

  const openEditModal = (budget) => {
    setEditingId(budget._id);
    setFormData({
      category: budget.category,
      amount: budget.amount,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingId(null);
    setFormData({ category: "Food", amount: "" });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const amount = Number(formData.amount);

    if (!formData.category.trim()) {
      toast.error("Please select a category");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Budget amount must be greater than ₹0");
      return;
    }

    try {
      setSaving(true);

      await API.post("/budgets", {
        category: formData.category.trim(),
        amount,
        month: selectedMonth,
        year: selectedYear,
      });

      toast.success(
        editingId
          ? "Budget updated successfully"
          : "Budget created successfully"
      );

      await fetchBudgets();
      closeModal();
    } catch (error) {
      console.error("Budget save error:", error);
      toast.error(
        error.response?.data?.message || "Unable to save budget"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (budget) => {
    if (
      !window.confirm(
        `Delete the ${budget.category} budget for ${monthName}?`
      )
    ) {
      return;
    }

    try {
      await API.delete(`/budgets/${budget._id}`);
      setBudgets((previous) =>
        previous.filter((item) => item._id !== budget._id)
      );
      toast.success("Budget deleted successfully");
    } catch (error) {
      console.error("Budget delete error:", error);
      toast.error(
        error.response?.data?.message || "Unable to delete budget"
      );
    }
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((year) => year - 1);
    } else {
      setSelectedMonth((month) => month - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((year) => year + 1);
    } else {
      setSelectedMonth((month) => month + 1);
    }
  };

  return (
    <>
      <div
        style={{
          marginTop: "28px",
          marginBottom: "28px",
          padding: "24px",
          borderRadius: "18px",
          background: "var(--card-background, #ffffff)",
          border: "1px solid var(--border-color, #e5e7eb)",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "11px",
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(99, 91, 255, 0.1)",
                }}
              >
                <Target size={19} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "20px" }}>
                  Monthly Budgets
                </h2>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  Set spending limits and stay on track.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={goToPreviousMonth}
              style={monthButtonStyle}
              aria-label="Previous month"
            >
              ‹
            </button>

            <div
              style={{
                minWidth: "150px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              {monthName} {selectedYear}
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              style={monthButtonStyle}
              aria-label="Next month"
            >
              ›
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="primary-button"
              style={{ minHeight: "40px" }}
            >
              <Plus size={17} />
              Add Budget
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "12px",
            marginTop: "22px",
          }}
        >
          <SummaryCard
            label="Total Budget"
            value={formatCurrency(totalBudget)}
            icon={<WalletCards size={17} />}
          />
          <SummaryCard
            label="Budgeted Spending"
            value={formatCurrency(totalSpent)}
            icon={<Target size={17} />}
          />
          <SummaryCard
            label={totalRemaining >= 0 ? "Remaining" : "Over Budget"}
            value={formatCurrency(Math.abs(totalRemaining))}
            icon={
              totalRemaining >= 0 ? (
                <CheckCircle2 size={17} />
              ) : (
                <AlertTriangle size={17} />
              )
            }
            danger={totalRemaining < 0}
          />
        </div>

        {totalBudget > 0 && (
          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "8px",
              }}
            >
              <span>Overall budget usage</span>
              <span>{totalPercentage.toFixed(0)}%</span>
            </div>

            <div
              style={{
                height: "9px",
                borderRadius: "999px",
                background: "#eef0f5",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(totalPercentage, 100)}%`,
                  height: "100%",
                  borderRadius: "999px",
                  background:
                    totalPercentage > 100
                      ? "#ef5d5d"
                      : totalPercentage >= 80
                        ? "#f59e0b"
                        : "#20b486",
                  transition: "width 0.35s ease",
                }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div
            style={{
              marginTop: "22px",
              padding: "30px 10px",
              textAlign: "center",
              color: "#6b7280",
            }}
          >
            Loading budgets...
          </div>
        ) : budgetRows.length === 0 ? (
          <div
            style={{
              marginTop: "22px",
              padding: "30px 16px",
              textAlign: "center",
              borderRadius: "14px",
              border: "1px dashed #d9dce5",
              color: "#6b7280",
            }}
          >
            <Target size={28} style={{ marginBottom: "8px" }} />
            <h3
              style={{
                margin: "0 0 5px",
                color: "inherit",
                fontSize: "15px",
              }}
            >
              No budgets for {monthName}
            </h3>
            <p style={{ margin: 0, fontSize: "13px" }}>
              Create category budgets to track your monthly spending.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "12px",
              marginTop: "22px",
            }}
          >
            {budgetRows.map((budget) => (
              <div
                key={budget._id}
                style={{
                  padding: "17px",
                  borderRadius: "14px",
                  border: budget.exceeded
                    ? "1px solid rgba(239, 93, 93, 0.35)"
                    : "1px solid var(--border-color, #e5e7eb)",
                  background: budget.exceeded
                    ? "rgba(239, 93, 93, 0.035)"
                    : "transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "14px" }}>
                      {budget.category}
                    </strong>
                    <div
                      style={{
                        marginTop: "4px",
                        color: "#6b7280",
                        fontSize: "12px",
                      }}
                    >
                      {formatCurrency(budget.spent)} of{" "}
                      {formatCurrency(budget.limit)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={() => openEditModal(budget)}
                      style={iconButtonStyle}
                      title="Edit budget"
                      aria-label={`Edit ${budget.category} budget`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(budget)}
                      style={iconButtonStyle}
                      title="Delete budget"
                      aria-label={`Delete ${budget.category} budget`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    height: "8px",
                    borderRadius: "999px",
                    background: "#eef0f5",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(budget.percentage, 100)}%`,
                      height: "100%",
                      borderRadius: "999px",
                      background: budget.exceeded
                        ? "#ef5d5d"
                        : budget.nearLimit
                          ? "#f59e0b"
                          : "#20b486",
                      transition: "width 0.35s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "9px",
                    fontSize: "12px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      color: budget.exceeded
                        ? "#ef5d5d"
                        : budget.nearLimit
                          ? "#b77900"
                          : "#20b486",
                    }}
                  >
                    {budget.percentage.toFixed(0)}% used
                  </span>
                  <span style={{ color: "#6b7280" }}>
                    {budget.exceeded
                      ? `${formatCurrency(Math.abs(budget.remaining))} over`
                      : `${formatCurrency(budget.remaining)} remaining`}
                  </span>
                </div>

                {budget.exceeded ? (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "rgba(239, 93, 93, 0.08)",
                      color: "#d64545",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    🔴 You've exceeded your {budget.category} budget.
                  </div>
                ) : budget.nearLimit ? (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "rgba(245, 158, 11, 0.08)",
                      color: "#b77900",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    🟠 You're close to your {budget.category} budget limit.
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "rgba(32, 180, 134, 0.08)",
                      color: "#168c69",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    🟢 You're on track with your {budget.category} budget.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{editingId ? "Edit Budget" : "Add Budget"}</h2>
                <p>
                  Set your {monthName} {selectedYear} spending limit.
                </p>
              </div>

              <button
                className="close-button"
                onClick={closeModal}
                type="button"
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      category: event.target.value,
                    }))
                  }
                  required
                >
                  {DEFAULT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Monthly Budget</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 6000"
                  value={formData.amount}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      amount: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Budget"
                      : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryCard({ label, value, icon, danger = false }) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "13px",
        background: danger
          ? "rgba(239, 93, 93, 0.06)"
          : "rgba(99, 91, 255, 0.045)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          color: "#6b7280",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        {icon}
        {label}
      </div>
      <strong
        style={{
          display: "block",
          marginTop: "8px",
          fontSize: "18px",
          color: danger ? "#ef5d5d" : "inherit",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

const monthButtonStyle = {
  width: "34px",
  height: "34px",
  borderRadius: "9px",
  border: "1px solid var(--border-color, #e5e7eb)",
  background: "transparent",
  cursor: "pointer",
  fontSize: "20px",
  lineHeight: 1,
};

const iconButtonStyle = {
  width: "30px",
  height: "30px",
  display: "grid",
  placeItems: "center",
  border: "1px solid var(--border-color, #e5e7eb)",
  borderRadius: "8px",
  background: "transparent",
  cursor: "pointer",
};

export default BudgetSection;
