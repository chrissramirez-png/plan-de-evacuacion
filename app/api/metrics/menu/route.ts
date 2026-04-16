import { NextResponse } from "next/server";

// GET /api/metrics/menu — Menu de metricas disponibles
// Protegido con x-api-key (usado por el Hub para saber que metricas mostrar)
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.METRICS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CAMBIAR: Define las metricas que tu app expone
  // Cada metrica tiene: key (unico), name (display), category, type
  // Categories: availability, usage, errors, engagement, performance
  // Types: number, percentage, timestamp, ranking
  const menu: { key: string; name: string; category: string; type: string }[] =
    [
      // Ejemplo:
      // { key: "active_users_today", name: "Usuarios activos hoy", category: "usage", type: "number" },
      // { key: "error_rate", name: "Tasa de errores", category: "errors", type: "percentage" },
    ];

  return NextResponse.json(menu);
}
