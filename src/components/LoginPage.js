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
  sendEmailVerification,
} from "../firebase";

function LoginPage({ onLogin, darkMode }) {
  // State for form fields
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    if (pwd.length < minLength)
      return "Password must be at least 8 characters long.";
    if (!hasUpperCase)
      return "Password must contain at least one uppercase letter.";
    if (!hasLowerCase)
      return "Password must contain at least one lowercase letter.";
    if (!hasNumbers) return "Password must contain at least one number.";
    if (!hasSpecialChar)
      return "Password must contain at least one special character.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    if (isSignUp) {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        // Send verification email
        await sendEmailVerification(userCredential.user);
        // App.js will detect !emailVerified and show VerificationPending.js
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // App.js will detect state change and handle routing
      }
    } catch (err) {
      console.error("Auth Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already in use. Please log in instead.");
      } else if (err.code === "auth/too-many-requests") {
        setError(
          "Too many attempts. Account temporarily locked to prevent brute-force. Try again later.",
        );
      } else if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.");
      } else {
        setError(err.message);
      }
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
            <span className="highlight-text">Astra to-do.</span>
          </div>

          {error && (
            <div
              style={{ color: "red", fontSize: "12px", marginBottom: "10px" }}
            >
              {error}
              {error.includes("not verified") && (
                <button
                  type="button"
                  onClick={() =>
                    alert("Please check your inbox and spam/junk folder.")
                  }
                  style={{
                    display: "block",
                    marginTop: "5px",
                    background: "none",
                    border: "none",
                    color: "inherit",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Trouble finding it?
                </button>
              )}
            </div>
          )}

          {infoMessage && (
            <div
              style={{
                color: "#00A231",
                fontSize: "12px",
                marginBottom: "10px",
              }}
            >
              {infoMessage}
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
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  color: "inherit",
                }}
              >
                <VuesaxIcon
                  name={showPassword ? "eye-slash" : "eye"}
                  variant="bold"
                  darkMode={darkMode}
                  style={{ width: 16, height: 16 }}
                />
              </button>
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
                      await sendPasswordResetEmail(auth, email);
                      alert(
                        "Password reset email sent! Check your inbox (and Spam folder).",
                      );
                    } catch (err) {
                      console.error("Password Reset Error:", err);
                      setError(err.message);
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#c1121f",
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
