import { NextResponse } from "next/server";

// GET /api/public/example — Ejemplo de API publica
//
// Los endpoints bajo /api/public/* son accesibles sin autenticacion.
// Usa esto para datos que deben ser visibles sin login.
//
// Reglas para APIs publicas:
// - NO retornar datos sensibles (emails, tokens, credenciales, IDs internos)
// - NO exponer datos de usuarios sin consentimiento
// - Si consultas Supabase, usa RLS con filtro is_public = true
// - Retorna solo datos agregados o anonimizados
//
// CAMBIAR: Renombra y adapta a tu caso
export async function GET() {
  // CAMBIAR: Implementa tu logica publica aqui
  return NextResponse.json({
    message: "CAMBIAR: Endpoint publico de ejemplo",
    timestamp: new Date().toISOString(),
  });
}
