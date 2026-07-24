import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateField = (fieldName, val) => {
    let errorMsg = "";
    if (fieldName === "name") {
      if (!val.trim()) {
        errorMsg = "Name is required";
      }
    } else if (fieldName === "email") {
      if (!val.trim()) {
        errorMsg = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(val)) {
        errorMsg = "Please enter a valid email address";
      }
    } else if (fieldName === "password") {
      if (!val) {
        errorMsg = "Password is required";
      } else if (val.length < 6) {
        errorMsg = "Password must be at least 6 characters long";
      }
    }
    return errorMsg;
  };

  const handleBlur = (fieldName, val) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    setFieldErrors((prev) => ({ ...prev, [fieldName]: validateField(fieldName, val) }));
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (touched.name) {
      setFieldErrors((prev) => ({ ...prev, name: validateField("name", val) }));
    }
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setFieldErrors((prev) => ({ ...prev, email: validateField("email", val) }));
    }
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setFieldErrors((prev) => ({ ...prev, password: validateField("password", val) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate all fields
    const nameErr = validateField("name", name);
    const emailErr = validateField("email", email);
    const passwordErr = validateField("password", password);

    if (nameErr || emailErr || passwordErr) {
      setFieldErrors({ name: nameErr, email: emailErr, password: passwordErr });
      setTouched({ name: true, email: true, password: true });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err) {
      const serverError = err.response?.data;
      if (serverError?.errors) {
        const newFieldErrors = {};
        serverError.errors.forEach((e) => {
          newFieldErrors[e.field] = e.message;
        });
        setFieldErrors(newFieldErrors);
      } else if (serverError?.message) {
        const msg = serverError.message;
        if (
          msg.toLowerCase().includes("email") ||
          msg.toLowerCase().includes("user already exists")
        ) {
          setFieldErrors({ email: msg });
          setTouched((prev) => ({ ...prev, email: true }));
        } else if (msg.toLowerCase().includes("password")) {
          setFieldErrors({ password: msg });
          setTouched((prev) => ({ ...prev, password: true }));
        } else if (msg.toLowerCase().includes("name")) {
          setFieldErrors({ name: msg });
          setTouched((prev) => ({ ...prev, name: true }));
        } else {
          setError(msg);
        }
      } else {
        setError("Registration failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = Object.values(fieldErrors).some(Boolean);

  const getInputClass = (fieldName) => {
    const isInvalid = touched[fieldName] && fieldErrors[fieldName];
    return `block w-full rounded-md border px-3 py-2.5 font-body text-sm transition-all duration-200 focus:outline-none focus:ring-1 ${
      isInvalid
        ? "border-danger focus:border-danger focus:ring-danger focus-visible:outline-danger"
        : "border-border dark:border-slate-700 focus:border-teal focus:ring-teal"
    }`;
  };

  return (
    <div className="mx-auto mt-12 max-w-[400px] px-4 sm:mt-20">
      <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-6 shadow-card sm:p-8">
        <h2 className="mb-5 font-heading text-xl">Create an Account</h2>

        {error && (
          <p className="mb-2.5 text-sm text-danger animate-fade-slide-up">{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={handleNameChange}
              onBlur={() => handleBlur("name", name)}
              required
              className={getInputClass("name")}
            />
            {touched.name && fieldErrors.name && (
              <p className="mt-1 text-xs text-danger font-medium animate-fade-slide-up">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div className="mb-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => handleBlur("email", email)}
              required
              className={getInputClass("email")}
            />
            {touched.email && fieldErrors.email && (
              <p className="mt-1 text-xs text-danger font-medium animate-fade-slide-up">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur("password", password)}
              required
              className={getInputClass("password")}
            />
            {touched.password && fieldErrors.password && (
              <p className="mt-1 text-xs text-danger font-medium animate-fade-slide-up">
                {fieldErrors.password}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || hasErrors}
            className="w-full rounded-md bg-teal py-2.5 font-body font-semibold text-white hover:bg-teal-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating Account..." : "Register"}
          </button>
        </form>

        <p className="mt-4 text-sm text-ink-muted dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-teal">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;