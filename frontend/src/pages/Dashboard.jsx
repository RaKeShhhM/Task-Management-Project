import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
        }}
      >
        <h2>Welcome, {user?.name} 👋</h2>
        <button onClick={logout} style={logoutButtonStyle}>
          Logout
        </button>
      </div>

      <p>
        This is your dashboard. Projects and tasks UI will go here in the
        next phase.
      </p>
    </div>
  );
};

const logoutButtonStyle = {
  padding: "8px 16px",
  backgroundColor: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

export default Dashboard;