/**
 * Structured logger — every log has a level, a message, and optional context.
 * Output goes to stdout (visible in Vercel logs) and, for errors, to the
 * system_errors table for persistent admin visibility.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  request_id?: string;
  user_id?: string;
  route?: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(context ?? {}),
  };
  return JSON.stringify(entry);
}

export const log = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.log(formatLog("debug", message, context));
    }
  },
  info(message: string, context?: LogContext) {
    console.log(formatLog("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },
  error(message: string, context?: LogContext) {
    console.error(formatLog("error", message, context));
  },
};

/**
 * Persist an error to the system_errors table. Use the admin client
 * since this should work even if user auth is the source of the error.
 */
export async function persistError(
  supabase: SupabaseClient,
  error: {
    message: string;
    stack?: string;
    route?: string;
    user_id?: string;
    request_id?: string;
    context?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("system_errors").insert({
      message: error.message,
      stack: error.stack ?? null,
      route: error.route ?? null,
      user_id: error.user_id ?? null,
      request_id: error.request_id ?? null,
      context: error.context ?? null,
    });
  } catch (err) {
    // Last-resort: if even logging fails, still get it to stdout
    console.error("Failed to persist error:", err, "Original:", error);
  }
}

/**
 * Generate a short request ID for tracing.
 */
export function newRequestId(): string {
  return Math.random().toString(36).slice(2, 10);
}
