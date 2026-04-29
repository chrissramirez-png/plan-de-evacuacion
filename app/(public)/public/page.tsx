import Card from "@/components/ui/Card";

// Plan de Evacuación Interactivo: Esta es una pagina publica de ejemplo.
// Las paginas bajo app/(public)/ son accesibles sin login.
// Usa esto para landing pages, status pages, o vistas de datos publicos.
//
// Reglas para paginas publicas:
// - NO mostrar datos sensibles (emails, tokens, credenciales)
// - NO asumir que hay sesion activa
// - Los datos deben funcionar sin autenticacion
// - Si necesitas datos de Supabase, usa RLS con filtro is_public = true

export default function PublicPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-[20px] leading-[24px] font-medium text-cf-text-primary dark:text-cf-dark-text tracking-[0.15px] mb-6">
        Plan de Evacuación Interactivo: Titulo de la pagina publica
      </h1>

      <Card>
        <p className="text-[14px] leading-[22px] text-cf-text-secondary dark:text-cf-dark-text-secondary">
          Plan de Evacuación Interactivo: Contenido publico. Esta pagina es accesible sin login.
        </p>
      </Card>
    </div>
  );
}
