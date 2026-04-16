export interface SlackCommand {
  /** The slash command (e.g., "/deploy") */
  command: string;
  /** Description shown in Slack */
  description: string;
  /** Usage hint (e.g., "/deploy [env]") */
  usage?: string;
  handler: (payload: SlackCommandPayload) => Promise<SlackCommandResponse>;
}

export interface SlackCommandPayload {
  command: string;
  text: string;
  user_id: string;
  user_name: string;
  channel_id: string;
  channel_name: string;
  response_url: string;
  trigger_id: string;
}

export interface SlackCommandResponse {
  response_type?: "in_channel" | "ephemeral";
  text: string;
  blocks?: unknown[];
}

const commands = new Map<string, SlackCommand>();

export function registerCommand(cmd: SlackCommand) {
  commands.set(cmd.command, cmd);
}

export function getCommand(name: string): SlackCommand | undefined {
  return commands.get(name);
}

export function listCommands(): Omit<SlackCommand, "handler">[] {
  return Array.from(commands.values()).map(({ handler: _, ...rest }) => rest);
}

// CAMBIAR: Registra tus comandos aqui
//
// Ejemplo:
// registerCommand({
//   command: "/status",
//   description: "Muestra el estado del servicio",
//   usage: "/status",
//   handler: async (payload) => ({
//     response_type: "ephemeral",
//     text: "Todo funcionando correctamente",
//   }),
// });
