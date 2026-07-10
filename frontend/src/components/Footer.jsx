const Footer = () => {
  return (
    <footer className="mt-auto border-t border-border dark:border-slate-700 bg-surface dark:bg-slate-900 px-4 py-4 text-center">
      <p className="m-0 font-mono text-xs text-ink-faint dark:text-slate-500">
        © {new Date().getFullYear()} TeamBoard — built with the MERN stack
      </p>
    </footer>
  );
};

export default Footer;