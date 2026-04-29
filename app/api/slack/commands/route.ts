import { NextResponse } from "next/server";
import { verifySlackSignature } from "@/lib/slack/verify";
import { getCommand, listCommands } from "@/lib/slack/commands";

// POST /api/slack/commands — Recibe slash commands de Slack
// Configurar en Slack App > Slash Commands > Request URL: https://tu-app.up.railway.app/api/slack/commands
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
  const payload = {
    command: params.get("command") || "",
    text: params.get("text") || "",
    user_id: params.get("user_id") || "",
    user_name: params.get("user_name") || "",
    channel_id: params.get("channel_id") || "",
    channel_name: params.get("channel_name") || "",
    response_url: params.get("response_url") || "",
    trigger_id: params.get("trigger_id") || "",
  };

  const cmd = getCommand(payload.command);
  if (!cmd) {
    const available = listCommands()
      .map((c) => c.command)
      .join(", ");
    return NextResponse.json({
      response_type: "ephemeral",
      text: `Comando desconocido: ${payload.command}. Disponibles: ${available || "ninguno"}`,
    });
  }

  try {
    const response = await cmd.handler(payload);
    return NextResponse.json(response);
  } catch (error) {
    console.error(`Slack command error (${payload.command}):`, error);
    return NextResponse.json({
      response_type: "ephemeral",
      text: "Error procesando el comando. Intenta de nuevo.",
    });
  }
}
