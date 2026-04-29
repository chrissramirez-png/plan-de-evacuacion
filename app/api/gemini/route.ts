import { NextResponse } from "next/server";
import { callGeminiRaw } from "@/lib/gemini";

// POST /api/gemini — Proxy para Gemini API
// Usa HUB_GOOGLE_SA_CREDENTIALS (Service Account) para autenticarse.
// El frontend envía { contents, generationConfig } en formato Gemini estándar.
export async function POST(request: Request) {
  if (!process.env.HUB_GOOGLE_SA_CREDENTIALS) {
    return NextResponse.json(
      { error: "HUB_GOOGLE_SA_CREDENTIALS no configurada en el servidor" },
      { status: 500 },
    );
  }

  let body: { contents: unknown; generationConfig?: unknown; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  try {
    const data = await callGeminiRaw(
      { contents: body.contents as never, generationConfig: body.generationConfig as never },
      body.model,
    );
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("401") || message.includes("403") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
