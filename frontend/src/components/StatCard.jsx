import { useState, useEffect } from "react";

// Counts up from 0 to `value` over ~600ms whenever `value` changes —
// small touch that makes the dashboard feel alive on load instead of
// numbers just appearing flat.
const useCountUp = (value, duration = 600) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = null;
    let frameId;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return display;
};

const StatCard = ({ label, value, accentColor = "#0D9488" }) => {
  const displayValue = useCountUp(value);

  return (
    <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-4 shadow-card">
      <p
        className="m-0 font-heading text-2xl font-bold"
        style={{ color: accentColor }}
      >
        {displayValue}
      </p>
      <p className="m-0 mt-1 font-body text-xs text-ink-muted dark:text-slate-400">{label}</p>
    </div>
  );
};

export default StatCard;