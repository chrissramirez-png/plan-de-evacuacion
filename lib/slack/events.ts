export interface SlackEventHandler {
  /** Event type (e.g., "message", "app_mention", "reaction_added") */
  type: string;
  handler: (event: SlackEvent) => Promise<void>;
}

export interface SlackEvent {
  type: string;
  user?: string;
  text?: string;
  channel?: string;
  ts?: string;
  thread_ts?: string;
  [key: string]: unknown;
}

const eventHandlers = new Map<string, SlackEventHandler>();

export function onEvent(
  type: string,
  handler: (event: SlackEvent) => Promise<void>
) {
  eventHandlers.set(type, { type, handler });
}

export function getEventHandler(type: string): SlackEventHandler | undefined {
  return eventHandlers.get(type);
}

export function listEventTypes(): string[] {
  return Array.from(eventHandlers.keys());
}

// Plan de Evacuación Interactivo: Registra tus event handlers aqui
//
// Ejemplo:
// onEvent("app_mention", async (event) => {
//   await sendMessage(event.channel!, `Hola <@${event.user}>! En que te puedo ayudar?`);
// });
//
// onEvent("message", async (event) => {
//   // Solo responder en DMs (no en canales)
//   if (event.channel_type === "im") {
//     await sendMessage(event.channel!, "Recibido!");
//   }
// });
