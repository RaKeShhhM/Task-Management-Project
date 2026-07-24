import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="mx-auto flex flex-col items-center justify-center px-4 text-center mt-20 sm:mt-28">
      <div className="rounded-md border border-border dark:border-slate-700 bg-surface dark:bg-slate-900 p-8 shadow-card max-w-md w-full animate-fade-slide-up">
        <h1 className="text-6xl font-extrabold text-teal font-mono mb-4">404</h1>
        <h2 className="font-heading text-2xl font-bold text-ink dark:text-slate-100 mb-2">
          Page Not Found
        </h2>
        <p className="font-body text-sm text-ink-muted dark:text-slate-400 mb-6 leading-relaxed">
          The page you are looking for does not exist, has been removed, or is temporarily unavailable.
        </p>
        <Link
          to="/dashboard"
          className="inline-block rounded-md bg-teal px-6 py-2.5 font-body text-sm font-semibold text-white hover:bg-teal-dark transition-colors duration-200 shadow-sm"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
