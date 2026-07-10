import { useEffect, useRef, useState } from "react";

// Animates a number counting up from 0 to `target` when `target` becomes
// available. Pass `active=false` to hold at 0 (e.g. while still loading).
const useCountUp = (target = 0, { duration = 700, active = true } = {}) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    // Respect the user's reduced-motion preference — jump straight to target.
    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    let start = null;
    const step = (timestamp) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.round(progress * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, active]);

  return value;
};

export default useCountUp;
