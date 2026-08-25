import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/users/forgot-password", { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to request a password reset. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-[400px] px-4 sm:mt-20">
      <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-6 shadow-card sm:p-8">
        <h2 className="mb-2 font-heading text-xl">Reset your password</h2>
        <p className="mb-5 text-sm text-ink-muted dark:text-slate-400">
          Enter your email and we&apos;ll send a one-hour reset link if an account exists.
        </p>

        {error && <p className="mb-3 text-sm text-danger">{error}</p>}
        {message && <p className="mb-3 text-sm text-teal">{message}</p>}

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mb-4 block w-full rounded-md border border-border px-3 py-2.5 font-body text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal dark:border-slate-700"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-teal py-2.5 font-body font-semibold text-white transition-all duration-200 hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-4 text-sm text-ink-muted dark:text-slate-400">
          Remember your password? <Link to="/login" className="font-medium text-teal">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
