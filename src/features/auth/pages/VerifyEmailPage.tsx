import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../../../services/api/client";
import { useAuth } from "../AuthContext";
import { AuthLayout } from "../components/AuthLayout";

const OTP_LENGTH = 6;

function useCountdown(targetIso: string | null) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!targetIso) {
      setSeconds(0);
      return;
    }
    function tick() {
      const diff = Math.max(
        0,
        Math.ceil((new Date(targetIso!).getTime() - Date.now()) / 1000),
      );
      setSeconds(diff);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return seconds;
}

export function VerifyEmailPage() {
  const { verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Email can come from navigation state or ?email= query param
  const stateEmail =
    (location.state as { email?: string } | null)?.email ?? null;
  const stateResendAvailableAt =
    (location.state as { resendAvailableAt?: string } | null)
      ?.resendAvailableAt ?? null;
  const email = stateEmail ?? searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendTarget, setResendTarget] = useState<string | null>(
    stateResendAvailableAt,
  );
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdown = useCountdown(resendTarget);

  const otp = digits.join("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(email, otp);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          setDigits((prev) => {
            const next = [...prev];
            next[index] = "";
            return next;
          });
        } else if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits],
  );

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < OTP_LENGTH; i++) {
        next[i] = pasted[i] ?? "";
      }
      return next;
    });
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  async function handleResend() {
    if (countdown > 0 || resending || !email) return;
    setResending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await resendOtp(email);
      // Set a 60-second cooldown after resend
      const next = new Date(Date.now() + 60_000).toISOString();
      setResendTarget(next);
      setSuccessMsg("A new code has been sent to your email.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to resend code.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      panelTitle="Verify your email to unlock the workspace."
      panelBody="Enter the six-digit code we sent. After verification, your private AI history stays with your account."
    >
      <div className="auth-card">
        <div className="auth-card__head">
          <h1 className="auth-card__title">Verify your email</h1>
          <p className="auth-card__subtitle">
            Enter the 6-digit code sent to{" "}
            {email ? (
              <strong className="auth-email-highlight">{email}</strong>
            ) : (
              "your email"
            )}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}
          {successMsg ? (
            <p className="auth-alert auth-alert--success">{successMsg}</p>
          ) : null}

          <div className="auth-otp-row" role="group" aria-label="One-time passcode">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                className="auth-otp-input"
                value={digit}
                aria-label={`Digit ${idx + 1}`}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={loading}
                autoFocus={idx === 0}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn--primary"
            disabled={loading || otp.length !== OTP_LENGTH}
          >
            {loading ? "Verifying…" : "Verify email"}
          </button>
        </form>

        <div className="auth-resend">
          <span className="auth-resend__text">Didn't receive the code?</span>
          <button
            type="button"
            className="auth-resend__btn"
            onClick={handleResend}
            disabled={countdown > 0 || resending || !email}
          >
            {resending
              ? "Sending…"
              : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend code"}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
