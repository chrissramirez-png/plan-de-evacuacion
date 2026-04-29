import { readFileSync } from "fs";
import { resolve } from "path";

let cachedSlug: string | null = null;

function getProjectSlug(): string | null {
  if (cachedSlug !== null) return cachedSlug;
  try {
    const configPath = resolve(process.cwd(), "hub.config.json");
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    cachedSlug = config.slug || config.name || "";
    return cachedSlug;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget: notify the Hub that a user accessed this project.
 * Non-blocking — failures are silently ignored.
 */
export function fireAccessLog(userEmail: string): void {
  const hubUrl = process.env.HUB_URL;
  const apiKey = process.env.METRICS_API_KEY;
  const slug = getProjectSlug();

  if (!hubUrl || !apiKey || !slug || !userEmail) return;

  fetch(`${hubUrl.replace(/\/$/, "")}/api/access-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ project_slug: slug, user_email: userEmail }),
  }).catch(() => {});
}
