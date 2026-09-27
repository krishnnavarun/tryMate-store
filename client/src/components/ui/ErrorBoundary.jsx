import { Component } from 'react';

// If a page crashes while rendering, show a friendly message instead of a blank screen.
// Layout wraps each page in one (reset on navigation), so the header and footer keep working.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center" role="alert">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="heading-display mt-3 text-5xl">This page hit a snag</h1>
        <p className="mt-4 leading-relaxed text-gray-600">
          Sorry about that. Reloading usually fixes it. Your cart and fit profile are safe.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="btn-primary">
            Reload the page
          </button>
          {/* A full page load (not a router link) to leave the broken state behind */}
          <a href="/" className="btn-secondary">
            Go to the home page
          </a>
        </div>
      </div>
    );
  }
}
