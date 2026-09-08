import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import CaseClient from "./CaseClient";

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user!.id)
    .single();

  const { data: caseDef } = await supabase
    .from("cases")
    .select("id, name, tagline, cost, banner_url, disabled")
    .eq("id", id)
    .single();

  if (!caseDef || caseDef.disabled) notFound();

  const { data: itemRows } = await supabase
    .from("case_items")
    .select("skins(skin_key, name, weapon, rarity, image_url, value)")
    .eq("case_id", id);

  const items = (itemRows ?? [])
    .map((r) => (Array.isArray(r.skins) ? r.skins[0] : r.skins))
    .filter(Boolean) as {
    skin_key: string;
    name: string;
    weapon: string;
    rarity: string;
    image_url: string;
    value: number;
  }[];

  const { data: rarityRows } = await supabase
    .from("rarities")
    .select("key, label, color, weight");

  const rarities = Object.fromEntries((rarityRows ?? []).map((r) => [r.key, r]));

  const countByRarity: Record<string, number> = {};
  items.forEach((it) => {
    countByRarity[it.rarity] = (countByRarity[it.rarity] || 0) + 1;
  });
  const totalWeight = (rarityRows ?? []).reduce((s, r) => s + Number(r.weight), 0);
  const odds = items
    .map((it) => ({
      ...it,
      chance: (Number(rarities[it.rarity]?.weight ?? 0) / countByRarity[it.rarity] / totalWeight) * 100,
    }))
    .sort((a, b) => b.chance - a.chance);

  return (
    <>
      <SiteHeader active="cases" initialBalance={profile?.balance ?? 0} />

      <div className="wrap section">
        <div className="case-header">
          <img src={caseDef.banner_url} alt={caseDef.name} />
          <div className="meta">
            <h1>{caseDef.name}</h1>
            <div className="tagline">{caseDef.tagline}</div>
          </div>
        </div>

        <CaseClient
          caseId={caseDef.id}
          cost={caseDef.cost}
          items={items}
          rarities={rarities}
          balance={profile?.balance ?? 0}
        />

        <h2>Odds</h2>
        <table className="odds-table">
          <thead>
            <tr>
              <th></th>
              <th>Skin</th>
              <th>Rarity</th>
              <th>Chance</th>
            </tr>
          </thead>
          <tbody>
            {odds.map((o) => (
              <tr key={o.skin_key}>
                <td>
                  <img src={o.image_url} alt="" />
                </td>
                <td>{o.name}</td>
                <td>
                  <span className="rarity-dot" style={{ background: rarities[o.rarity]?.color }} />
                  {rarities[o.rarity]?.label}
                </td>
                <td>{o.chance.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="wrap">
        <footer>
          <div>
            ValoCase is an unofficial fan-made demo. Skin names/images are property of Riot Games,
            Inc., sourced from{" "}
            <a href="https://valorant-api.com" target="_blank" rel="noopener">
              valorant-api.com
            </a>
            . Fun currency only &mdash; no real transactions.
          </div>
        </footer>
      </div>
    </>
  );
}
