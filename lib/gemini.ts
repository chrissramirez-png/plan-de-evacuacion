import { createSign } from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SACredentials {
  private_key: string;
  client_email: string;
  token_uri: string;
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: { maxOutputTokens?: number };
}

// ─── Token cache ──────────────────────────────────────────────────────────────
let cachedToken: { token: string; expiry: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();

  // Reuse token if still valid (5 min buffer)
  if (cachedToken && cachedToken.expiry > now + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const credsJson = process.env.HUB_GOOGLE_SA_CREDENTIALS;
  if (!credsJson) throw new Error("HUB_GOOGLE_SA_CREDENTIALS no configurada");

  const creds: SACredentials = JSON.parse(credsJson);

  // Build JWT (RS256)
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");

  const iat = Math.floor(now / 1000);
  const exp = iat + 3600;

  const payload = Buffer.from(
    JSON.stringify({
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/generative-language",
      aud: creds.token_uri,
      exp,
      iat,
    }),
  ).toString("base64url");

  const unsigned = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(unsigned);
  const signature = sign.sign(creds.private_key, "base64url");
  const jwt = `${unsigned}.${signature}`;

  // Exchange JWT for access token
  const res = await fetch(creds.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error obteniendo token SA: ${err}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiry: now + data.expires_in * 1000 };
  return cachedToken.token;
}

// ─── Public helper ────────────────────────────────────────────────────────────
const DEFAULT_MODEL = "gemini-2.5-flash-lite";

/**
 * Llama a Gemini usando la Service Account del Hub.
 * Acepta el mismo formato de request que la API de Gemini directamente.
 */
export async function callGeminiRaw(
  body: GeminiRequest,
  model = DEFAULT_MODEL,
): Promise<unknown> {
  const token = await getAccessToken();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(`Gemini API ${res.status}: ${err?.error?.message || res.statusText}`);
  }

  return res.json();
}

/**
 * Shortcut para prompts de texto simple.
 */
export async function callGemini(
  prompt: string,
  model = DEFAULT_MODEL,
): Promise<string> {
  const data = (await callGeminiRaw(
    { contents: [{ role: "user", parts: [{ text: prompt }] }] },
    model,
  )) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };

  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
