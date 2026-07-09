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
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="p-0 font-body text-xs text-teal"
      >
        💬 {open ? "Hide comments" : `Comments${comments.length > 0 ? ` (${comments.length})` : ""}`}
      </button>

      {open && (
        <div className="mt-1.5 rounded-md bg-fog p-2">
          {loading ? (
            <p className="text-xs text-ink-faint">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-ink-faint">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="mb-1 flex items-center justify-between gap-2">
                <p className="m-0 text-xs">
                  <strong>{c.author?.name}</strong>: {c.text}
                </p>
                {c.author?._id === currentUserId && (
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="shrink-0 text-sm leading-none text-danger"
                  >
                    ×
                  </button>
                )}
              </div>
            ))
          )}

          <form onSubmit={handleAddComment} className="mt-1.5 flex gap-1">
            <input
              type="text"
              placeholder="Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded border border-border px-1.5 py-1.5 text-xs"
            />
            <button
              type="submit"
              className="rounded bg-teal px-2.5 py-1.5 text-xs text-white hover:bg-teal-dark"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaskComments;