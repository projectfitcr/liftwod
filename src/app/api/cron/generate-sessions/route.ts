import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Daily 01:00 Bangkok (vercel.json). Extends the materialized session horizon. */
export async function GET(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("generate_sessions");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, created: data });
}
