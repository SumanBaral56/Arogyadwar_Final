import { useEffect, useMemo, useRef, useState } from "react";
import "./TelmedLoginPage.css";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";




export default function ForgotPasswordFlow() {
  const [step, setStep] = useState(1); // 1: request, 2: verify, 3: reset
  const [method, setMethod] = useState("email"); // email only now

  const [recoveryValue, setRecoveryValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const validateStep1 = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryValue.trim())) {
      return "Enter a valid registered email address.";
    }
    return "";
  };



  const handleRequest = async (e) => {
    e.preventDefault();
    resetMessages();

    const msg = validateStep1();
    if (msg) {
      setError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, recoveryValue);
      setIsSubmitting(false);
      setStep(2);
      setSuccess("Password reset email sent successfully.");
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || "Failed to send reset email.");
    }

  };



  const backToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="app">
      <div className="ecg-container">
        <svg
          className="ecg-line"
          viewBox="0 0 1200 200"
          preserveAspectRatio="none"
        >
          <path
            className="ecg-path"
            d="M0,100 Q50,50 100,100 T200,100 T300,100 T400,100 T500,100 T600,100 T700,100 T800,100 T900,100 T1000,100 T1100,100 T1200,100"
          />
        </svg>
      </div>

      <div className="main-heading">
        <h1 className="welcome-title">Forgot Password?</h1>
      </div>

      <div className="container">
        <div className="otp-card active" style={{ position: "relative" }}>
          <div className="card-header" style={{ paddingTop: 6 }}>
            <div
              style={{
                width: "100%",
                position: "relative",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                className="back-button"
                onClick={backToLogin}
                aria-label="Back to login"
                style={{ position: "absolute", left: 0, top: 2 }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <div className="logo">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M24 14 L24 34 M14 24 L34 24"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>

            <p
              style={{
                margin: 0,
                color: "rgba(15, 23, 42, 0.65)",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Recover your account using your email.
            </p>
          </div>

          {error ? (
            <div className="fp-alert fp-alert-error" role="alert">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="fp-alert fp-alert-success" role="status">
              {success}
            </div>
          ) : null}

          {step === 1 ? (
            <form className="login-form" onSubmit={handleRequest}>
              <div className="form-group" style={{ gap: 10 }}>
                <label htmlFor="recovery">
                  Registered Email Address
                </label>
                <div className="input-wrapper">
                  <svg
                    className="input-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 6h16v12H4V6Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 8l8 6 8-6"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    id="recovery"
                    name="recovery"
                    placeholder="Enter your email"
                    value={recoveryValue}
                    onChange={(e) => setRecoveryValue(e.target.value)}
                    required
                    type="email"
                    autoComplete="email"
                    aria-describedby="recovery-help"
                  />
                </div>
                <small
                  id="recovery-help"
                  style={{ color: "rgba(15, 23, 42, 0.6)", fontWeight: 700 }}
                >
                  We’ll send a reset link to the registered email.
                </small>
              </div>

              <button
                type="submit"
                className={`login-button ${isSubmitting ? "loading" : ""}`}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? "Sending..." : "Continue"}</span>
              </button>

              <div className="card-footer">
                <p>
                  Back to login?{" "}
                  <button
                    type="button"
                    className="link-button"
                    onClick={backToLogin}
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          ) : null}

          {step === 2 ? (
              <div className="fp-step2">
                <div className="card-header" style={{ marginBottom: 12 }}>
                  <h1 style={{ margin: 0, fontSize: 22 }}>Reset Link</h1>
                  <p style={{ margin: 0 }}>
                    Check your email for a password reset link.
                  </p>
                </div>

                <div className="fp-note">
                  If you don’t see it, check your spam folder.
                </div>

                <button
                  type="button"
                  className="verify-button"
                  onClick={() => setStep(1)}
                  style={{ width: "100%" }}
                >
                  <span>Try Again</span>
                </button>

                <div className="card-footer">
                  <p>
                    Back to login?{" "}
                    <button
                      type="button"
                      className="link-button"
                      onClick={backToLogin}
                    >
                      Login
                    </button>
                  </p>
                </div>
              </div>
          ) : null}
        </div>
      </div>

      <style>{`
        .fp-alert{margin:0 0 12px 0;padding:12px 14px;border-radius:14px;font-weight:800;font-size:13px;}
        .fp-alert-error{background:rgba(239,68,68,0.12);color:#b91c1c;border:1px solid rgba(239,68,68,0.25)}
        .fp-alert-success{background:rgba(34,197,94,0.12);color:#15803d;border:1px solid rgba(34,197,94,0.25)}
        .fp-method{display:flex;gap:10px;flex-direction:column;margin-bottom:14px;}
        @media (min-width:520px){.fp-method{flex-direction:row}}
        .fp-method-item{display:flex;align-items:center;gap:10px;background:rgba(15,23,42,0.04);border:1px solid rgba(15,23,42,0.08);border-radius:14px;padding:12px 14px;cursor:pointer;user-select:none;}
        .fp-method-item input{width:18px;height:18px;}
        .fp-step2 .fp-note{margin:12px 0 16px 0;color:rgba(15,23,42,0.65);font-weight:800;}
        .fp-strength{margin-top:10px;}
        .fp-strength-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
        .fp-strength-label{color:rgba(15,23,42,0.65);font-weight:800;font-size:13px;}
        .fp-strength-value{font-weight:900;font-size:13px;}
        .fp-strength-bar{height:10px;border-radius:999px;background:rgba(15,23,42,0.08);overflow:hidden;}
        .fp-strength-bar-fill{height:100%;border-radius:999px;}
      `}</style>
      <div id="recaptcha-container"></div>

      <div className="developer-tag">
        <p>
          Developed by <span className="instadev">Instadev</span>
        </p>
      </div>
    </div>
  );
}
