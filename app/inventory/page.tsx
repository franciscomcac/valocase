import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user!.id)
    .single();

  const { data: rows } = await supabase
    .from("inventory")
    .select("id, won_at, skins(skin_key, name, rarity, image_url, value)")
    .eq("user_id", user!.id)
    .order("won_at", { ascending: false });

  const { data: rarityRows } = await supabase.from("rarities").select("key, label, color");
  const rarities = Object.fromEntries((rarityRows ?? []).map((r) => [r.key, r]));

  const inventory = (rows ?? [])
    .map((r) => {
      const skin = Array.isArray(r.skins) ? r.skins[0] : r.skins;
      return skin ? { id: r.id, ...skin } : null;
    })
    .filter(Boolean) as { id: string; skin_key: string; name: string; rarity: string; image_url: string; value: number }[];

  return (
    <>
      <SiteHeader active="inventory" initialBalance={profile?.balance ?? 0} />

      <div className="wrap section">
        <h2>Your Inventory</h2>
        <InventoryClient inventory={inventory} rarities={rarities} />
      </div>

      <div className="wrap">
        <footer>
          <div>
            ValoCase is an unofficial fan-made demo. This inventory is tied to your account only
            &mdash; it is not a real Valorant account and holds no real items.
          </div>
        </footer>
      </div>
    </>
  );
}
