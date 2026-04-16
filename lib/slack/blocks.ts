// Helpers para construir mensajes con Block Kit de Slack
// https://api.slack.com/block-kit

export function section(text: string) {
  return { type: "section", text: { type: "mrkdwn", text } };
}

export function header(text: string) {
  return { type: "header", text: { type: "plain_text", text } };
}

export function divider() {
  return { type: "divider" };
}

export function context(...elements: string[]) {
  return {
    type: "context",
    elements: elements.map((text) => ({ type: "mrkdwn", text })),
  };
}

export function actions(
  ...buttons: {
    text: string;
    actionId: string;
    value?: string;
    style?: "primary" | "danger";
  }[]
) {
  return {
    type: "actions",
    elements: buttons.map((btn) => ({
      type: "button",
      text: { type: "plain_text", text: btn.text },
      action_id: btn.actionId,
      ...(btn.value ? { value: btn.value } : {}),
      ...(btn.style ? { style: btn.style } : {}),
    })),
  };
}

export function input(
  label: string,
  actionId: string,
  placeholder?: string,
  multiline = false
) {
  return {
    type: "input",
    label: { type: "plain_text", text: label },
    element: {
      type: multiline ? "plain_text_input" : "plain_text_input",
      action_id: actionId,
      ...(multiline ? { multiline: true } : {}),
      ...(placeholder
        ? { placeholder: { type: "plain_text", text: placeholder } }
        : {}),
    },
  };
}
