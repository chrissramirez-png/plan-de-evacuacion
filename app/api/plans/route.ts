import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function serviceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// POST /api/plans — guarda o actualiza un plan publicado
export async function POST(req: Request) {
  let body: { code: string; name: string; data: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { code, name, data } = body;
  if (!code || !data) {
    return NextResponse.json({ error: "code y data requeridos" }, { status: 400 });
  }

  const supabase = serviceClient();

  // Obtener el usuario autenticado desde el header Authorization si existe
  let createdBy: string | null = null;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const { data: { user } } = await createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ).auth.getUser(auth.slice(7));
    createdBy = user?.id ?? null;
  }

  const { error } = await (supabase as any)
    .schema("plan_evacuacion")
    .from("plans")
    .upsert(
      {
        code: code.toUpperCase(),
        name: name || "Plan de Evacuación",
        data,
        ...(createdBy ? { created_by: createdBy } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" },
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code: code.toUpperCase() });
}
