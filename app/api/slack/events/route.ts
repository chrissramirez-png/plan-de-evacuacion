import { NextResponse } from "next/server";
import { verifySlackSignature } from "@/lib/slack/verify";
import { getEventHandler } from "@/lib/slack/events";

// POST /api/slack/events — Recibe eventos de Slack (Events API)
// Configurar en Slack App > Event Subscriptions > Request URL: https://tu-app.up.railway.app/api/slack/events
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

  const data = JSON.parse(body);

  // Slack URL verification challenge
  if (data.type === "url_verification") {
    return NextResponse.json({ challenge: data.challenge });
  }

  // Event callback
  if (data.type === "event_callback" && data.event) {
    const handler = getEventHandler(data.event.type);
    if (handler) {
      // Respond immediately, process async (Slack expects response within 3s)
      handler.handler(data.event).catch((err) => {
        console.error(`Slack event error (${data.event.type}):`, err);
      });
    }
  }

  // Always respond 200 quickly to avoid retries
  return NextResponse.json({ ok: true });
}
