import { Component } from "react";

// Class component is required here — Error Boundaries are one of the few
// remaining cases React doesn't support as a hook/function component.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In a real production setup this is where you'd send the error to a
    // monitoring service (Sentry, LogRocket, etc.) — logging is the minimum here.
    console.error("Uncaught render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto mt-20 max-w-md px-4 text-center">
          <p className="mb-2 text-3xl">⚠️</p>
          <h2 className="mb-2 font-heading text-xl text-ink dark:text-slate-100">
            Something went wrong
          </h2>
          <p className="mb-4 text-sm text-ink-muted dark:text-slate-400">
            An unexpected error occurred. Try reloading the page — if it keeps
            happening, please let us know what you were doing.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-dark"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;