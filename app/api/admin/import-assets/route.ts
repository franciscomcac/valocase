import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// One-time asset migration endpoint: pulls freshly-generated art from
// temporary source URLs and re-hosts it permanently in Supabase Storage.
// Protected by a shared secret so it can't be triggered by randoms.
// Safe to leave in place (no-ops without the secret); can be deleted
// once assets are confirmed migrated.

const ASSETS: { key: string; url: string }[] = [
  {
    key: "hero-backdrop.png",
    url: "https://s15-kling.klingai.com/kimg/EMXN1y8qngEKBnVwbG9hZBIOeWxhYi1zdHVudC1zZ3AagwFLbGluZ0FJX0tvbG9yc19EaVRfSDgwMF8xX0tvbG9ycy12Ml82LXQyaS1vbW5pLXJlZmluZXItdjNfU0dQX1BST0RfYWlfd2ViXzMyMDg0NjcyNzMwNjg0NF8zMWY3ZmVjY2E3MTllM2NhODY1YmExMTNmZmJhMTY3NTkzbjQ3LnBuZw.origin?x-kcdn-pid=112372",
  },
  {
    key: "case-recon.png",
    url: "https://s15-kling.klingai.com/kimg/EMXN1y8qngEKBnVwbG9hZBIOeWxhYi1zdHVudC1zZ3AagwFLbGluZ0FJX0tvbG9yc19EaVRfSDgwMF8xX0tvbG9ycy12Ml82LXQyaS1vbW5pLXJlZmluZXItdjNfU0dQX1BST0RfYWlfd2ViXzMyMDg0NjczMjY2NzM1OF9iYWM3Mzg0ZjBhMWJlZjI0Nzc3YjY2NTU5YmM2YmQwZTQyaXkxLnBuZw.origin?x-kcdn-pid=112372",
  },
  {
    key: "case-champions.png",
    url: "https://s15-kling.klingai.com/kimg/EMXN1y8qngEKBnVwbG9hZBIOeWxhYi1zdHVudC1zZ3AagwFLbGluZ0FJX0tvbG9yc19EaVRfSDgwMF8xX0tvbG9ycy12Ml82LXQyaS1vbW5pLXJlZmluZXItdjNfU0dQX1BST0RfYWlfd2ViXzMyMDg0NjczNTMyMDU4M184ODI3ZmZmNWMxNmJhNDAzYzdlOTI3NzQxMjgzZjIzM3I2eHRwLnBuZw.origin?x-kcdn-pid=112372",
  },
  {
    key: "case-radiant.png",
    url: "https://s15-kling.klingai.com/kimg/EMXN1y8qngEKBnVwbG9hZBIOeWxhYi1zdHVudC1zZ3AagwFLbGluZ0FJX0tvbG9yc19EaVRfSDgwMF8xX0tvbG9ycy12Ml82LXQyaS1vbW5pLXJlZmluZXItdjNfU0dQX1BST0RfYWlfd2ViXzMyMDg0NjczODY1MDY2Ml9hYWQ2NmVjZGMzNTNkZjI2NDE0ZGRmNzljY2EzNTkwMzE1czAxLnBuZw.origin?x-kcdn-pid=112372",
  },
];

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.ASSET_IMPORT_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const results: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const asset of ASSETS) {
    try {
      const res = await fetch(asset.url);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const buf = await res.arrayBuffer();
      const { error } = await supabase.storage
        .from("site-assets")
        .upload(asset.key, buf, {
          contentType: "image/png",
          upsert: true,
        });
      if (error) throw error;
      const { data } = supabase.storage.from("site-assets").getPublicUrl(asset.key);
      results[asset.key] = data.publicUrl;
    } catch (e) {
      errors[asset.key] = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({ results, errors });
}
