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
  const caseId = String(body.caseId ?? "");
  const count = Math.min(Math.max(Number(body.count) || 1, 1), 10);

  if (!caseId) {
    return NextResponse.json({ error: "Missing caseId." }, { status: 400 });
  }

  const results = [];
  for (let i = 0; i < count; i++) {
    const { data, error } = await supabase.rpc("open_case", { p_case_id: caseId });

    if (error) {
      if (results.length > 0) break; // return whatever succeeded before running out of VC
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    results.push(data?.[0]);
  }

  return NextResponse.json({ results });
}
