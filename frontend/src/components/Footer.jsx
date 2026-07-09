const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border bg-surface px-4 py-4 text-center">
      <p className="m-0 font-mono text-xs text-ink-faint">
        © {new Date().getFullYear()} TeamBoard — built with the MERN stack
      </p>
    </footer>
  );
};

export default Footer;