// Small inline icon set — kept local so the dashboard redesign doesn't pull
// in a new icon-library dependency. All strokes use currentColor so they
// pick up color from a parent's `text-*` class.

export const InboxIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path
      d="M3 12h4.5l1.5 3h6l1.5-3H21"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.5 5h13a1 1 0 0 1 .97.757l1.53 6.12a1 1 0 0 1 .03.243V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5.88a1 1 0 0 1 .03-.243l1.53-6.12A1 1 0 0 1 5.5 5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const FolderIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path
      d="M3.5 7a1 1 0 0 1 1-1h4.5l2 2h9a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1h-15.5a1 1 0 0 1-1-1V7Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckCircleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5 11 15l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ClockIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AlertTriangleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path
      d="M12 4.5 21 19.5H3L12 4.5Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 10v4" strokeLinecap="round" />
    <path d="M12 16.5h.01" strokeLinecap="round" />
  </svg>
);

export const SpinnerIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" className="animate-spin" {...props}>
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2.5"
      className="opacity-20"
    />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);
