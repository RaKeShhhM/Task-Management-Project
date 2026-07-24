import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProjectBoard from "./pages/ProjectBoard";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* min-h-screen + flex column keeps the footer pinned to the bottom
            even on pages with little content, instead of floating mid-page */}
        <div className="flex min-h-screen flex-col bg-fog dark:bg-slate-950">
          <Navbar />

          <main className="flex-1">
            {/* Navbar/Footer stay visible even if a page below crashes —
                only the broken page content gets replaced by the fallback */}
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:id"
                  element={
                    <ProtectedRoute>
                      <ProjectBoard />
                    </ProtectedRoute>
                  }
                />
                {/* Redirect root to dashboard (ProtectedRoute will bounce to /login if not authed) */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                {/* Fallback route for non-existent paths */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;