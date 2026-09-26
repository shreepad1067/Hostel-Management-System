import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./Login.css";


function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);

  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();


  const getErrorMessage = (error) => {
    if (!error.response) {
      return "Unable to connect to the backend.";
    }

    const detail =
      error.response.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map(
          (item) =>
            item.msg || "Validation error"
        )
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

    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setMessage("");
  };


  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);

    try {
      const response =
        await api.post(
          "/auth/login",
          {
            username,
            password,
          }
        );

      localStorage.setItem(
        "access_token",
        response.data.access_token
      );

      navigate("/dashboard");

    } catch (error) {
      alert(
        getErrorMessage(error)
      );

    } finally {
      setLoading(false);
    }
  };


  const handleSendOtp = async (event) => {
    event.preventDefault();

    if (!identifier.trim()) {
      setMessage(
        "Enter your registered email or phone number."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response =
        await api.post(
          "/auth/forgot-password",
          {
            identifier:
              identifier.trim(),
          }
        );

      setMessage(
        response.data?.message ||
          "OTP sent successfully."
      );

      setForgotStep(2);

    } catch (error) {
      setMessage(
        getErrorMessage(error)
      );

    } finally {
      setLoading(false);
    }
  };


  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (!otp.trim()) {
      setMessage(
        "Enter the OTP you received."
      );

      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await api.post(
        "/auth/verify-otp",
        {
          identifier:
            identifier.trim(),

          otp:
            otp.trim(),
        }
      );

      setMessage(
        "OTP verified successfully. Create your new password."
      );

      setForgotStep(3);

    } catch (error) {
      setMessage(
        getErrorMessage(error)
      );

    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword =
    async (event) => {
      event.preventDefault();

      if (newPassword.length < 8) {
        setMessage(
          "New password must contain at least 8 characters."
        );

        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        setMessage(
          "Passwords do not match."
        );

        return;
      }

      setLoading(true);
      setMessage("");

      try {
        await api.post(
          "/auth/reset-password",
          {
            identifier:
              identifier.trim(),

            otp:
              otp.trim(),

            new_password:
              newPassword,
          }
        );

        alert(
          "Password reset successfully. You can now sign in with your new password."
        );

        resetForgotPasswordForm();

        setPassword("");

      } catch (error) {
        setMessage(
          getErrorMessage(error)
        );

      } finally {
        setLoading(false);
      }
    };


  const openForgotPassword = () => {
    setForgotMode(true);
    setForgotStep(1);
    setMessage("");
  };


  const renderPasswordToggle = (
    visible,
    setter,
    label
  ) => {
    return (
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() =>
          setter(!visible)
        }
        aria-label={
          visible
            ? `Hide ${label}`
            : `Show ${label}`
        }
      >
        {visible ? "Hide" : "Show"}
      </button>
    );
  };


  const renderLoginForm = () => {
    return (
      <>
        <div className="auth-heading">
          <span className="auth-heading-label">
            SECURE ACCESS
          </span>

          <h2>Welcome back</h2>

          <p>
            Sign in to access your
            HostelHub account.
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
                ♙
              </span>

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </div>
          </div>


          <div className="auth-field">
            <div className="auth-field-heading">
              <label htmlFor="password">
                Password
              </label>

              <button
                type="button"
                className="auth-forgot-link"
                onClick={
                  openForgotPassword
                }
              >
                Forgot password?
              </button>
            </div>

            <div className="auth-input-wrapper auth-password-wrapper">
              <span className="auth-input-icon">
                ◇
              </span>

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              {renderPasswordToggle(
                showPassword,
                setShowPassword,
                "password"
              )}
            </div>
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


        <div className="auth-account-info">
          <div className="auth-account-info-icon">
            i
          </div>

          <p>
            Student and Warden accounts
            are securely created by the
            hostel administration.
          </p>
        </div>
      </>
    );
  };


  const renderForgotProgress = () => {
    return (
      <div className="auth-forgot-progress">
        <div
          className={
            forgotStep >= 1
              ? "auth-step active"
              : "auth-step"
          }
        >
          <span>1</span>
          <small>Account</small>
        </div>

        <div className="auth-step-line" />

        <div
          className={
            forgotStep >= 2
              ? "auth-step active"
              : "auth-step"
          }
        >
          <span>2</span>
          <small>Verify</small>
        </div>

        <div className="auth-step-line" />

        <div
          className={
            forgotStep >= 3
              ? "auth-step active"
              : "auth-step"
          }
        >
          <span>3</span>
          <small>Reset</small>
        </div>
      </div>
    );
  };


  const renderForgotPasswordForm = () => {
    return (
      <>
        <div className="auth-heading">
          <span className="auth-heading-label">
            ACCOUNT RECOVERY
          </span>

          <h2>
            {forgotStep === 1 &&
              "Forgot password"}

            {forgotStep === 2 &&
              "Verify your OTP"}

            {forgotStep === 3 &&
              "Create new password"}
          </h2>

          <p>
            {forgotStep === 1 &&
              "Enter your registered email address or phone number."}

            {forgotStep === 2 &&
              "Enter the 6-digit OTP sent to your registered contact details."}

            {forgotStep === 3 &&
              "Choose a secure new password for your HostelHub account."}
          </p>
        </div>


        {renderForgotProgress()}


        {message && (
          <div className="auth-message">
            <span className="auth-message-icon">
              i
            </span>

            <span>{message}</span>
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
                  @
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

              <div className="auth-input-wrapper auth-otp-wrapper">
                <span className="auth-input-icon">
                  #
                </span>

                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          6
                        )
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
              className="auth-secondary-action"
              onClick={() => {
                setForgotStep(1);
                setOtp("");
                setMessage("");
              }}
              disabled={loading}
            >
              Send OTP Again
            </button>
          </form>
        )}


        {forgotStep === 3 && (
          <form
            onSubmit={
              handleResetPassword
            }
            className="auth-form"
          >
            <div className="auth-field">
              <label htmlFor="newPassword">
                New Password
              </label>

              <div className="auth-input-wrapper auth-password-wrapper">
                <span className="auth-input-icon">
                  ◇
                </span>

                <input
                  id="newPassword"
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(event) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                />

                {renderPasswordToggle(
                  showNewPassword,
                  setShowNewPassword,
                  "new password"
                )}
              </div>
            </div>


            <div className="auth-field">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="auth-input-wrapper auth-password-wrapper">
                <span className="auth-input-icon">
                  ◇
                </span>

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  required
                />

                {renderPasswordToggle(
                  showConfirmPassword,
                  setShowConfirmPassword,
                  "confirmed password"
                )}
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


        <button
          type="button"
          className="auth-back-button"
          onClick={
            resetForgotPasswordForm
          }
          disabled={loading}
        >
          <span>←</span>
          Back to Sign In
        </button>
      </>
    );
  };


  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="auth-visual-overlay" />

        <div className="auth-visual-glow auth-glow-one" />
        <div className="auth-visual-glow auth-glow-two" />


        <div className="auth-visual-content">
          <div className="auth-brand">
            <div className="auth-logo">
              H
            </div>

            <div className="auth-brand-text">
              <strong>
                HostelHub
              </strong>

              <span>
                Smart Hostel Management
              </span>
            </div>
          </div>


          <div className="auth-hero-content">
            <span className="auth-hero-badge">
              MODERN HOSTEL OPERATIONS
            </span>

            <h1>
              Your hostel.
              <br />
              Smarter.
              <br />
              Connected.
            </h1>

            <p>
              One secure platform for
              students, wardens and
              administrators to manage
              everyday hostel operations.
            </p>
          </div>


          <div className="auth-feature-grid">
            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                ⌂
              </div>

              <div>
                <strong>
                  Rooms
                </strong>

                <span>
                  Smart allocation
                </span>
              </div>
            </div>


            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                ✓
              </div>

              <div>
                <strong>
                  Attendance
                </strong>

                <span>
                  Easy tracking
                </span>
              </div>
            </div>


            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                ⚠
              </div>

              <div>
                <strong>
                  Safety
                </strong>

                <span>
                  SOS assistance
                </span>
              </div>
            </div>


            <div className="auth-feature-card">
              <div className="auth-feature-icon">
                ✦
              </div>

              <div>
                <strong>
                  AI Tools
                </strong>

                <span>
                  Smart assistance
                </span>
              </div>
            </div>
          </div>


          <div className="auth-visual-footer">
            <span className="auth-live-dot" />

            Secure hostel management,
            available anytime.
          </div>
        </div>
      </section>


      <section className="auth-form-section">
        <div className="auth-form-bg-circle auth-circle-one" />
        <div className="auth-form-bg-circle auth-circle-two" />


        <div className="auth-form-container">
          <div className="auth-mobile-brand">
            <div className="auth-mobile-logo">
              H
            </div>

            <div>
              <h1>
                HostelHub
              </h1>

              <p>
                Hostel Management System
              </p>
            </div>
          </div>


          <div className="auth-form-card">
            {!forgotMode
              ? renderLoginForm()
              : renderForgotPasswordForm()}
          </div>


          <div className="auth-security">
            <span>
              ◈
            </span>

            <span>
              Secure account access
            </span>

            <span className="auth-security-dot">
              •
            </span>

            <span>
              HostelHub
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
