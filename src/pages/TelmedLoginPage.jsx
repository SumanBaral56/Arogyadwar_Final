import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import {
  apiPostJson,
  buildLoginPayload,
} from "../api/authApi";
import "./TelmedLoginPage.css";

const formatPhone = (value) => value.replace(/[^0-9]/g, "");

function validateLoginIdentifier(method, raw) {
  if (method === "email") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
      return "Enter a valid email address.";
    }
  } else {
    if (formatPhone(raw).length < 10) {
      return "Enter a valid phone number (at least 10 digits).";
    }
  }
  return "";
}

// Note: this page includes the Forgot Password UI with OTP verification.

export default function TelmedLoginPage() {
  const navigate = useNavigate();
  const [showOTP, setShowOTP] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginIdMethod, setLoginIdMethod] = useState("email");
  const [identifier, setIdentifier] = useState("");
  const [loginIdError, setLoginIdError] = useState("");
  const [otpDelivery, setOtpDelivery] = useState("email");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [loginFormError, setLoginFormError] = useState("");
  const otpInputs = useRef([]);
  const loginChallengeTokenRef = useRef("");
  const redirectAfterOtpRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectAfterOtpRef.current) {
        clearTimeout(redirectAfterOtpRef.current);
      }
    };
  }, []);

  const resetOtpStep = () => {
    if (redirectAfterOtpRef.current) {
      clearTimeout(redirectAfterOtpRef.current);
      redirectAfterOtpRef.current = null;
    }
    setShowOTP(false);
    setOtpValues(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpSuccess(false);
    setOtpSubmitting(false);
    setLoginFormError("");
    loginChallengeTokenRef.current = "";
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);

    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const newOtpValues = [...otpValues];
      newOtpValues[index - 1] = "";
      setOtpValues(newOtpValues);
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpValues(digits);
      otpInputs.current[5]?.focus();
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const msg = validateLoginIdentifier(loginIdMethod, identifier);
    if (msg) {
      setLoginIdError(msg);
      return;
    }
    setLoginIdError("");
    setLoginFormError("");

    setLoginSubmitting(true);

    const formData = new FormData(e.target);
    const password = String(formData.get("password") || "");

    try {
      if (loginIdMethod === "email") {
        if (!password) {
          setLoginFormError("Password is required for Email login.");
          setLoginSubmitting(false);
          return;
        }
        const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("user", JSON.stringify(userCredential.user));
        navigate("/", { replace: true });
        return;
      } else if (loginIdMethod === "phone") {
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        window.mockGeneratedOtp = randomOtp;
        console.log("\n\n==================================");
        console.log(`📱 MOCK SMS RECEIVED: Your OTP is ${randomOtp}`);
        console.log("==================================\n\n");

        setOtpDelivery("phone");
        setOtpError("");
        setOtpSuccess(false);
        setOtpValues(["", "", "", "", "", ""]);
        setShowOTP(true);
        setLoginFormError(`[Mock SMS Received]: Your OTP is ${randomOtp}`); // Displaying the OTP message
        setTimeout(() => otpInputs.current[0]?.focus(), 0);
      }
    } catch (err) {
      setLoginFormError(err.message || "Sign in failed.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(result.user));
      navigate("/", { replace: true });
    } catch (err) {
      setLoginFormError(err.message || "Google Sign-In failed.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");

    const otp = otpValues.join("");
    if (otp.length !== 6) {
      otpInputs.current.forEach((input) => {
        if (input) {
          input.classList.add("shake");
          setTimeout(() => input.classList.remove("shake"), 500);
        }
      });
      return;
    }

    setOtpSubmitting(true);
    setOtpSuccess(false);

    try {
      if (window.mockGeneratedOtp) {
        if (otp === window.mockGeneratedOtp) {
          const mockEmail = `+91${identifier}@mock-phone.com`;
          const mockPassword = "MockPhonePassword123!";
          let userCredential;
          
          try {
            userCredential = await signInWithEmailAndPassword(auth, mockEmail, mockPassword);
          } catch (signInErr) {
            if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/user-not-found') {
              // If the user hasn't signed up yet, automatically create the mock account
              userCredential = await createUserWithEmailAndPassword(auth, mockEmail, mockPassword);
            } else {
              throw signInErr;
            }
          }

          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem("user", JSON.stringify(userCredential.user));

          setOtpSubmitting(false);
          setOtpSuccess(true);
          setLoginFormError(""); // clear the mock SMS banner
          if (redirectAfterOtpRef.current) {
            clearTimeout(redirectAfterOtpRef.current);
          }
          redirectAfterOtpRef.current = setTimeout(() => {
            redirectAfterOtpRef.current = null;
            navigate("/", { replace: true });
          }, 900);
        } else {
          throw new Error("Invalid OTP code. Please try again.");
        }
      } else {
        setOtpError("No OTP session found. Please sign in again.");
        setOtpSubmitting(false);
      }
    } catch (err) {
      setOtpSubmitting(false);
      setOtpError(err.message || "That code didn't work. Try again.");
      otpInputs.current.forEach((input) => {
        if (input) {
          input.classList.add("shake");
          setTimeout(() => input.classList.remove("shake"), 500);
        }
      });
    }
  };

  const handleResendOtp = async () => {
    if (!loginChallengeTokenRef.current) {
      setOtpError("Sign in again to request a new code.");
      return;
    }

    setIsResending(true);
    setOtpError("");

    try {
      if (loginIdMethod === "phone" && identifier) {
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        window.mockGeneratedOtp = randomOtp;
        console.log("\n\n==================================");
        console.log(`📱 MOCK SMS RESENT: Your OTP is ${randomOtp}`);
        console.log("==================================\n\n");
        setOtpValues(["", "", "", "", "", ""]);
        setLoginFormError(`[Mock SMS Received]: Your OTP is ${randomOtp}`);
        otpInputs.current[0]?.focus();
      }
    } catch (err) {
      setOtpError(err.message || "Could not resend code.");
    } finally {
      setIsResending(false);
    }
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
        <h1 className="welcome-title">Telemedicine Login</h1>
      </div>

      <div className="container">
        <div className={`login-card ${showOTP ? "hidden" : ""}`}>
          <div className="card-header">
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
            <h1>Welcome Back</h1>
            <p>Sign in to access your healthcare portal</p>
          </div>

          {loginFormError ? (
            <div className="telmed-alert telmed-alert-error" role="alert">
              {loginFormError}
            </div>
          ) : null}

          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div
              className="telmed-login-method"
              role="radiogroup"
              aria-label="Sign in with"
            >
              <label className="telmed-login-method-item">
                <input
                  type="radio"
                  name="loginIdMethod"
                  value="email"
                  checked={loginIdMethod === "email"}
                  onChange={() => {
                    setLoginIdMethod("email");
                    setIdentifier("");
                    setLoginIdError("");
                    setLoginFormError("");
                  }}
                />
                <span>Email</span>
              </label>
              <label className="telmed-login-method-item">
                <input
                  type="radio"
                  name="loginIdMethod"
                  value="phone"
                  checked={loginIdMethod === "phone"}
                  onChange={() => {
                    setLoginIdMethod("phone");
                    setIdentifier("");
                    setLoginIdError("");
                    setLoginFormError("");
                  }}
                />
                <span>Phone number</span>
              </label>
            </div>

            <div className="form-group">
              <label htmlFor="login-identifier">
                {loginIdMethod === "email"
                  ? "Email address"
                  : "Phone number"}
              </label>
              <div className="input-wrapper">
                {loginIdMethod === "email" ? (
                  <svg
                    className="input-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2.5 6.66667L10 11.6667L17.5 6.66667M3.33333 15H16.6667C17.5871 15 18.3333 14.2538 18.3333 13.3333V6.66667C18.3333 5.74619 17.5871 5 16.6667 5H3.33333C2.41286 5 1.66667 5.74619 1.66667 6.66667V13.3333C1.66667 14.2538 2.41286 15 3.33333 15Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    className="input-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M13.3333 1.66667H6.66667C5.74619 1.66667 5 2.41286 5 3.33333V16.6667C5 17.5871 5.74619 18.3333 6.66667 18.3333H13.3333C14.2538 18.3333 15 17.5871 15 16.6667V3.33333C15 2.41286 14.2538 1.66667 13.3333 1.66667Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.33333 14.1667H11.6667"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                <input
                  id="login-identifier"
                  name="identifier"
                  type={loginIdMethod === "email" ? "email" : "tel"}
                  inputMode={loginIdMethod === "phone" ? "numeric" : undefined}
                  autoComplete={
                    loginIdMethod === "email" ? "email" : "tel-national"
                  }
                  placeholder={
                    loginIdMethod === "email"
                      ? "Enter your email"
                      : "Enter your phone number"
                  }
                  value={identifier}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    setIdentifier(
                      loginIdMethod === "phone" ? formatPhone(v) : v,
                    );
                    if (loginIdError) setLoginIdError("");
                    if (loginFormError) setLoginFormError("");
                  }}
                  aria-invalid={Boolean(loginIdError)}
                  aria-describedby={
                    loginIdError ? "login-identifier-error" : undefined
                  }
                  required
                />
              </div>
              {loginIdError ? (
                <p
                  id="login-identifier-error"
                  className="telmed-field-error"
                  role="alert"
                >
                  {loginIdError}
                </p>
              ) : null}
            </div>

            {loginIdMethod === "email" && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M15.8333 9.16667H4.16667C3.24619 9.16667 2.5 9.91286 2.5 10.8333V16.6667C2.5 17.5871 3.24619 18.3333 4.16667 18.3333H15.8333C16.7538 18.3333 17.5 17.5871 17.5 16.6667V10.8333C17.5 9.91286 16.7538 9.16667 15.8333 9.16667Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.83333 9.16667V5.83333C5.83333 4.72876 6.27232 3.66895 7.05372 2.88755C7.83512 2.10615 8.89493 1.66667 9.99999 1.66667C11.1051 1.66667 12.1649 2.10615 12.9463 2.88755C13.7277 3.66895 14.1667 4.72876 14.1667 5.83333V9.16667"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M1.66667 10C1.66667 10 4.16667 4.16667 10 4.16667C15.8333 4.16667 18.3333 10 18.3333 10C18.3333 10 15.8333 15.8333 10 15.8333C4.16667 15.8333 1.66667 10 1.66667 10Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r="2.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            )}

            <div className="form-options">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              <button
                type="button"
                className="forgot-password"
                onClick={() => {
                  window.location.href = "/forgot-password";
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className={`login-button ${loginSubmitting ? "loading" : ""}`}
              disabled={loginSubmitting}
            >
              <span>{loginSubmitting ? "Signing in..." : "Sign In"}</span>
              <svg
                className="button-icon"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M4.16667 10H15.8333M15.8333 10L10.8333 5M15.8333 10L10.8333 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>
          
          <button type="button" className="google-btn" onClick={handleGoogleSignIn} disabled={loginSubmitting}>
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Sign in with Google
          </button>

          <div className="card-footer">
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  window.location.href = "/signup";
                }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        <div className={`otp-card ${showOTP ? "active" : ""}`}>
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
                onClick={resetOtpStep}
                aria-label="Back"
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
              {otpDelivery === "email"
                ? "We've sent a verification code to your email."
                : "We've sent a verification code to your phone."}
            </p>
          </div>

          {otpError ? (
            <div className="telmed-alert telmed-alert-error" role="alert">
              {otpError}
            </div>
          ) : null}
          {otpSuccess ? (
            <div className="telmed-alert telmed-alert-success" role="status">
              Verified. Redirecting you to the portal…
            </div>
          ) : null}

          <form className="login-form" onSubmit={handleOtpSubmit}>
            <div className="form-group" style={{ gap: 10 }}>
              <label htmlFor="telmed-otp-0">6-digit verification code</label>
              <div className="otp-container">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    id={index === 0 ? "telmed-otp-0" : undefined}
                    ref={(el) => (otpInputs.current[index] = el)}
                    type="text"
                    className="otp-input"
                    value={otpValues[index]}
                    maxLength="1"
                    autoComplete="off"
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) e.preventDefault();
                    }}
                    required
                    inputMode="numeric"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
              <small
                style={{
                  color: "rgba(15, 23, 42, 0.6)",
                  fontWeight: 700,
                }}
              >
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isResending}
                  className="link-button"
                  style={{ display: "inline", verticalAlign: "baseline" }}
                >
                  {isResending ? "Sending..." : "Resend"}
                </button>
              </small>
            </div>

            <button
              type="submit"
              className={`login-button ${otpSubmitting ? "loading" : ""}`}
              disabled={
                otpSubmitting ||
                otpSuccess ||
                otpValues.some((v) => !v)
              }
            >
              <span>
                {otpSuccess
                  ? "Success"
                  : otpSubmitting
                    ? "Verifying..."
                    : "Verify"}
              </span>
            </button>

            <div className="card-footer">
              <p>
                Back to sign in?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={resetOtpStep}
                  disabled={otpSuccess}
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>

      <div className="developer-tag">
        <p>
          Developed by <span className="instadev">Instadev</span>
        </p>
      </div>
    </div>
  );
}
