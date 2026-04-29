import { readFileSync } from "fs";
import { join } from "path";
import type { Profile, UserRole } from "./types";

let _cachedOwner: string | null = null;

function getOwnerEmail(): string {
  if (_cachedOwner !== null) return _cachedOwner;
  try {
    const raw = readFileSync(join(process.cwd(), "hub.config.json"), "utf-8");
    const config = JSON.parse(raw);
    _cachedOwner = config.owner || "";
    return _cachedOwner;
  } catch {
    return "";
  }
}

export function verifyDomain(email: string): boolean {
  const domain = process.env.ALLOWED_DOMAIN;
  if (!domain) return false;
  return email.endsWith(`@${domain}`);
}

export function getInitialRole(email: string): UserRole {
  return email === getOwnerEmail() ? "admin" : "member";
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCurrentUser(supabase: any): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
}
