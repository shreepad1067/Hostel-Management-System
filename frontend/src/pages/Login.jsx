import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);

  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const getErrorMessage = (error) => {
    if (!error.response) {
      return "Unable to connect to the backend.";
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || "Validation error")
        .join(", ");
    }

    return "Something went wrong. Please try again.";
  };

  const resetForgotPasswordForm = () => {
    setForgotMode(false);
    setForgotStep(1);
    setIdentifier("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        username,
        password,
      });

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      navigate("/dashboard");
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();

    if (!identifier.trim()) {
      setMessage("Enter your registered email or phone number.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await api.post(
        "/auth/forgot-password",
        {
          identifier: identifier.trim(),
        }
      );

      setMessage(
        response.data?.message ||
          "OTP sent successfully."
      );

      setForgotStep(2);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!otp.trim()) {
      setMessage("Enter the OTP you received.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await api.post("/auth/verify-otp", {
        identifier: identifier.trim(),
        otp: otp.trim(),
      });

      setMessage(
        "OTP verified successfully. Create your new password."
      );

      setForgotStep(3);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setMessage(
        "New password must contain at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await api.post("/auth/reset-password", {
        identifier: identifier.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });

      alert(
        "Password reset successfully. You can now sign in with your new password."
      );

      resetForgotPasswordForm();
      setPassword("");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => {
    return (
      <>
        <div className="auth-heading">
          <h2>Welcome back!</h2>

          <p>
            Sign in to continue to your account.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="auth-form"
        >
          <div className="auth-field">
            <label htmlFor="username">
              Username
            </label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                👤
              </span>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
            </label>

            <div className="auth-input-wrapper">
              <span className="auth-input-icon">
                🔒
              </span>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "-4px",
              marginBottom: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setForgotMode(true);
                setForgotStep(1);
                setMessage("");
              }}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                cursor: "pointer",
                color: "#2563eb",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="auth-submit-button"
            disabled={loading}
          >
            <span>
              {loading
                ? "Signing In..."
                : "Sign In"}
            </span>

            {!loading && (
              <span className="auth-arrow">
                →
              </span>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>ACCOUNT ACCESS</span>
        </div>

        <div className="auth-create-account">
          <p>
            Student and Warden accounts are created
            by the hostel administration.
          </p>
        </div>
      </>
    );
  };

  const renderForgotPasswordForm = () => {
    return (
      <>
        <div className="auth-heading">
          <h2>
            {forgotStep === 1 &&
              "Forgot Password"}

            {forgotStep === 2 &&
              "Verify OTP"}

            {forgotStep === 3 &&
              "Create New Password"}
          </h2>

          <p>
            {forgotStep === 1 &&
              "Enter your registered email or phone number."}

            {forgotStep === 2 &&
              "Enter the OTP sent to your registered contact details."}

            {forgotStep === 3 &&
              "Choose a new password for your HostelHub account."}
          </p>
        </div>

        {message && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#f1f5f9",
              color: "#334155",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {message}
          </div>
        )}

        {forgotStep === 1 && (
          <form
            onSubmit={handleSendOtp}
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="identifier">
                Email or Phone Number
              </label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  ✉️
                </span>

                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(
                      event.target.value
                    )
                  }
                  placeholder="Enter registered email or phone"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Sending OTP..."
                  : "Send OTP"}
              </span>

              {!loading && (
                <span className="auth-arrow">
                  →
                </span>
              )}
            </button>
          </form>
        )}

        {forgotStep === 2 && (
          <form
            onSubmit={handleVerifyOtp}
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="otp">
                6-Digit OTP
              </label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  🔑
                </span>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  placeholder="Enter OTP"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Verifying..."
                  : "Verify OTP"}
              </span>

              {!loading && (
                <span className="auth-arrow">
                  →
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setForgotStep(1);
                setOtp("");
                setMessage("");
              }}
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "10px",
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#2563eb",
                fontWeight: "600",
              }}
            >
              Send OTP Again
            </button>
          </form>
        )}

        {forgotStep === 3 && (
          <form
            onSubmit={handleResetPassword}
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="newPassword">
                New Password
              </label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  🔒
                </span>

                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  🔒
                </span>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
              disabled={loading}
            >
              <span>
                {loading
                  ? "Resetting Password..."
                  : "Reset Password"}
              </span>

              {!loading && (
                <span className="auth-arrow">
                  →
                </span>
              )}
            </button>
          </form>
        )}

        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
          }}
        >
          <button
            type="button"
            onClick={resetForgotPasswordForm}
            disabled={loading}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#2563eb",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            ← Back to Sign In
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="auth-page">
      {/* LEFT SIDE */}
      <section className="auth-visual">
        <div className="auth-visual-overlay"></div>

        <div className="auth-visual-content">
          <div className="auth-logo">
            H
          </div>

          <h1>HostelHub</h1>

          <h2>
            Hostel Management System
          </h2>

          <p>
            Everything you need to manage
            <br />
            your hostel life in one place.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              <p>
                Manage rooms and allocations
              </p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>
                Track fees and attendance
              </p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>
                Handle complaints and visitors
              </p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>
                Stay updated with hostel notices
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <div className="auth-mobile-logo">
              H
            </div>

            <div>
              <h1>HostelHub</h1>
              <p>
                Hostel Management System
              </p>
            </div>
          </div>

          {!forgotMode
            ? renderLoginForm()
            : renderForgotPasswordForm()}

          <div className="auth-security">
            <span>🔐</span>
            <span>
              Your account is securely protected
            </span>
          </div>

          <p className="auth-copyright">
            © 2026 HostelHub · Hostel Management System
          </p>
        </div>
      </section>
    </div>
  );
}

export default Login;