// Slack Web API client — wrapper minimo para enviar mensajes y responder
// No usa dependencias externas, solo fetch

const SLACK_API = "https://slack.com/api";

function getToken(): string {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN no configurado");
  return token;
}

async function slackApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error(`Slack API error (${method}):`, data.error);
  }
  return data;
}

export async function sendMessage(
  channel: string,
  text: string,
  blocks?: unknown[]
) {
  return slackApi("chat.postMessage", {
    channel,
    text,
    ...(blocks ? { blocks } : {}),
  });
}

export async function sendEphemeral(
  channel: string,
  user: string,
  text: string,
  blocks?: unknown[]
) {
  return slackApi("chat.postEphemeral", {
    channel,
    user,
    text,
    ...(blocks ? { blocks } : {}),
  });
}

export async function updateMessage(
  channel: string,
  ts: string,
  text: string,
  blocks?: unknown[]
) {
  return slackApi("chat.update", {
    channel,
    ts,
    text,
    ...(blocks ? { blocks } : {}),
  });
}

export async function respond(
  responseUrl: string,
  body: Record<string, unknown>
) {
  await fetch(responseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
