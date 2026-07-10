import dns from "node:dns/promises";

/**
 * Blocks outbound requests to internal/private network destinations.
 * Used to guard user-supplied webhook URLs, which are otherwise a direct
 * SSRF vector: the server fetches whatever URL the user registers.
 */

const BLOCKED_HOSTNAMES = new Set(["localhost", "0.0.0.0"]);

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) {
    return true; // malformed — fail closed
  }
  const int = ipv4ToInt(ip);
  const ranges: [string, number][] = [
    ["0.0.0.0", 8],
    ["10.0.0.0", 8],
    ["100.64.0.0", 10], // CGNAT
    ["127.0.0.0", 8],
    ["169.254.0.0", 16], // link-local, includes cloud metadata (169.254.169.254)
    ["172.16.0.0", 12],
    ["192.0.0.0", 24],
    ["192.168.0.0", 16],
    ["198.18.0.0", 15],
    ["224.0.0.0", 4], // multicast and above
  ];
  return ranges.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (int & mask) === (ipv4ToInt(base) & mask);
  });
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.split(":").pop()!;
    return isPrivateIPv4(v4);
  }
  return false;
}

export async function isSafeWebhookUrl(
  rawUrl: string
): Promise<{ safe: boolean; reason?: string }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { safe: false, reason: "Invalid URL" };
  }

  if (url.protocol !== "https:") {
    return { safe: false, reason: "HTTPS required" };
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { safe: false, reason: "Host not allowed" };
  }

  let addresses: string[];
  try {
    const results = await dns.lookup(hostname, { all: true });
    addresses = results.map((r) => r.address);
  } catch {
    return { safe: false, reason: "Could not resolve host" };
  }

  if (addresses.length === 0) {
    return { safe: false, reason: "Could not resolve host" };
  }

  for (const addr of addresses) {
    const isBlocked = addr.includes(":") ? isPrivateIPv6(addr) : isPrivateIPv4(addr);
    if (isBlocked) {
      return { safe: false, reason: "Private or internal address not allowed" };
    }
  }

  return { safe: true };
}
