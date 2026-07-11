import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for pre-auth rate limiting (login/signup/etc. have
 * no user_id yet to bucket on). Vercel and most reverse proxies set
 * x-forwarded-for; NextRequest.ip is not reliably populated in route
 * handlers, so this is the practical source.
 */
export function getClientIp(request: NextRequest): string {
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
