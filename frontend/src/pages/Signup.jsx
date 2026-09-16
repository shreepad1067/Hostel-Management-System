import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (event) => {
    event.preventDefault();

    try {
      await api.post("/auth/register", {
        username: username,
        email: email,
        password: password,
        role: "Student",
      });

      alert("Signup successful! Please login.");

      navigate("/");
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
            Create your account and experience
            <br />
            smarter hostel management.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <span>✓</span>
              <p>Manage your hostel life easily</p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>Access rooms and fee information</p>
            </div>

            <div className="auth-feature">
              <span>✓</span>
              <p>Submit complaints and leave requests</p>
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
            <div className="auth-mobile-logo">
              H
            </div>

            <div>
              <h1>HostelHub</h1>
              <p>Hostel Management System</p>
            </div>
          </div>

          <div className="auth-heading">
            <h2>Create your account</h2>

            <p>
              Register as a student to get started.
            </p>
          </div>

          <form
            onSubmit={handleSignup}
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
                  placeholder="Choose a username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">
                Email Address
              </label>

              <div className="auth-input-wrapper">
                <span className="auth-input-icon">
                  ✉
                </span>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-button"
            >
              <span>Create Account</span>
              <span className="auth-arrow">→</span>
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <div className="auth-create-account">
            <p>
              Already have an account?
            </p>

            <Link to="/">
              Sign in
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

export default Signup;