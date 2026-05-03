import { NextRequest, NextResponse } from "next/server";
import { log, newRequestId, persistError } from "./logger";
import { createAdminClient } from "@/lib/supabase/server";

type Handler = (
  request: NextRequest,
  ctx: { requestId: string }
) => Promise<NextResponse> | Promise<Response>;

/**
 * Wraps an API route handler with: request ID generation, structured logging,
 * automatic error catching, and persistent error logging.
 *
 * Usage:
 *   export const POST = withApi(async (req, { requestId }) => { ... });
 */
export function withApi(handler: Handler) {
  return async function wrapped(request: NextRequest) {
    const requestId = newRequestId();
    const route = new URL(request.url).pathname;
    const start = Date.now();

    log.info("api.request", { request_id: requestId, route, method: request.method });

    try {
      const response = await handler(request, { requestId });
      const duration = Date.now() - start;
      log.info("api.response", {
        request_id: requestId,
        route,
        status: response.status,
        duration_ms: duration,
      });
      // Add request id header for client-side correlation
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (err) {
      const duration = Date.now() - start;
      const message = err instanceof Error ? err.message : "Unknown error";
      const stack = err instanceof Error ? err.stack : undefined;

      log.error("api.error", {
        request_id: requestId,
        route,
        message,
        duration_ms: duration,
      });

      // Persist to system_errors. Use admin client to avoid auth issues.
      try {
        const admin = await createAdminClient();
        await persistError(admin, {
          message,
          stack,
          route,
          request_id: requestId,
        });
      } catch {
        // Already logged to stdout; don't escalate
      }

      return NextResponse.json(
        {
          error: "An internal error occurred. Please try again.",
          request_id: requestId,
        },
        {
          status: 500,
          headers: { "x-request-id": requestId },
        }
      );
    }
  };
}
