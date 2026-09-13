import { useEffect, useState } from "react";
import {
  User,
  Mail,
  CalendarDays,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  LockKeyhole,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import API from "../api";
import toast from "react-hot-toast";

const CATEGORIES = [
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

function Settings() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    currency: "INR",
    defaultCategory: "Other",
    createdAt: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await API.get("/profile");

      if (response.data.success) {
        const user = response.data.user;

        setProfile({
          name: user.name || "",
          email: user.email || "",
          currency: user.currency || "INR",
          defaultCategory: user.defaultCategory || "Other",
          createdAt: user.createdAt || "",
        });
      }
    } catch (error) {
      console.error("Profile fetch error:", error);

      toast.error(
        error.response?.data?.message || "Unable to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!profile.email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setSaving(true);

      const response = await API.put("/profile", {
        name: profile.name,
        email: profile.email,
        currency: profile.currency,
        defaultCategory: profile.defaultCategory,
      });

      if (response.data.success) {
        const updatedUser = response.data.user;

        setProfile((previous) => ({
          ...previous,
          name: updatedUser.name,
          email: updatedUser.email,
          currency: updatedUser.currency || "INR",
          defaultCategory: updatedUser.defaultCategory || "Other",
        }));

        localStorage.setItem("user", JSON.stringify(updatedUser));

        toast.success("Settings saved successfully");
      }
    } catch (error) {
      console.error("Profile update error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to update settings"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordData;

    if (!currentPassword) {
      toast.error("Enter your current password");
      return;
    }

    if (!newPassword) {
      toast.error("Enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(
        "New password must be different from current password"
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await API.put("/password/change", {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        toast.success("Password changed successfully");

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Change password error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const formattedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          Loading your profile...
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header settings-header-premium">
        <div className="settings-title">
          <div className="settings-title-icon">
            <SettingsIcon size={22} />
          </div>

          <div>
            <div className="settings-eyebrow">ACCOUNT CENTER</div>
            <h1>Profile & Settings</h1>
            <p>
              Manage your profile and personalize your
              ExpenseFlow experience.
            </p>
          </div>
        </div>

        <div className="settings-header-badge">
          <ShieldCheck size={16} />
          <span>Secure account</span>
        </div>
      </div>

      {/* Profile + Preferences */}
      <div className="settings-grid">
        {/* Profile Information */}
        <div className="settings-card settings-card-premium profile-card">
          <div className="settings-card-header">
            <div>
              <div className="settings-card-label">ACCOUNT</div>
              <h2>Profile Information</h2>
              <p>Your personal account information.</p>
            </div>

            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {profile.name
                  ? profile.name.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <span className="profile-online-dot" />
            </div>
          </div>

          <div className="profile-info-list">
            <div className="profile-info-item">
              <div className="profile-info-icon">
                <User size={17} />
              </div>

              <div>
                <span>Name</span>
                <strong>{profile.name || "—"}</strong>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <Mail size={17} />
              </div>

              <div>
                <span>Email</span>
                <strong>{profile.email || "—"}</strong>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-info-icon">
                <CalendarDays size={17} />
              </div>

              <div>
                <span>Member since</span>
                <strong>{formattedDate}</strong>
              </div>
            </div>
          </div>

          <div className="security-badge settings-security-card">
            <div className="security-badge-icon">
              <ShieldCheck size={18} />
            </div>

            <div>
              <strong>Account secured</strong>
              <span>
                Your profile is protected by authenticated
                access.
              </span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="settings-card settings-card-premium">
          <div className="settings-card-header">
            <div>
              <div className="settings-card-label">PERSONALIZATION</div>
              <h2>Preferences</h2>
              <p>Customize how ExpenseFlow works for you.</p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="settings-form-grid">
              <div className="form-group">
                <label htmlFor="settings-name">Full Name</label>

                <input
                  id="settings-name"
                  name="name"
                  type="text"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="settings-email">
                  Email Address
                </label>

                <input
                  id="settings-email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="settings-form-grid">
              <div className="form-group">
                <label htmlFor="settings-currency">Currency</label>

                <select
                  id="settings-currency"
                  name="currency"
                  value={profile.currency}
                  onChange={handleChange}
                >
                  <option value="INR">
                    INR — Indian Rupee (₹)
                  </option>
                  <option value="USD">
                    USD — US Dollar ($)
                  </option>
                  <option value="EUR">
                    EUR — Euro (€)
                  </option>
                  <option value="GBP">
                    GBP — British Pound (£)
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="settings-category">
                  Default Category
                </label>

                <select
                  id="settings-category"
                  name="defaultCategory"
                  value={profile.defaultCategory}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="settings-save-area settings-save-area-premium">
              <div className="settings-save-hint">
                Your profile preferences are saved to your account.
              </div>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="settings-card settings-card-premium password-settings-card">
        <div className="settings-card-header">
          <div>
            <div className="settings-card-label">SECURITY</div>

            <div className="settings-section-heading">
              <div className="settings-title-icon">
                <LockKeyhole size={20} />
              </div>

              <div>
                <h2>Change Password</h2>
                <p>
                  Update your password to keep your
                  ExpenseFlow account secure.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword}>
          <div className="settings-form-grid">
            {/* Current Password */}
            <div className="form-group">
              <label htmlFor="current-password">
                Current Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="current-password"
                  name="currentPassword"
                  type={
                    showPasswords.current
                      ? "text"
                      : "password"
                  }
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    togglePasswordVisibility("current")
                  }
                  aria-label={
                    showPasswords.current
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPasswords.current ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>

              <div className="password-input-wrapper">
                <input
                  id="new-password"
                  name="newPassword"
                  type={
                    showPasswords.new ? "text" : "password"
                  }
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    togglePasswordVisibility("new")
                  }
                  aria-label={
                    showPasswords.new
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPasswords.new ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <small className="password-hint">
                Minimum 6 characters.
              </small>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <div className="password-input-wrapper">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={
                    showPasswords.confirm
                      ? "text"
                      : "password"
                  }
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    togglePasswordVisibility("confirm")
                  }
                  aria-label={
                    showPasswords.confirm
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPasswords.confirm ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="password-security-note">
            <div className="password-security-icon">
              <KeyRound size={17} />
            </div>

            <span>
              For security, your current password must be
              verified before the new password is saved.
            </span>
          </div>

          <div className="settings-save-area settings-save-area-premium">
            <div className="settings-save-hint">
              Use a strong password that you do not reuse elsewhere.
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={changingPassword}
            >
              <LockKeyhole size={17} />
              {changingPassword
                ? "Updating..."
                : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
