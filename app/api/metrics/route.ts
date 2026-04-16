import { NextResponse } from "next/server";

// GET /api/metrics — Valores actuales de metricas
// Protegido con x-api-key (usado por el Hub para recopilar datos)
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.METRICS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CAMBIAR: Calcula y retorna los valores de tus metricas
  // Cada entrada debe corresponder a una key del menu
  const metrics: { key: string; value: unknown }[] = [
    // Ejemplo:
    // { key: "active_users_today", value: 42 },
    // { key: "error_rate", value: 0.02 },
  ];

  return NextResponse.json(metrics);
}
