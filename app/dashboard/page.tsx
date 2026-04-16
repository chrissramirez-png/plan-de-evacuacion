import Card from "@/components/ui/Card";

export default function DashboardPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-[20px] leading-[24px] font-medium text-cf-text-primary dark:text-cf-dark-text tracking-[0.15px] mb-6">
        CAMBIAR: Nombre App
      </h1>

      <Card>
        <h2 className="text-[16px] leading-[24px] font-semibold text-cf-text-primary dark:text-cf-dark-text mb-4">
          Bienvenido
        </h2>
        <p className="text-[14px] leading-[22px] text-cf-text-secondary dark:text-cf-dark-text-secondary mb-6">
          CAMBIAR: Descripcion de lo que hace tu app.
        </p>

        <div className="space-y-3 text-[14px] leading-[22px] text-cf-text-secondary dark:text-cf-dark-text-secondary">
          <h3 className="font-semibold text-cf-text-primary dark:text-cf-dark-text">
            Que hacer ahora
          </h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Busca{" "}
              <code className="px-1 py-0.5 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs">
                CAMBIAR
              </code>{" "}
              en todo el proyecto y reemplaza con tus valores
            </li>
            <li>
              Edita los links del sidebar en{" "}
              <code className="px-1 py-0.5 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs">
                components/layout/Sidebar.tsx
              </code>
            </li>
            <li>
              Agrega tus paginas en{" "}
              <code className="px-1 py-0.5 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs">
                app/dashboard/
              </code>
            </li>
            <li>
              Configura tus tablas en{" "}
              <code className="px-1 py-0.5 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs">
                migrations/001_initial.sql
              </code>
            </li>
            <li>
              Implementa tus metricas en{" "}
              <code className="px-1 py-0.5 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs">
                app/api/metrics/
              </code>
            </li>
            <li>
              Para vistas publicas (sin login), agrega paginas en{" "}
              <code className="px-1 py-0.5 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs">
                app/(public)/
              </code>{" "}
              y configura{" "}
              <code className="px-1 py-0.5 bg-cf-bg-gray dark:bg-cf-dark-border rounded text-xs">
                publicRoutes
              </code>{" "}
              en hub.config.json
            </li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
