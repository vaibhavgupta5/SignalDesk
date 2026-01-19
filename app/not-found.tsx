"use client";

export default function NotFound() {
  return (
    <div className="h-screen flex items-center justify-center bg-base-bg">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          Page Not Found
        </h2>
        <p className="text-text-secondary mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center h-10 px-6 rounded-md bg-accent text-white hover:bg-accent-hover transition-all-smooth"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
