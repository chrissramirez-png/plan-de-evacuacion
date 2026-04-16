export interface CronJob {
  /** Unique name (used as route param and by Hub scheduler) */
  name: string;
  /** Human-readable description */
  description: string;
  // Suggested cron schedule (e.g., "0 */6 * * *")
  schedule: string;
  /** The handler function */
  handler: () => Promise<{ success: boolean; message?: string }>;
}

// CAMBIAR: Registra tus cron jobs aqui
// Cada cron debe tener un nombre unico, descripcion, schedule sugerido y handler
//
// Ejemplo:
// import { syncData } from "./jobs/sync-data";
// registry.set("sync-data", {
//   name: "sync-data",
//   description: "Sincronizar datos con sistema externo",
//   schedule: "0 */6 * * *",
//   handler: syncData,
// });

const registry = new Map<string, CronJob>();

export function registerCron(job: CronJob) {
  registry.set(job.name, job);
}

export function getCron(name: string): CronJob | undefined {
  return registry.get(name);
}

export function listCrons(): Omit<CronJob, "handler">[] {
  return Array.from(registry.values()).map(({ handler, ...rest }) => rest);
}
