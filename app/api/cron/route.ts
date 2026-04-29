import { NextResponse } from "next/server";
import { listCrons } from "@/lib/cron";

// GET /api/cron — Lista de cron jobs disponibles
// Protegido con x-api-key. El Hub consulta este endpoint para saber
// que crons puede programar y con que schedule sugerido.
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.METRICS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(listCrons());
}
