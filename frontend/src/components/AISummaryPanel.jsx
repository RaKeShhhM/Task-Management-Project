import { useState } from "react";
import api from "../services/api";

// Parses the LLM's bulleted output into an array of strings. Tolerates both
// "-" and "•" as bullet markers and ignores empty lines, so a stray blank
// line in the model's output doesn't render as an empty <li>.
const parseBullets = (text) =>
  text
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter((line) => line.length > 0);

const formatTimestamp = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AISummaryPanel = ({ projectId }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null); // { summary, generatedAt, cached, contextSnapshot }
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post(`/ai/projects/${projectId}/summary`);
      setSummary(res.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Couldn't generate a summary right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const bullets = summary ? parseBullets(summary.summary) : [];

  return (
    <div className="mb-4 rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">✨</span>
          <h4 className="m-0 font-heading text-sm dark:text-slate-100">
            AI weekly summary
          </h4>
          {summary?.cached && (
            <span className="rounded-full bg-fog dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
              cached
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="whitespace-nowrap rounded-md bg-teal px-3 py-1.5 font-body text-xs font-semibold text-white hover:bg-teal-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Generating..."
            : summary
            ? "Refresh summary"
            : "Generate weekly summary"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-danger">{error}</p>
      )}

      {!summary && !error && !loading && (
        <p className="mt-3 text-sm text-ink-muted dark:text-slate-400">
          Get a 3–5 bullet standup-style digest of the last 7 days of activity
          for this project. Powered by Mistral.
        </p>
      )}

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-ink-muted dark:text-slate-400">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          Reading the project state...
        </div>
      )}

      {summary && !loading && (
        <>
          <ul className="mt-3 mb-2 list-disc space-y-1 pl-5 font-body text-sm dark:text-slate-300">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          <p className="m-0 font-mono text-[11px] text-ink-faint dark:text-slate-500">
            Generated {formatTimestamp(summary.generatedAt)}
            {summary.contextSnapshot && (
              <>
                {" · "}based on {summary.contextSnapshot.totals.allTasks} tasks
                {" · "}
                {summary.contextSnapshot.totals.completedInWindow} completed in last{" "}
                {summary.contextSnapshot.windowDays}d
                {summary.contextSnapshot.overdueCount > 0 && (
                  <>
                    {" · "}
                    <span className="text-danger">
                      {summary.contextSnapshot.overdueCount} overdue
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
};

export default AISummaryPanel;
