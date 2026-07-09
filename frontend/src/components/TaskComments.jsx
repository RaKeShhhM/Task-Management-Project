import { useState, useEffect } from "react";
import api from "../services/api";
import socket from "../services/socket";

const TaskComments = ({ taskId, currentUserId }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/comments/task/${taskId}`);
      setComments(res.data);
    } catch (err) {
      // Silent fail is fine here — comments are secondary to the core task view
    } finally {
      setLoading(false);
    }
  };

  // Only fetch the first time the thread is expanded, not on every render
  useEffect(() => {
    if (open && comments.length === 0) {
      fetchComments();
    }
  }, [open]);

  // Listen for live comment events, but only apply the ones for THIS task —
  // every task card mounts this listener, so we filter by taskId
  useEffect(() => {
    const onCommentAdded = (comment) => {
      if (comment.task === taskId || comment.task?._id === taskId) {
        setComments((prev) => [...prev, comment]);
      }
    };

    const onCommentDeleted = ({ commentId, taskId: deletedTaskId }) => {
      if (deletedTaskId === taskId) {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
    };

    socket.on("commentAdded", onCommentAdded);
    socket.on("commentDeleted", onCommentDeleted);

    return () => {
      socket.off("commentAdded", onCommentAdded);
      socket.off("commentDeleted", onCommentDeleted);
    };
  }, [taskId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await api.post("/comments", { taskId, text });
      setText("");
      // No manual state update — the "commentAdded" socket event handles it
    } catch (err) {
      // Keep it simple — a failed comment just doesn't clear the input
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
    } catch (err) {
      // no-op
    }
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <button onClick={() => setOpen(!open)} style={toggleButtonStyle}>
        💬 {open ? "Hide comments" : `Comments${comments.length > 0 ? ` (${comments.length})` : ""}`}
      </button>

      {open && (
        <div style={threadStyle}>
          {loading ? (
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>Loading...</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} style={commentRowStyle}>
                <p style={{ margin: 0, fontSize: "12px" }}>
                  <strong>{c.author?.name}</strong>: {c.text}
                </p>
                {c.author?._id === currentUserId && (
                  <button
                    onClick={() => handleDelete(c._id)}
                    style={deleteCommentButtonStyle}
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}

          <form onSubmit={handleAddComment} style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={commentInputStyle}
            />
            <button type="submit" style={commentSubmitStyle}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const toggleButtonStyle = {
  background: "none",
  border: "none",
  color: "#4f46e5",
  fontSize: "12px",
  cursor: "pointer",
  padding: 0,
};

const threadStyle = {
  marginTop: "6px",
  padding: "8px",
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
};

const commentRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "4px",
};

const deleteCommentButtonStyle = {
  background: "none",
  border: "none",
  color: "#b91c1c",
  cursor: "pointer",
  fontSize: "14px",
  lineHeight: 1,
};

const commentInputStyle = {
  flex: 1,
  padding: "6px",
  fontSize: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
};

const commentSubmitStyle = {
  padding: "6px 10px",
  fontSize: "12px",
  border: "none",
  borderRadius: "4px",
  backgroundColor: "#4f46e5",
  color: "#fff",
  cursor: "pointer",
};

export default TaskComments;