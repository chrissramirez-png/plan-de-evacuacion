import { createHmac, timingSafeEqual } from "crypto";

// Verifica que un request viene de Slack usando signing secret
// https://api.slack.com/authentication/verifying-requests-from-slack
export function verifySlackSignature(
  signingSecret: string,
  signature: string,
  timestamp: string,
  body: string
): boolean {
  // Reject requests older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 60 * 5) return false;

  const baseString = `v0:${timestamp}:${body}`;
  const hmac = createHmac("sha256", signingSecret)
    .update(baseString)
    .digest("hex");
  const expected = `v0=${hmac}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
