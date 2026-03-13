import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background text-primary font-sans p-8" role="alert">
          <h1 className="text-2xl font-bold text-primary">Something went wrong</h1>
          <p className="text-slate text-center max-w-md">A runtime error occurred. Try reloading the page.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
