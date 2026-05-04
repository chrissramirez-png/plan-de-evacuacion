import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function serviceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// GET /api/plans/[code] — obtiene un plan publicado por código
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const supabase = serviceClient();

  const { data, error } = await (supabase as any)
    .schema("plan_evacuacion")
    .from("plans")
    .select("data, name, code")
    .eq("code", code.toUpperCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ data: data.data, name: data.name, code: data.code });
}
