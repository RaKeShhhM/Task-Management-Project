import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./Avatar";

// SVG fill values can't read Tailwind classes, so these stay as raw hex —
// they're kept in sync with tailwind.config.js's status.* colors by hand.
const ROUTE_COLORS = { todo: "#94A3B8", progress: "#F59E0B", done: "#16A34A" };

// The logomark is three dots on a line — the same "route" motif used on the
// Kanban board (ToDo → InProgress → Done). The brand mark and the product's
// core visual idea are the same shape, not two unrelated decorations.
const RouteMark = () => (
  <svg width="34" height="14" viewBox="0 0 34 14" fill="none" className="shrink-0">
    <line x1="3" y1="7" x2="31" y2="7" stroke="#94A3B8" strokeWidth="1.5" />
    <circle cx="3" cy="7" r="3" fill={ROUTE_COLORS.todo} />
    <circle cx="17" cy="7" r="3" fill={ROUTE_COLORS.progress} />
    <circle cx="31" cy="7" r="3" fill={ROUTE_COLORS.done} />
  </svg>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between bg-navy px-4 py-3 sm:px-7">
      <Link to={user ? "/dashboard" : "/login"} className="flex items-center gap-2.5 no-underline">
        <RouteMark />
        <span className="font-heading text-lg font-bold tracking-tight text-white sm:text-[19px]">
          TeamBoard
        </span>
      </Link>

      <div className="flex items-center gap-3 sm:gap-[18px]">
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="rounded-md border border-white/25 px-2.5 py-1.5 text-sm text-white/85 hover:bg-white/10"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {user ? (
          <>
            <Avatar name={user.name} size="sm" />
            {/* Name hidden on very small screens to save space — logout stays reachable */}
            <span className="hidden font-body text-sm text-white/75 sm:inline">
              {user.name}
            </span>
            <button
              onClick={logout}
              className="rounded-md border border-white/25 bg-transparent px-3 py-1.5 font-body text-[13px] text-white/85 hover:bg-white/10"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="font-body text-sm font-medium text-white/85 no-underline hover:text-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-teal px-4 py-2 font-body text-sm font-semibold text-navy no-underline hover:bg-teal-dark"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;