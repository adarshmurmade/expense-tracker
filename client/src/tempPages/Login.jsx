import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import API from "../api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/login",
        formData
      );

      if (!response.data.success) {
        toast.error(
          response.data.message || "Login failed"
        );
        return;
      }

      localStorage.setItem(
        "token",
        response.data.token
      );

      if (response.data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );
      }

      toast.success("Login successful!");

      navigate("/");
    } catch (error) {
      console.error("Login error:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to login"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Wallet size={22} />
          </div>

          <span>
            Expense<span>Flow</span>
          </span>
        </div>

        <div className="auth-heading">
          <h1>Welcome back</h1>

          <p>
            Login to manage your finances.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>Email</label>

            <div className="auth-input">

              <Mail size={18} />

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />

            </div>

          </div>

          <div className="form-group">

            <label>Password</label>

            <div className="auth-input">

              <LockKeyhole size={18} />

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />

            </div>

          </div>

          <button
            className="auth-button"
            type="submit"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Sign In"}

          </button>

        </form>

        <p className="auth-footer">

          Don't have an account?{" "}

          <Link to="/register">
            Create account
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Login;