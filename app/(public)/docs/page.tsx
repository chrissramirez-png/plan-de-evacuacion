import { readFileSync, existsSync } from "fs";
import { join } from "path";
import Card from "@/components/ui/Card";

// Pagina publica de documentacion.
// Renderiza docs.md del proyecto y muestra info de hub.config.json.
// Accesible sin login para que cualquiera pueda ver la documentacion.

function getConfig() {
  try {
    const raw = readFileSync(join(process.cwd(), "hub.config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getDocs(): string | null {
  const path = join(process.cwd(), "docs.md");
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

export default function DocsPage() {
  const config = getConfig();
  const docs = getDocs();

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-[20px] leading-[24px] font-medium text-cf-text-primary dark:text-cf-dark-text tracking-[0.15px] mb-2">
        {config?.name || "CAMBIAR: Nombre App"}
      </h1>
      <p className="text-[14px] leading-[22px] text-cf-text-secondary dark:text-cf-dark-text-secondary mb-6">
        {config?.description || "CAMBIAR: Descripcion"}
      </p>

      {/* Endpoints */}
      {config?.endpoints && (
        <Card className="mb-6">
          <h2 className="text-[16px] font-semibold text-cf-text-primary dark:text-cf-dark-text mb-4">
            Endpoints
          </h2>
          <div className="space-y-3">
            {Object.entries(config.endpoints).map(([key, path]) => (
              <div key={key} className="flex items-center gap-3">
                <code className="px-2 py-1 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs font-mono text-cf-text-primary dark:text-cf-dark-text">
                  GET
                </code>
                <code className="text-[13px] text-cf-text-secondary dark:text-cf-dark-text-secondary font-mono">
                  {String(path)}
                </code>
                <span className="text-[12px] text-cf-text-tertiary capitalize">
                  {key.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Capabilities */}
      {config?.capabilities && config.capabilities.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-[16px] font-semibold text-cf-text-primary dark:text-cf-dark-text mb-4">
            Capabilities
          </h2>
          <div className="flex gap-2 flex-wrap">
            {config.capabilities.map((cap: string) => (
              <span
                key={cap}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-cf-green-light text-cf-green-text border border-cf-green-text/30"
              >
                {cap}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Environment variables */}
      {config?.env_required && config.env_required.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-[16px] font-semibold text-cf-text-primary dark:text-cf-dark-text mb-4">
            Variables de entorno
          </h2>
          <div className="space-y-2">
            {config.env_required.map(
              (env: { key: string; description: string }) => (
                <div key={env.key} className="flex items-start gap-3">
                  <code className="px-2 py-0.5 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs font-mono text-cf-text-primary dark:text-cf-dark-text shrink-0">
                    {env.key}
                  </code>
                  <span className="text-[13px] text-cf-text-secondary dark:text-cf-dark-text-secondary">
                    {env.description}
                  </span>
                </div>
              )
            )}
          </div>
        </Card>
      )}

      {/* docs.md content */}
      {docs && (
        <Card>
          <h2 className="text-[16px] font-semibold text-cf-text-primary dark:text-cf-dark-text mb-4">
            Documentacion
          </h2>
          <pre className="whitespace-pre-wrap text-[13px] leading-[20px] text-cf-text-secondary dark:text-cf-dark-text-secondary font-mono">
            {docs}
          </pre>
        </Card>
      )}
    </div>
  );
}
