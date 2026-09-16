import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        username: username,
        password: password,
      });

      localStorage.setItem("access_token", response.data.access_token);

      alert("Login successful!");

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      if (error.response) {
        alert(error.response.data.detail);
      } else {
        alert("Unable to connect to the backend.");
      }
    }
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

          <h2>Hostel Management System</h2>

          <p>
            Everything you need to manage
            <br />
            your hostel life in one place.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              <p>Manage rooms and allocations</p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>Track fees and attendance</p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>Handle complaints and visitors</p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>Stay updated with hostel notices</p>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="auth-form-section">
        <div className="auth-form-container">

          <div className="auth-mobile-brand">
            <div className="auth-mobile-logo">H</div>

            <div>
              <h1>HostelHub</h1>
              <p>Hostel Management System</p>
            </div>
          </div>

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

            <button
              type="submit"
              className="auth-submit-button"
            >
              <span>Sign In</span>
              <span className="auth-arrow">→</span>
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div className="auth-create-account">
            <p>
              Don't have an account?
            </p>

            <Link to="/signup">
              Create an account
            </Link>
          </div>

          <div className="auth-security">
            <span>🔐</span>
            <span>Your account is securely protected</span>
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