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
      const res = await api.get(`/activity/project/${projectId}`);
      setLogs(res.data);
    } catch (err) {
      // fail quietly — activity feed is supplementary, not core functionality
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

  if (loading) return <p className="text-sm text-ink-muted dark:text-slate-400">Loading activity...</p>;

  if (logs.length === 0) {
    return <p className="text-sm text-ink-muted dark:text-slate-400">No activity yet.</p>;
  }

  return (
    <div className="max-h-[400px] overflow-y-auto rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 px-4 py-3">
      {logs.map((log) => (
        <div
          key={log._id}
          className="flex items-center justify-between gap-2 border-b border-fog py-2"
        >
          <p className="m-0 font-body text-[13px] dark:text-slate-300">
            <strong>{log.user?.name}</strong> {log.message}
          </p>
          <span className="shrink-0 font-mono text-[11px] text-ink-faint dark:text-slate-500">
            {timeAgo(log.createdAt)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;