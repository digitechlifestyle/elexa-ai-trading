"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#0a0a0f",
          color: "#e8e8f0",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            Critical error
          </h1>
          <p style={{ color: "#9ca3af", marginBottom: 24 }}>
            The application encountered a fatal error. Please reload.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
                fontFamily: "monospace",
                marginBottom: 24,
              }}
            >
              Error ref: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              background: "#6366f1",
              color: "white",
              border: "none",
              padding: "10px 24px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
