import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={navStyle}>
      <Link to={user ? "/dashboard" : "/login"} style={brandStyle}>
        <span style={logoIconStyle}>🗂️</span>
        <span>TeamBoard</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {user ? (
          <>
            <span style={{ color: "#374151", fontSize: "14px" }}>
              {user.name}
            </span>
            <button onClick={logout} style={logoutButtonStyle}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={navLinkStyle}>
              Login
            </Link>
            <Link to="/register" style={navLinkStyle}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

const navStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 24px",
  backgroundColor: "#fff",
  borderBottom: "1px solid #e5e7eb",
  position: "sticky",
  top: 0,
  zIndex: 10,
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "18px",
  fontWeight: "700",
  color: "#4f46e5",
  textDecoration: "none",
};

const logoIconStyle = {
  fontSize: "22px",
};

const navLinkStyle = {
  color: "#4f46e5",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "500",
};

const logoutButtonStyle = {
  padding: "6px 14px",
  backgroundColor: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "13px",
};

export default Navbar;