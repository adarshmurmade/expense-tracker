import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LockKeyhole,
  Mail,
  User,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import API from "../api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
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

    if (formData.password.length < 6) {
      toast.error(
        "Password must be at least 6 characters"
      );

      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/auth/register",
        formData
      );

      if (!response.data.success) {
        toast.error(
          response.data.message ||
            "Registration failed"
        );

        return;
      }

      toast.success(
        "Account created successfully!"
      );

      navigate("/login");

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Unable to create account"
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

          <h1>Create your account</h1>

          <p>
            Start managing your finances today.
          </p>

        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>
              Name
            </label>

            <div className="auth-input">

              <User size={18} />

              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>

          </div>

          <div className="form-group">

            <label>
              Email
            </label>

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

            <label>
              Password
            </label>

            <div className="auth-input">

              <LockKeyhole size={18} />

              <input
                type="password"
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
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
              ? "Creating account..."
              : "Create Account"}

          </button>

        </form>

        <p className="auth-footer">

          Already have an account?{" "}

          <Link to="/login">
            Sign in
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Register;