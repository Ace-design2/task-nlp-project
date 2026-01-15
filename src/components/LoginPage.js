import React, { useState } from "react";
import "./LoginPage.css";
import VuesaxIcon from "./VuesaxIcon";
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  sendPasswordResetEmail,
} from "../firebase";

function LoginPage({ onLogin, darkMode }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // onAuthStateChanged in App.js will handle the state update
    } catch (err) {
      console.error("Auth Error:", err);
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google Auth Error:", err);
      setError(err.message);
    }
  };

  return (
    <div className={`login-page-wrapper ${darkMode ? "dark-mode" : ""}`}>
      <div className="login-container">
        {/* Toggle Row */}
        <div className="login-toggle-row">
          <button
            className={`toggle-btn ${isSignUp ? "active" : "inactive"}`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
          <button
            className={`toggle-btn ${!isSignUp ? "active" : "inactive"}`}
            onClick={() => setIsSignUp(false)}
          >
            Log in
          </button>
        </div>

        {/* Form Card */}
        <div className="form-card">
          <div className="form-header">
            <span style={{ fontWeight: 700 }}>
              {isSignUp
                ? "Sign up to continue with"
                : "Log in to continue with"}
            </span>{" "}
            <span className="highlight-text">Task-NLP.app.</span>
          </div>

          {error && (
            <div
              style={{ color: "red", fontSize: "12px", marginBottom: "10px" }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div className="input-group">
              <VuesaxIcon
                name="sms"
                variant="bold"
                darkMode={darkMode}
                style={{ width: 16, height: 16 }}
              />
              <input
                type="email"
                placeholder="Email Address"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <VuesaxIcon
                name="lock"
                variant="bold"
                darkMode={darkMode}
                style={{ width: 16, height: 16 }}
              />
              <input
                type="password"
                placeholder="Password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isSignUp && (
              <div style={{ textAlign: "right", marginTop: "-10px" }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      setError("Please enter your email first.");
                      return;
                    }
                    try {
                      console.log("Attempting to send reset email to:", email);
                      await sendPasswordResetEmail(auth, email);
                      console.log("Reset email sent successfully.");
                      alert(
                        "Password reset email sent! Check your inbox (and Spam folder)."
                      );
                    } catch (err) {
                      console.error("Password Reset Error:", err);
                      setError(err.message);
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4B8BFF",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {isSignUp && (
              <label className="subscribe-group">
                <input
                  type="checkbox"
                  className="subscribe-checkbox"
                  checked={subscribe}
                  onChange={(e) => setSubscribe(e.target.checked)}
                />
                Subscribe to optional updates
              </label>
            )}

            <button type="submit" className="action-btn primary">
              {isSignUp ? "Sign Up" : "Log In"}
            </button>

            <button
              type="button"
              className="action-btn google"
              onClick={handleGoogleLogin}
            >
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
