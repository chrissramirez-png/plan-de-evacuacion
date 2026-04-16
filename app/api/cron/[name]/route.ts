import { NextResponse } from "next/server";
import { getCron } from "@/lib/cron";

// GET /api/cron/:name — Ejecuta un cron job especifico
// Protegido con x-api-key. El Hub (o Railway scheduler) llama a este endpoint.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.METRICS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await params;
  const cron = getCron(name);

  if (!cron) {
    return NextResponse.json(
      { error: `Cron '${name}' no encontrado` },
      { status: 404 }
    );
  }

  try {
    const result = await cron.handler();
    return NextResponse.json({
      ...result,
      cron: name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Cron '${name}' error:`, error);
    return NextResponse.json(
      { success: false, error: `Error ejecutando cron '${name}'` },
      { status: 500 }
    );
  }
}
