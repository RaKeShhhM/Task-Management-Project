// A palette of pleasant, legible background colors — we pick one deterministically
// based on the person's name, so the same person always gets the same color
// across sessions without storing anything extra in the database.
const PALETTE = [
  "#0D9488", // teal
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#DC2626", // red
  "#7C3AED", // violet
  "#16A34A", // green
  "#DB2777", // pink
];

const colorForName = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const SIZES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-lg",
};

const Avatar = ({ name, size = "md" }) => {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-heading font-semibold text-white ${SIZES[size]}`}
      style={{ backgroundColor: colorForName(name) }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;