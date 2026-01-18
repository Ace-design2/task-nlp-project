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
import { signOut } from "firebase/auth";

function LoginPage({ onLogin, darkMode }) {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subscribe, setSubscribe] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        await sendEmailVerification(userCredential.user);

        // STRICT MODE: Sign out immediately so they can't access the app
        await signOut(auth);

        setInfoMessage(
          "Verification link sent to " +
            email +
            ". Please check your inbox and verify before logging in.",
        );
        setIsSignUp(false); // Switch to login view
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );

        if (!userCredential.user.emailVerified) {
          await signOut(auth); // Kick them out
          setError(
            "Email not verified. Please check your inbox for the verification link.",
          );
          return;
        }
      }
      // onAuthStateChanged in App.js will handle the state update ONLY if we remain logged in
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
              {error.includes("not verified") && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      // To resend, we actually need the user to be signed in temporarily.
                      // This is tricky if we force signed them out.
                      // Simplified flow: Just ask them to check inbox.
                      // Or: Sign in -> Send -> Sign out.
                      // Let's keep it simple for now: Just message.
                      alert(
                        "If you can't find the email, try signing in again, or check Spam.",
                      );
                    } catch (e) {
                      console.error(e);
                    }
                  }}
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
