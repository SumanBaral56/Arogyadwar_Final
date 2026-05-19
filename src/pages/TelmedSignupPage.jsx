// Force Webpack recompile
import { useMemo, useState, useRef, useEffect } from "react";
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { apiPostJson, buildSignupPayload } from "../api/authApi";
import "./TelmedSignupPage.css";

function PasswordStrength({ password }) {
  const score = useMemo(() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[a-z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return Math.min(4, s);
  }, [password]);

  const label =
    score === 0
      ? ""
      : score === 1
        ? "Weak"
        : score === 2
          ? "Fair"
          : score === 3
            ? "Good"
            : "Strong";

  const pct = (score / 4) * 100;
  const color =
    score <= 1
      ? "#ef4444"
      : score === 2
        ? "#f59e0b"
        : score === 3
          ? "#3b82f6"
          : "#22c55e";

  if (!label) return null;

  return (
    <div className="strength" aria-live="polite">
      <div className="strength-top">
        <span className="strength-label">Password strength</span>
        <span className="strength-value">{label}</span>
      </div>
      <div
        className="strength-bar"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={4}
      >
        <div
          className="strength-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(pw) {
  const minLen = 8;
  const hasLetter = /[A-Za-z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  if (pw.length < minLen) return "Password must be at least 8 characters.";
  if (!hasLetter || !hasNumber) {
    return "Use a mix of letters and numbers for a stronger password.";
  }
  if (!hasUpper || !hasLower) {
    return "Include both uppercase and lowercase letters.";
  }
  return "";
}

function normalizePhone(v) {
  return v.replace(/[^0-9]/g, "");
}

export default function TelmedSignupPage() {
  const [fullName, setFullName] = useState("");
  const [contactMethod, setContactMethod] = useState("email"); // email | phone

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showOTP, setShowOTP] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  
  const otpInputs = useRef([]);
  const redirectAfterOtpRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectAfterOtpRef.current) clearTimeout(redirectAfterOtpRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCountdown = (seconds) => {
    setCountdown(seconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

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
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    if (value && index < 5) otpInputs.current[index + 1]?.focus();
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
      setOtpValues(pastedData.split(""));
      otpInputs.current[5]?.focus();
    }
  };

  const otpComplete = otpValues.every(Boolean);

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    termsAccepted: false,
  });

  const fullNameError = useMemo(() => {
    if (!touched.fullName) return "";
    const v = fullName.trim();
    if (!v) return "Full name is required.";
    if (v.length < 2) return "Full name is too short.";
    return "";
  }, [fullName, touched.fullName]);

  const emailError = useMemo(() => {
    if (!touched.email) return "";
    if (contactMethod !== "email") return "";
    if (!email.trim()) return "Email address is required.";
    if (!validateEmail(email)) return "Enter a valid email address.";
    return "";
  }, [email, touched.email, contactMethod]);

  const phoneError = useMemo(() => {
    if (!touched.phone) return "";
    if (contactMethod !== "phone") return "";
    const digits = normalizePhone(phone);
    if (!digits) return "Phone number is required.";
    if (digits.length < 10) return "Enter a valid phone number.";
    return "";
  }, [phone, touched.phone, contactMethod]);

  const passwordError = useMemo(() => {
    if (!touched.password) return "";
    return validatePassword(password);
  }, [password, touched.password]);

  const confirmPasswordError = useMemo(() => {
    if (!touched.confirmPassword) return "";
    if (!confirmPassword) return "Please confirm your password.";
    if (confirmPassword !== password) return "Passwords do not match.";
    return "";
  }, [confirmPassword, password, touched.confirmPassword]);

  const termsError = useMemo(() => {
    if (!touched.termsAccepted) return "";
    return termsAccepted ? "" : "You must accept the Terms & Conditions.";
  }, [termsAccepted, touched.termsAccepted]);

  const isContactValid =
    contactMethod === "email"
      ? validateEmail(email)
      : normalizePhone(phone).length >= 10;

  const isFormValid =
    !!fullName.trim() &&
    isContactValid &&
    termsAccepted &&
    (contactMethod === "phone" || (!validatePassword(password) && confirmPassword === password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    setTouched({
      fullName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      termsAccepted: true,
    });

    if (!fullName.trim()) return setError("Full name is required.");

    if (contactMethod === "email") {
      if (!validateEmail(email))
        return setError("Enter a valid email address.");
    } else {
      const digits = normalizePhone(phone);
      if (digits.length < 10) return setError("Enter a valid phone number.");
    }

    if (contactMethod === "email") {
      const pwMsg = validatePassword(password);
      if (pwMsg) return setError(pwMsg);
      if (!confirmPassword || confirmPassword !== password) {
        return setError("Passwords do not match.");
      }
    }

    if (!termsAccepted) return setError("Please accept Terms & Conditions.");

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (contactMethod === "phone") {
        const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        window.mockGeneratedOtp = randomOtp;
        console.log("\n\n==================================");
        console.log(`📱 MOCK SMS RECEIVED: Your OTP is ${randomOtp}`);
        console.log("==================================\n\n");
        
        setOtpError("");
        setOtpSuccess(false);
        setOtpValues(["", "", "", "", "", ""]);
        setShowOTP(true);
        setSuccess(`[Mock SMS Received]: Your OTP is ${randomOtp}`);
        setTimeout(() => otpInputs.current[0]?.focus(), 0);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
        setSuccess("Account created! You can sign in now.");
      }
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // User is signed in.
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Google Sign-In failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpSubmitting(true);
    setOtpSuccess(false);

    const otp = otpValues.join("");

    try {
      if (window.mockGeneratedOtp) {
        if (otp === window.mockGeneratedOtp) {
          const mockEmail = `+91${phone}@mock-phone.com`;
          const mockPassword = "MockPhonePassword123!";
          const userCredential = await createUserWithEmailAndPassword(auth, mockEmail, mockPassword);
          await updateProfile(userCredential.user, { displayName: fullName });

          setOtpSubmitting(false);
          setOtpSuccess(true);
          setSuccess(""); // Clear the mock SMS message
          if (redirectAfterOtpRef.current) clearTimeout(redirectAfterOtpRef.current);
          redirectAfterOtpRef.current = setTimeout(() => {
            redirectAfterOtpRef.current = null;
            window.location.href = "/login";
          }, 900);
        } else {
          throw new Error("Invalid OTP code. Please try again.");
        }
      } else {
        setOtpError("No OTP session found. Please sign up again.");
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

  const handleResend = async () => {
    if (countdown > 0 || resendLoading) return;
    setOtpError("");
    setResendLoading(true);

    try {
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
        window.mockGeneratedOtp = randomOtp;
        console.log("\n\n==================================");
        console.log(`📱 MOCK SMS RESENT: Your OTP is ${randomOtp}`);
        console.log("==================================\n\n");
      setOtpValues(["", "", "", "", "", ""]);
      setSuccess(`[Mock SMS Received]: Your OTP is ${randomOtp}`);
      startCountdown(60);
      otpInputs.current[0]?.focus();
    } catch (err) {
      setOtpError(err.message || "Could not resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  const formErrorId = "signup-form-error";

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
        <h1 className="welcome-title">Create your account</h1>
      </div>

      <div className="container">
        <div className={`otp-card ${showOTP ? "active" : ""}`}>
          <div className="card-header">
            <button
              type="button"
              className="back-button"
              onClick={resetOtpStep}
              aria-label="Back to sign up"
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
            <h1>Verification</h1>
            <p>
              Enter the 6-digit code sent to{" "}
              <span className="delivery-target">
                {phone}
              </span>
            </p>
          </div>

          {otpError ? (
            <div className="validation-text validation-error" role="alert">
              {otpError}
            </div>
          ) : null}
          {otpSuccess ? (
            <div className="validation-text validation-success" role="status">
              Verified successfully! Redirecting...
            </div>
          ) : null}

          <form className="login-form" onSubmit={handleOtpSubmit}>
            <div className="form-group">
              <div className="otp-container">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
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
            </div>

            <div className="resend-container">
              <span>Didn&apos;t receive the code? </span>
              <button
                type="button"
                className="resend-button"
                onClick={handleResend}
                disabled={resendLoading || countdown > 0}
              >
                {resendLoading
                  ? "Resending..."
                  : countdown > 0
                    ? `Resend in ${countdown}s`
                    : "Resend"}
              </button>
            </div>

            <button
              type="submit"
              className={`login-button ${otpSubmitting ? "loading" : ""}`}
              disabled={otpSubmitting || !otpComplete}
            >
              <span>{otpSubmitting ? "Verifying..." : "Verify"}</span>
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
        </div>

        <div className={`auth-card ${!showOTP ? "active" : "hidden"}`}>
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
            <h1>Sign Up</h1>
            <p>
              Welcome to your healthcare portal. It takes less than a minute.
            </p>
          </div>

          {error ? (
            <div
              className="fp-alert fp-alert-error"
              role="alert"
              id={formErrorId}
            >
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="fp-alert fp-alert-success" role="status">
              {success}
            </div>
          ) : null}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
            aria-describedby={error ? formErrorId : undefined}
          >
            <div className="form-row">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M10 10c2.485 0 4.5-2.015 4.5-4.5S12.485 1 10 1 5.5 3.015 5.5 5.5 7.515 10 10 10Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.5 19c1.6-4.2 5-6 7.5-6s5.9 1.8 7.5 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                  required
                  aria-invalid={!!fullNameError}
                />
              </div>
              {fullNameError ? (
                <div className="validation-text validation-error" role="alert">
                  {fullNameError}
                </div>
              ) : null}
            </div>

            <div className="form-row">
              <label>Contact</label>

              <div
                className="contact-toggle"
                role="tablist"
                aria-label="Choose contact method"
              >
                <button
                  type="button"
                  className={`contact-tab ${contactMethod === "email" ? "active" : ""}`}
                  role="tab"
                  aria-selected={contactMethod === "email"}
                  tabIndex={contactMethod === "email" ? 0 : -1}
                  onClick={() => setContactMethod("email")}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={`contact-tab ${contactMethod === "phone" ? "active" : ""}`}
                  role="tab"
                  aria-selected={contactMethod === "phone"}
                  tabIndex={contactMethod === "phone" ? 0 : -1}
                  onClick={() => setContactMethod("phone")}
                >
                  Phone
                </button>
              </div>
            </div>

            {contactMethod === "email" ? (
              <div className="form-row">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
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
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    required
                    aria-invalid={!!emailError}
                  />
                </div>
                {emailError ? (
                  <div
                    className="validation-text validation-error"
                    role="alert"
                  >
                    {emailError}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="form-row">
                <label htmlFor="phone">Phone Number</label>
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
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="Enter your phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    required
                    aria-invalid={!!phoneError}
                  />
                </div>
                {phoneError ? (
                  <div
                    className="validation-text validation-error"
                    role="alert"
                  >
                    {phoneError}
                  </div>
                ) : null}
              </div>
            )}
            
            {contactMethod === "email" && (
              <>
            <div className="form-row">
              <label htmlFor="password">Create Password</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
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
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  required
                  autoComplete="new-password"
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={
                    showPassword ? "Hide passwords" : "Show passwords"
                  }
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
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
              {passwordError ? (
                <div className="validation-text validation-error" role="alert">
                  {passwordError}
                </div>
              ) : null}
              <PasswordStrength password={password} />
            </div>

            <div className="form-row">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
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
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, confirmPassword: true }))
                  }
                  required
                  autoComplete="new-password"
                  aria-invalid={!!confirmPasswordError}
                />
              </div>
              {confirmPasswordError ? (
                <div className="validation-text validation-error" role="alert">
                  {confirmPasswordError}
                </div>
              ) : null}
            </div>
              </>
            )}

            <div className="form-row">
              <label className="checkbox-wrapper" htmlFor="termsAccepted">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    setTouched((t) => ({ ...t, termsAccepted: true }));
                  }}
                />
                <span className="checkmark" aria-hidden="true" />
                <span>
                  I agree to the{" "}
                  <span style={{ color: "#0ea5e9" }}>
                    Terms &amp; Conditions
                  </span>
                  .
                </span>
              </label>
              {termsError ? (
                <div className="validation-text validation-error" role="alert">
                  {termsError}
                </div>
              ) : null}
            </div>

            <div className="auth-actions">
              <button
                type="submit"
                className={`login-button ${isLoading ? "loading" : ""}`}
                disabled={isLoading || !isFormValid}
              >
                <span>
                  {isLoading ? "Creating account..." : "Create Account"}
                </span>
                <svg
                  className="button-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7.5 15L12.5 10L7.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>
          
          <button type="button" className="google-btn" onClick={handleGoogleSignIn} disabled={isLoading}>
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            Sign up with Google
          </button>

          <div className="card-footer">
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  window.location.href = "/login";
                }}
              >
                Login
              </button>
            </p>
          </div>
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
