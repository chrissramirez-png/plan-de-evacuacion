import { NextResponse } from "next/server";
import { verifySlackSignature } from "@/lib/slack/verify";

// POST /api/slack/interactions — Recibe interacciones (botones, menus, modals)
// Configurar en Slack App > Interactivity > Request URL: https://tu-app.up.railway.app/api/slack/interactions
//
// CAMBIAR: Implementa los handlers para tus action_ids

interface InteractionPayload {
  type: string;
  user: { id: string; name: string };
  channel?: { id: string };
  actions?: {
    action_id: string;
    value?: string;
    selected_option?: { value: string };
  }[];
  view?: {
    callback_id: string;
    state: { values: Record<string, Record<string, { value: string }>> };
  };
  response_url?: string;
  trigger_id?: string;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-slack-signature") || "";
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";

  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error("SLACK_SIGNING_SECRET no configurado");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  if (!verifySlackSignature(signingSecret, signature, timestamp, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const payload: InteractionPayload = JSON.parse(params.get("payload") || "{}");

  // Block actions (buttons, menus, etc.)
  if (payload.type === "block_actions" && payload.actions) {
    for (const action of payload.actions) {
      // CAMBIAR: Agrega handlers para tus action_ids
      console.log(`Action: ${action.action_id}, value: ${action.value}`);

      // Ejemplo:
      // if (action.action_id === "approve_request") {
      //   await handleApproval(payload, action);
      // }
    }
  }

  // View submissions (modals)
  if (payload.type === "view_submission" && payload.view) {
    const callbackId = payload.view.callback_id;
    console.log(`Modal submitted: ${callbackId}`);

    // CAMBIAR: Agrega handlers para tus callback_ids
    // Ejemplo:
    // if (callbackId === "create_ticket") {
    //   const values = payload.view.state.values;
    //   await createTicket(values);
    // }
  }

  return NextResponse.json({ ok: true });
}
