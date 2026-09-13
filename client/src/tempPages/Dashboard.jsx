import { useEffect, useMemo, useState } from "react";
import API from "../api";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import {
  LayoutDashboard,
  WalletCards,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  LogOut,
  Sparkles,
  Settings,
  Bell,
  Check,
  CheckCheck,
} from "lucide-react";

import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import BudgetSection from "./BudgetSection";

function Dashboard() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // NOTIFICATIONS
  // =========================

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    type: "expense",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [categorySuggestion, setCategorySuggestion] = useState("");
  const [categorySuggestionReason, setCategorySuggestionReason] =
    useState("");

  // =========================
  // USER
  // =========================

  const storedUser = localStorage.getItem("user");

  const user = storedUser
    ? JSON.parse(storedUser)
    : {
        name: "User",
      };

  // =========================
  // FETCH TRANSACTIONS
  // =========================

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // JWT is automatically attached by api.js
      const response = await API.get("/transactions");

      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const response = await API.get("/notifications");

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount((previous) => Math.max(previous - 1, 0));
    } catch (error) {
      console.error("Mark notification read error:", error);
      toast.error("Unable to update notification");
    }
  };

  const markAllNotificationsRead = async () => {
    if (unreadCount === 0) return;

    try {
      await API.put("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Mark all notifications error:", error);
      toast.error("Unable to update notifications");
    }
  };

  const deleteOneNotification = async (notificationId) => {
    try {
      const notification = notifications.find(
        (item) => item._id === notificationId
      );

      await API.delete(`/notifications/${notificationId}`);

      setNotifications((previous) =>
        previous.filter((item) => item._id !== notificationId)
      );

      if (notification && !notification.isRead) {
        setUnreadCount((previous) => Math.max(previous - 1, 0));
      }
    } catch (error) {
      console.error("Delete notification error:", error);
      toast.error("Unable to delete notification");
    }
  };

  // =========================
  // TOTAL INCOME
  // =========================

  const income = transactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  // =========================
  // TOTAL EXPENSE
  // =========================

  const expense = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (total, transaction) =>
        total + Number(transaction.amount),
      0
    );

  // =========================
  // BALANCE
  // =========================

  const balance = income - expense;

  // =========================
  // ANALYTICS INSIGHTS
  // =========================

  const savingsRate =
    income > 0
      ? (balance / income) * 100
      : 0;

  const expenseRatio =
    income > 0
      ? (expense / income) * 100
      : 0;

  const transactionCount = transactions.length;

  // =========================
  // CATEGORY DATA
  // =========================

  const categoryData = useMemo(() => {
    const categoryMap = transactions
      .filter(
        (transaction) =>
          transaction.type === "expense"
      )
      .reduce((acc, transaction) => {
        const category =
          transaction.category || "Other";

        if (!acc[category]) {
          acc[category] = {
            name: category,
            value: 0,
          };
        }

        acc[category].value += Number(
          transaction.amount
        );

        return acc;
      }, {});

    return Object.values(categoryMap);
  }, [transactions]);

  const topSpendingCategory = useMemo(() => {
    if (categoryData.length === 0) {
      return "No data";
    }

    const topCategory = [...categoryData].sort(
      (a, b) => b.value - a.value
    )[0];

    return topCategory?.name || "No data";
  }, [categoryData]);

  // =========================
  // MONTHLY DATA
  // =========================

  const monthlyData = useMemo(() => {
    const monthMap = {};

    transactions.forEach((transaction) => {
      const date = new Date(
        transaction.date
      );

      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const monthName =
        date.toLocaleString("en-IN", {
          month: "short",
        });

      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          month: monthName,
          income: 0,
          expense: 0,
          sortKey: monthKey,
        };
      }

      if (transaction.type === "income") {
        monthMap[monthKey].income += Number(
          transaction.amount
        );
      } else {
        monthMap[monthKey].expense += Number(
          transaction.amount
        );
      }
    });

    return Object.values(monthMap)
      .sort((a, b) =>
        a.sortKey.localeCompare(b.sortKey)
      )
      .map(({ sortKey, ...item }) => item);
  }, [transactions]);

  // =========================
  // CATEGORIES
  // =========================

  const categories = useMemo(() => {
    return [
      ...new Set(
        transactions.map(
          (transaction) =>
            transaction.category
        )
      ),
    ]
      .filter(Boolean)
      .sort();
  }, [transactions]);

  // =========================
  // FILTER TRANSACTIONS
  // =========================

  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((transaction) => {
      const transactionDate = new Date(
        transaction.date
      );

      const searchText = search.toLowerCase();

      const matchesSearch =
        transaction.title
          ?.toLowerCase()
          .includes(searchText) ||
        transaction.category
          ?.toLowerCase()
          .includes(searchText);

      const matchesType =
        typeFilter === "all" ||
        transaction.type === typeFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        transaction.category === categoryFilter;

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate =
          transactionDate.toDateString() ===
          now.toDateString();
      }

      if (dateFilter === "week") {
        const weekStart = new Date(now);

        weekStart.setDate(
          now.getDate() - now.getDay()
        );

        weekStart.setHours(0, 0, 0, 0);

        matchesDate =
          transactionDate >= weekStart;
      }

      if (dateFilter === "month") {
        matchesDate =
          transactionDate.getMonth() ===
            now.getMonth() &&
          transactionDate.getFullYear() ===
            now.getFullYear();
      }

      // Custom date range takes priority over quick date filters.
      if (startDate) {
        const rangeStart = new Date(`${startDate}T00:00:00`);
        matchesDate =
          matchesDate &&
          transactionDate >= rangeStart;
      }

      if (endDate) {
        const rangeEnd = new Date(`${endDate}T23:59:59.999`);
        matchesDate =
          matchesDate &&
          transactionDate <= rangeEnd;
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesDate
      );
    });
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
    dateFilter,
    startDate,
    endDate,
  ]);


  // =========================
  // SMART CATEGORY PREDICTION
  // =========================

  const predictCategory = (title, type) => {
    if (!title?.trim()) return { category: "", reason: "" };

    const text = title.toLowerCase();

    if (type === "income") {
      if (/salary|payroll|wage|paycheck|stipend|internship|freelance|bonus/.test(text))
        return { category: "Salary", reason: "Looks like salary or employment income." };
      if (/interest|dividend|profit|return/.test(text))
        return { category: "Investment", reason: "Looks like investment-related income." };
      if (/refund|cashback|cash back|reimbursement/.test(text))
        return { category: "Refund", reason: "Looks like a refund or cashback." };
      return { category: "Income", reason: "Looks like a general income transaction." };
    }

    const rules = [
      ["Food", /food|grocery|groceries|restaurant|dinner|lunch|breakfast|snack|swiggy|zomato|blinkit|zepto|instamart|dominos|pizza|cafe|coffee|tea/, "Looks related to food or groceries."],
      ["Transport", /uber|ola|rapido|taxi|cab|auto|rickshaw|metro|bus|train|fuel|petrol|diesel|parking|transport/, "Looks related to transportation."],
      ["Entertainment", /netflix|prime video|amazon prime|hotstar|disney|spotify|youtube premium|movie|cinema|concert|gaming|game|steam|playstation|xbox|entertainment/, "Looks related to entertainment or subscriptions."],
      ["Bills", /electricity|electric|water bill|gas bill|mobile bill|phone bill|internet|wifi|broadband|recharge|bill|utility/, "Looks like a household or utility bill."],
      ["Shopping", /amazon|flipkart|myntra|ajio|shopping|clothes|clothing|shoes|shirt|jeans|electronics|headphones|laptop|phone|purchase/, "Looks related to shopping or a purchase."],
      ["Health", /hospital|doctor|medicine|medical|pharmacy|clinic|dentist|health|checkup|healthcare/, "Looks related to healthcare or medicine."],
      ["Education", /course|udemy|coursera|college|school|book|books|exam|tuition|education|training|certification/, "Looks related to education or learning."],
      ["Travel", /flight|hotel|airbnb|trip|travel|vacation|holiday|booking|makemytrip|goibibo/, "Looks related to travel or accommodation."],
      ["Home", /rent|furniture|home|house|cleaning|repair|maintenance|appliance/, "Looks related to home or household expenses."]
    ];

    for (const [category, pattern, reason] of rules) {
      if (pattern.test(text)) return { category, reason };
    }

    return { category: "", reason: "" };
  };

  const applyCategorySuggestion = () => {
    if (!categorySuggestion) return;
    setFormData((previous) => ({ ...previous, category: categorySuggestion }));
    toast.success(`Category set to ${categorySuggestion}`);
  };

  // =========================
  // OPEN ADD MODAL
  // =========================

  const openAddModal = () => {
    setEditingId(null);

    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "",
      date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setCategorySuggestion("");
    setCategorySuggestionReason("");
    setShowModal(true);
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const openEditModal = (transaction) => {
    setEditingId(transaction._id);

    setFormData({
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: new Date(transaction.date)
        .toISOString()
        .split("T")[0],
    });

    const suggestion = predictCategory(
      transaction.title,
      transaction.type
    );

    setCategorySuggestion(suggestion.category);
    setCategorySuggestionReason(suggestion.reason);

    setShowModal(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);

    setFormData({
      title: "",
      amount: "",
      type: "expense",
      category: "",
      date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setCategorySuggestion("");
    setCategorySuggestionReason("");
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "title") {
      const suggestion = predictCategory(value, formData.type);
      setCategorySuggestion(suggestion.category);
      setCategorySuggestionReason(suggestion.reason);
    }

    if (name === "type") {
      const suggestion = predictCategory(formData.title, value);
      setCategorySuggestion(suggestion.category);
      setCategorySuggestionReason(suggestion.reason);
    }
  };

  // =========================
  // ADD / UPDATE
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const data = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (editingId) {
        await API.put(
          `/transactions/${editingId}`,
          data
        );

        toast.success(
          "Transaction updated successfully"
        );
      } else {
        await API.post(
          "/transactions/add",
          data
        );

        toast.success(
          "Transaction added successfully"
        );
      }

      await fetchTransactions();

      closeModal();
    } catch (error) {
      console.error(
        "Transaction error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Something went wrong"
      );
    }
  };

  // =========================
  // OPEN DELETE MODAL
  // =========================

  const openDeleteModal = (
    transaction
  ) => {
    setDeleteId(transaction._id);
    setDeleteTitle(transaction.title);
  };

  // =========================
  // CLOSE DELETE MODAL
  // =========================

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteId(null);
    setDeleteTitle("");
  };

  // =========================
  // CONFIRM DELETE
  // =========================

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);

      await API.delete(
        `/transactions/${deleteId}`
      );

      setTransactions((previous) =>
        previous.filter(
          (transaction) =>
            transaction._id !== deleteId
        )
      );

      toast.success(
        "Transaction deleted successfully"
      );

      setDeleteId(null);
      setDeleteTitle("");
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to delete transaction"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================
  // CLEAR FILTERS
  // =========================

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setDateFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    dateFilter !== "all" ||
    startDate !== "" ||
    endDate !== "";

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    toast.success(
      "Logged out successfully"
    );

    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
  };

  // =========================
  // CURRENCY
  // =========================

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  // =========================
  // CHART COLORS
  // =========================

  const chartColors = [
    "#635bff",
    "#20b486",
    "#f59e0b",
    "#ef5da8",
    "#38bdf8",
    "#8b5cf6",
    "#f97316",
  ];

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">
            <Wallet size={22} />
          </div>

          <span>
            Expense<span>Flow</span>
          </span>

        </div>

        <nav className="sidebar-nav">

          {/* DASHBOARD */}

          <button
            type="button"
            className="nav-item active"
            onClick={() => navigate("/")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          {/* TRANSACTIONS */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              document
                .querySelector(
                  ".transactions-section"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <WalletCards size={19} />
            Transactions
          </button>

          {/* BUDGETS */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              document
                .querySelector(".budgets-section")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            <WalletCards size={19} />
            Budgets
          </button>

          {/* ANALYTICS */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate("/analytics")
            }
          >
            <TrendingUp size={19} />
            Analytics
          </button>

          {/* SETTINGS */}

          <button
            type="button"
            className="nav-item"
            onClick={() =>
              navigate("/settings")
            }
          >
            <Settings size={19} />
            Settings
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="profile-card">

            <div className="avatar">
              {user.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>

            <div>

              <strong>
                {user.name || "User"}
              </strong>

              <span>
                Personal Account
              </span>

            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Logout
          </button>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="main-content">

        {/* ================= HEADER ================= */}

        <header className="top-header">

          <div>

            <p className="eyebrow">
              FINANCE OVERVIEW
            </p>

            <h1>
              Good evening,{" "}
              {user.name || "User"} 👋
            </h1>

            <p className="subtitle">
              Here's what's happening with
              your money.
            </p>

          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              position: "relative",
            }}
          >
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => setShowNotifications((previous) => !previous)}
              style={{
                position: "relative",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                border: "1px solid rgba(99, 91, 255, 0.14)",
                background: "#ffffff",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
              }}
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    minWidth: "19px",
                    height: "19px",
                    padding: "0 5px",
                    borderRadius: "999px",
                    background: "#ef4444",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid white",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            <button
              className="primary-button"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add Transaction
            </button>

            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: "54px",
                  right: 0,
                  width: "min(390px, calc(100vw - 28px))",
                  maxHeight: "min(560px, calc(100vh - 90px))",
                  overflowY: "auto",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  boxShadow: "0 20px 50px rgba(15, 23, 42, 0.16)",
                  zIndex: 2000,
                }}
              >
                <div
                  style={{
                    padding: "16px 16px 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    borderBottom: "1px solid #eef0f4",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: "15px", color: "#111827" }}>
                      Notifications
                    </strong>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>
                      {unreadCount > 0
                        ? `${unreadCount} unread alert${unreadCount === 1 ? "" : "s"}`
                        : "You're all caught up"}
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      title="Mark all as read"
                      style={{
                        border: "none",
                        background: "rgba(99, 91, 255, 0.08)",
                        color: "#4f46e5",
                        borderRadius: "9px",
                        padding: "8px 9px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      <CheckCheck size={14} />
                      Read all
                    </button>
                  )}
                </div>

                {notificationsLoading ? (
                  <div style={{ padding: "28px 18px", textAlign: "center", color: "#6b7280", fontSize: "13px" }}>
                    Loading alerts...
                  </div>
                ) : notifications.length === 0 ? (
                  <div style={{ padding: "34px 18px", textAlign: "center" }}>
                    <Bell size={28} style={{ opacity: 0.35, marginBottom: "8px" }} />
                    <strong style={{ display: "block", fontSize: "13px", color: "#374151" }}>
                      No notifications
                    </strong>
                    <span style={{ display: "block", marginTop: "5px", fontSize: "12px", color: "#9ca3af" }}>
                      Financial alerts will appear here automatically.
                    </span>
                  </div>
                ) : (
                  <div>
                    {notifications.map((notification) => {
                      const priorityStyles = {
                        high: { background: "#fef2f2", border: "#fecaca", icon: "#dc2626" },
                        medium: { background: "#fff7ed", border: "#fed7aa", icon: "#ea580c" },
                        low: { background: "#f0fdf4", border: "#bbf7d0", icon: "#16a34a" },
                      };

                      const style = priorityStyles[notification.priority] || priorityStyles.medium;

                      return (
                        <div
                          key={notification._id}
                          style={{
                            padding: "13px 14px",
                            borderBottom: "1px solid #f1f3f5",
                            background: notification.isRead ? "#ffffff" : "#fafaff",
                          }}
                        >
                          <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                            <div
                              style={{
                                width: "34px",
                                height: "34px",
                                flexShrink: 0,
                                borderRadius: "10px",
                                background: style.background,
                                border: `1px solid ${style.border}`,
                                color: style.icon,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Bell size={16} />
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                                <strong style={{ fontSize: "13px", color: "#1f2937", lineHeight: 1.35 }}>
                                  {notification.title}
                                </strong>
                                {!notification.isRead && (
                                  <span
                                    style={{
                                      width: "7px",
                                      height: "7px",
                                      flexShrink: 0,
                                      borderRadius: "50%",
                                      background: "#635bff",
                                      marginTop: "5px",
                                    }}
                                  />
                                )}
                              </div>

                              <p style={{ margin: "5px 0 7px", fontSize: "12px", lineHeight: 1.5, color: "#6b7280" }}>
                                {notification.message}
                              </p>

                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                                  {new Date(notification.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                                </span>

                                <div style={{ display: "flex", gap: "5px" }}>
                                  {!notification.isRead && (
                                    <button
                                      type="button"
                                      onClick={() => markNotificationRead(notification._id)}
                                      title="Mark as read"
                                      style={{ border: "none", background: "transparent", color: "#4f46e5", cursor: "pointer", padding: "4px" }}
                                    >
                                      <Check size={15} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => deleteOneNotification(notification._id)}
                                    title="Delete"
                                    style={{ border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer", padding: "4px" }}
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </header>

        {/* ================= STATS ================= */}

        <section className="stats-grid">

          {/* BALANCE */}

          <div className="stat-card balance-card">

            <div className="stat-top">

              <span>
                Total Balance
              </span>

              <div className="stat-icon balance-icon">
                <Wallet size={20} />
              </div>

            </div>

            <h2>
              {formatCurrency(balance)}
            </h2>

            <div className="balance-indicator">

              <TrendingUp size={15} />

              <span>
                Current available balance
              </span>

            </div>

          </div>

          {/* INCOME */}

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Total Income
              </span>

              <div className="stat-icon income-icon">
                <ArrowUpCircle size={20} />
              </div>

            </div>

            <h2>
              {formatCurrency(income)}
            </h2>

            <p className="stat-description">
              Money coming in
            </p>

          </div>

          {/* EXPENSE */}

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Total Expenses
              </span>

              <div className="stat-icon expense-icon">
                <ArrowDownCircle size={20} />
              </div>

            </div>

            <h2>
              {formatCurrency(expense)}
            </h2>

            <p className="stat-description">
              Money going out
            </p>

          </div>

        </section>

        {/* ================= ANALYTICS INSIGHTS ================= */}

        <section
          className="stats-grid"
          style={{ marginTop: "18px" }}
        >

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Savings Rate
              </span>

              <div className="stat-icon income-icon">
                <TrendingUp size={20} />
              </div>

            </div>

            <h2>
              {savingsRate.toFixed(1)}%
            </h2>

            <p className="stat-description">
              Percentage of income remaining
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Expense Ratio
              </span>

              <div className="stat-icon expense-icon">
                <TrendingDown size={20} />
              </div>

            </div>

            <h2>
              {expenseRatio.toFixed(1)}%
            </h2>

            <p className="stat-description">
              Expenses compared with income
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Top Spending Category
              </span>

              <div className="stat-icon balance-icon">
                <WalletCards size={20} />
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
              title={topSpendingCategory}
            >
              {topSpendingCategory}
            </h2>

            <p className="stat-description">
              Category with the highest expenses
            </p>

          </div>

          <div className="stat-card">

            <div className="stat-top">

              <span>
                Total Transactions
              </span>

              <div className="stat-icon balance-icon">
                <Wallet size={20} />
              </div>

            </div>

            <h2>
              {transactionCount}
            </h2>

            <p className="stat-description">
              Total financial activities recorded
            </p>

          </div>

        </section>

        {/* ================= ANALYTICS ================= */}

        <section className="analytics-grid">

          {/* SPENDING CATEGORY */}

          <div className="analytics-card">

            <div className="section-header">

              <div>

                <h2>
                  Spending by category
                </h2>

                <p>
                  Where your money is going
                </p>

              </div>

              <div className="chart-icon">
                <TrendingDown size={18} />
              </div>

            </div>

            {categoryData.length ===
            0 ? (

              <div className="chart-empty">

                <WalletCards size={35} />

                <p>
                  No expense data yet
                </p>

                <span>
                  Add an expense to see
                  your spending breakdown.
                </span>

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <PieChart>

                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    paddingAngle={3}
                    label
                  >

                    {categoryData.map(
                      (entry, index) => (

                        <Cell
                          key={`cell-${index}`}
                          fill={
                            chartColors[
                              index %
                                chartColors.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                </PieChart>

              </ResponsiveContainer>

            )}

          </div>

          {/* INCOME VS EXPENSE */}

          <div className="analytics-card">

            <div className="section-header">

              <div>

                <h2>
                  Income vs expenses
                </h2>

                <p>
                  Monthly financial overview
                </p>

              </div>

              <div className="chart-icon">
                <TrendingUp size={18} />
              </div>

            </div>

            {monthlyData.length ===
            0 ? (

              <div className="chart-empty">

                <WalletCards size={35} />

                <p>
                  No financial data yet
                </p>

                <span>
                  Add transactions to see
                  your monthly overview.
                </span>

              </div>

            ) : (

              <ResponsiveContainer
                width="100%"
                height={280}
              >

                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="month"
                  />

                  <YAxis />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Legend />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#20b486"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="expense"
                    name="Expense"
                    fill="#ef5d5d"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            )}

          </div>

        </section>

        {/* ================= BUDGETS ================= */}

        <section className="budgets-section">
          <BudgetSection transactions={transactions} />
        </section>

        {/* ================= TRANSACTIONS ================= */}

        <section className="transactions-section">

          <div className="section-header">

            <div>

              <h2>
                Recent transactions
              </h2>

              <p>
                Manage your latest
                financial activity
              </p>

            </div>

            <span className="transaction-count">
              {filteredTransactions.length}{" "}
              transactions
            </span>

          </div>

          {/* ADVANCED FILTERS */}

          <div className="filters">

            <div
              className="search-box"
              style={{ flex: "1 1 240px" }}
            >
              <Search size={18} />

              <input
                type="text"
                placeholder="Search title or category..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            <div className="filter-control">

              <Filter size={17} />

              <select
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(event.target.value)
                }
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

            </div>

            <div className="filter-control">

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
              >
                <option value="all">All categories</option>

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>

            </div>

            <div className="filter-control">

              <select
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
              >
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>

            </div>

          </div>

          <div
            className="filters"
            style={{
              marginTop: "10px",
              alignItems: "center",
            }}
          >

            <div
              className="filter-control"
              style={{ flex: "1 1 180px" }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                From
              </span>

              <input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  if (
                    endDate &&
                    event.target.value > endDate
                  ) {
                    setEndDate("");
                  }
                }}
              />

            </div>

            <div
              className="filter-control"
              style={{ flex: "1 1 180px" }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                To
              </span>

              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
              />

            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  minHeight: "42px",
                  padding: "0 14px",
                  border: "1px solid var(--border-color, #e5e7eb)",
                  borderRadius: "10px",
                  background: "transparent",
                  cursor: "pointer",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Clear filters
              </button>
            )}

          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginTop: "12px",
              flexWrap: "wrap",
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            <span>
              Showing{" "}
              <strong style={{ color: "inherit" }}>
                {filteredTransactions.length}
              </strong>{" "}
              of{" "}
              <strong style={{ color: "inherit" }}>
                {transactions.length}
              </strong>{" "}
              transactions
            </span>

            {hasActiveFilters && (
              <span>
                Active filters applied
              </span>
            )}
          </div>

          {/* TRANSACTION LIST */}

          <div className="transaction-list">

            {loading ? (

              <>
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
                <TransactionSkeleton />
              </>

            ) : filteredTransactions.length ===
              0 ? (

              <div className="empty-state">

                <WalletCards size={40} />

                <h3>
                  No transactions found
                </h3>

                <p>
                  {hasActiveFilters
                    ? "Try changing or clearing your filters."
                    : "Add a new transaction to get started."}
                </p>

              </div>

            ) : (

              filteredTransactions.map(
                (transaction) => (

                  <div
                    className="transaction-row"
                    key={transaction._id}
                  >

                    <div
                      className={`transaction-icon ${
                        transaction.type ===
                        "income"
                          ? "transaction-income"
                          : "transaction-expense"
                      }`}
                    >

                      {transaction.type ===
                      "income" ? (
                        <ArrowUpCircle
                          size={20}
                        />
                      ) : (
                        <ArrowDownCircle
                          size={20}
                        />
                      )}

                    </div>

                    <div className="transaction-info">

                      <strong>
                        {transaction.title}
                      </strong>

                      <span>
                        {transaction.category}
                      </span>

                    </div>

                    <div className="transaction-date">

                      {new Date(
                        transaction.date
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}

                    </div>

                    <div
                      className={`transaction-amount ${
                        transaction.type ===
                        "income"
                          ? "amount-income"
                          : "amount-expense"
                      }`}
                    >

                      {transaction.type ===
                      "income"
                        ? "+"
                        : "-"}

                      {formatCurrency(
                        transaction.amount
                      )}

                    </div>

                    <div className="transaction-actions">

                      <button
                        className="edit-button"
                        onClick={() =>
                          openEditModal(
                            transaction
                          )
                        }
                        title="Edit"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        className="delete-button"
                        onClick={() =>
                          openDeleteModal(
                            transaction
                          )
                        }
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </section>

      </main>

      {/* ================= ADD / EDIT MODAL ================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={closeModal}
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  {editingId
                    ? "Edit Transaction"
                    : "Add Transaction"}
                </h2>

                <p>
                  Keep your financial records
                  up to date.
                </p>

              </div>

              <button
                className="close-button"
                onClick={closeModal}
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-group">

                <label>
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Grocery shopping"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="1"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Type
                </label>

                <div className="type-selector">

                  <button
                    type="button"
                    className={
                      formData.type ===
                      "expense"
                        ? "type-option active expense-option"
                        : "type-option"
                    }
                    onClick={() =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          type: "expense",
                        })
                      )
                    }
                  >

                    <ArrowDownCircle
                      size={18}
                    />

                    Expense

                  </button>

                  <button
                    type="button"
                    className={
                      formData.type ===
                      "income"
                        ? "type-option active income-option"
                        : "type-option"
                    }
                    onClick={() =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          type: "income",
                        })
                      )
                    }
                  >

                    <ArrowUpCircle
                      size={18}
                    />

                    Income

                  </button>

                </div>

              </div>

              <div className="form-group">

                <label>
                  Category
                </label>

                <input
                  type="text"
                  name="category"
                  placeholder="e.g. Food, Travel, Salary"
                  value={formData.category}
                  onChange={handleChange}
                  required
                />

                {categorySuggestion &&
                  categorySuggestion !== formData.category && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid rgba(99, 91, 255, 0.2)",
                        background: "rgba(99, 91, 255, 0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "9px",
                          minWidth: 0,
                        }}
                      >
                        <Sparkles size={17} style={{ flexShrink: 0 }} />
                        <div>
                          <strong style={{ display: "block", fontSize: "13px" }}>
                            Suggested: {categorySuggestion}
                          </strong>
                          {categorySuggestionReason && (
                            <span
                              style={{
                                display: "block",
                                marginTop: "3px",
                                fontSize: "12px",
                                opacity: 0.72,
                              }}
                            >
                              {categorySuggestionReason}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={applyCategorySuggestion}
                        style={{
                          border: "none",
                          borderRadius: "7px",
                          padding: "7px 10px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "12px",
                          flexShrink: 0,
                        }}
                      >
                        Use suggestion
                      </button>
                    </div>
                  )}

              </div>

              <div className="form-group">

                <label>
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingId
                    ? "Update Transaction"
                    : "Add Transaction"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================= DELETE MODAL ================= */}

      {deleteId && (

        <div
          className="modal-overlay"
          onClick={closeDeleteModal}
        >

          <div
            className="delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="delete-icon">
              <Trash2 size={24} />
            </div>

            <h2>
              Delete transaction?
            </h2>

            <p>
              Are you sure you want to
              delete{" "}
              <strong>
                "{deleteTitle}"
              </strong>
              ? This action cannot be
              undone.
            </p>

            <div className="delete-actions">

              <button
                className="cancel-button"
                onClick={closeDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                className="confirm-delete-button"
                onClick={confirmDelete}
                disabled={deleting}
              >

                {deleting ? (
                  <>
                    <span className="button-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// =========================
// TRANSACTION SKELETON
// =========================

function TransactionSkeleton() {
  return (
    <div className="transaction-row skeleton-row">

      <div className="skeleton skeleton-icon"></div>

      <div className="skeleton-info">

        <div className="skeleton skeleton-title"></div>

        <div className="skeleton skeleton-category"></div>

      </div>

      <div className="skeleton skeleton-date"></div>

      <div className="skeleton skeleton-amount"></div>

      <div className="skeleton-actions">

        <div className="skeleton skeleton-button"></div>

        <div className="skeleton skeleton-button"></div>

      </div>

    </div>
  );
}

export default Dashboard;