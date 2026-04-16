import { NextResponse } from "next/server";

// POST /api/webhook/example — Ejemplo de webhook receiver
//
// Patron para recibir webhooks de servicios externos:
// 1. Valida el origen (secret, signature, IP)
// 2. Procesa el payload
// 3. Retorna 200 rapidamente (no hacer trabajo pesado sincrono)
//
// Plan de Evacuación Interactivo: Renombra este archivo y adapta a tu caso (Slack, GitHub, Stripe, etc.)
export async function POST(request: Request) {
  try {
    // Plan de Evacuación Interactivo: Valida el origen del webhook
    // Ejemplo para un secret compartido:
    const webhookSecret = request.headers.get("x-webhook-secret");
    if (webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Plan de Evacuación Interactivo: Procesa el payload del webhook
    console.log("Webhook recibido:", body);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}
