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

import ParticleSwarm from "./ParticleSwarm";

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
      {/* Background Particles */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
         <ParticleSwarm darkMode={darkMode} />
      </div>

      <div className="login-container" style={{ position: "relative", zIndex: 1 }}>
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
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84c.87-2.6 3.3-4.5 6.16-4.5z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
