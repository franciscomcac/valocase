import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const inventoryId = String(body.inventoryId ?? "");

  if (!inventoryId) {
    return NextResponse.json({ error: "Missing inventoryId." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("sell_item", { p_inventory_id: inventoryId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ newBalance: data });
}
