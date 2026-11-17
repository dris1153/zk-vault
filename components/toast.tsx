"use client";

export function Toast({ message }: { message: string | null }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-20 left-1/2 z-40 -translate-x-1/2 transition-all duration-150 md:bottom-6 ${
        message
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
      }`}
    >
      {message && (
        <div className="whitespace-nowrap rounded-full bg-ink px-4 py-2 text-xs font-medium text-white shadow-card">
          {message}
        </div>
      )}
    </div>
  );
}
