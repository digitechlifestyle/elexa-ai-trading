/**
 * Each user's referral code is the first 8 characters of their user UUID.
 * Stable, unique, no extra storage. Codes are short enough for share links.
 */
export function referralCodeForUser(userId: string): string {
  return userId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function referralLinkForUser(userId: string, appUrl: string): string {
  return `${appUrl}/signup?ref=${referralCodeForUser(userId)}`;
}
