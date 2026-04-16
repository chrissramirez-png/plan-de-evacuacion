import { redirect } from "next/navigation";
import config from "../hub.config.json";

export default function Home() {
  const capabilities: string[] =
    ((config as Record<string, unknown>).capabilities as string[]) || [];
  const hasFrontend = capabilities.includes("frontend");

  // Con frontend: ir al dashboard (requiere login)
  // Sin frontend: ir a docs (pagina publica)
  redirect(hasFrontend ? "/dashboard" : "/docs");
}
