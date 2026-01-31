import React, { useState } from "react";
import VuesaxIcon from "./VuesaxIcon";
import { sendEmailVerification } from "firebase/auth";

const VerificationPending = ({ user, onSignOut, darkMode }) => {
  const [resendStatus, setResendStatus] = useState("");

  const handleResend = async () => {
    try {
      if (user) {
        await sendEmailVerification(user);
        setResendStatus("Sent! Check your inbox.");
      }
    } catch (e) {
      console.error(e);
      setResendStatus("Error sending email. Try again later.");
    }
  };

  return (
    <div className={`login-page-wrapper ${darkMode ? "dark-mode" : ""}`}>
      <div className="login-container">
        <div
          className="form-card"
          style={{ alignItems: "center", textAlign: "center" }}
        >
          <VuesaxIcon
            name="sms"
            variant="bold"
            darkMode={darkMode}
            style={{ width: 48, height: 48, marginBottom: "16px" }}
          />
          <h3
            className="form-header"
            style={{ fontSize: "20px", fontWeight: 700 }}
          >
            Check your Inbox
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: darkMode ? "#e0e0e0" : "#555",
              marginBottom: "24px",
            }}
          >
            We've sent a verification link to{" "}
            <span style={{ fontWeight: "bold" }}>{user?.email}</span>.
            <br />
            Please confirm it to access your account.
            <br />
            <span style={{ fontSize: "13px", opacity: 0.8 }}>
              (Check your spam/junk folder)
            </span>
          </p>

          <a
            href="mailto:"
            className="action-btn primary"
            style={{
              textDecoration: "none",
              display: "block",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            Open Mail App
          </a>

          <div style={{ marginTop: "16px", fontSize: "12px" }}>
            <button
              onClick={handleResend}
              style={{
                background: "none",
                border: "none",
                color: "#c1121f",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Resend Verification Email
            </button>
            {resendStatus && (
              <div style={{ color: "#00A231", marginTop: "4px" }}>
                {resendStatus}
              </div>
            )}
          </div>

          <button
            className="action-btn google"
            onClick={onSignOut}
            style={{ marginTop: "24px", width: "100%" }}
          >
            Back to Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
