import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="mx-auto mt-12 max-w-[400px] px-4 sm:mt-20">
      <div className="rounded-md border border-border bg-surface p-6 shadow-card sm:p-8">
        <h2 className="mb-5 font-heading text-xl">Login</h2>

        {error && <p className="mb-2.5 text-sm text-danger">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-3 block w-full rounded-md border border-border px-3 py-2.5 font-body text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mb-3 block w-full rounded-md border border-border px-3 py-2.5 font-body text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-teal py-2.5 font-body font-semibold text-white hover:bg-teal-dark"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-sm text-ink-muted">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-teal">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;