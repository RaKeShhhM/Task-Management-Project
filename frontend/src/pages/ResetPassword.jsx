import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password. Please request a new link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-[400px] px-4 sm:mt-20">
      <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-6 shadow-card sm:p-8">
        <h2 className="mb-2 font-heading text-xl">Choose a new password</h2>
        <p className="mb-5 text-sm text-ink-muted dark:text-slate-400">
          Your reset link is valid for one hour and can only be used once.
        </p>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mb-3 block w-full rounded-md border border-border px-3 py-2.5 font-body text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal dark:border-slate-700"
            required
          />

          <label className="mb-1 block text-sm font-medium" htmlFor="confirm-password">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="mb-4 block w-full rounded-md border border-border px-3 py-2.5 font-body text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal dark:border-slate-700"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-teal py-2.5 font-body font-semibold text-white transition-all duration-200 hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Resetting password..." : "Reset password"}
          </button>
        </form>

        <p className="mt-4 text-sm text-ink-muted dark:text-slate-400">
          <Link to="/login" className="font-medium text-teal">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
