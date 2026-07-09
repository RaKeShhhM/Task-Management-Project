import { useState, useEffect } from "react";
import api from "../services/api";
import socket from "../services/socket";

// Simple "time ago" formatter — avoids pulling in a whole date library
// just for this one feature
const timeAgo = (dateString) => {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const ActivityFeed = ({ projectId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
    //   console.log(`Fetching activity logs for project: ${projectId}`);
      const res = await api.get(`/activity/project/${projectId}`);
    //   console.log(`Fetched activity logs for project: ${projectId}`, res.data);
      setLogs(res.data);
    } catch (err) {
      // TEMP DEBUG: log the real error instead of failing silently
      console.error("Activity fetch failed:", err.response?.status, err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  // Live updates: new entries appear at the top instantly as things happen
  useEffect(() => {
    const onActivityLogged = (entry) => {
      if (entry.project === projectId || entry.project?._id === projectId) {
        setLogs((prev) => [entry, ...prev]);
      }
    };

    socket.on("activityLogged", onActivityLogged);
    return () => socket.off("activityLogged", onActivityLogged);
  }, [projectId]);

  if (loading) return <p>Loading activity...</p>;

  if (logs.length === 0) {
    return <p style={{ color: "#6b7280" }}>No activity yet.</p>;
  }

  return (
    <div style={containerStyle}>
      {logs.map((log) => (
        <div key={log._id} style={logRowStyle}>
          <p style={{ margin: 0, fontSize: "13px" }}>
            <strong>{log.user?.name}</strong> {log.message}
          </p>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>
            {timeAgo(log.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
};

const containerStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "12px 16px",
  maxHeight: "400px",
  overflowY: "auto",
};

const logRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  borderBottom: "1px solid #f3f4f6",
};

export default ActivityFeed;