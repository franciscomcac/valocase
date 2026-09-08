import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import ParallaxHero from "@/components/ParallaxHero";
import LiveFeed from "@/components/LiveFeed";

const ASSET_BASE =
  "https://fwukxevjcgdialzxwxoi.supabase.co/storage/v1/object/public/site-assets";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user!.id)
    .single();

  const { data: cases } = await supabase
    .from("cases")
    .select("id, name, tagline, cost, banner_url, disabled")
    .order("cost", { ascending: true });

  const { data: rarityRows } = await supabase.from("rarities").select("key, label, color");
  const rarities = Object.fromEntries((rarityRows ?? []).map((r) => [r.key, r]));

  const { data: drops } = await supabase.rpc("recent_drops", { p_limit: 14 });

  return (
    <>
      <SiteHeader active="cases" initialBalance={profile?.balance ?? 0} />

      <ParallaxHero backdropUrl={`${ASSET_BASE}/hero-backdrop.png`}>
        <div className="hero-eyebrow">Fan-made &middot; fun-money only</div>
        <h1>Open cases. Win skins. Zero dollars spent.</h1>
        <p>
          A fun-money case-opening sandbox built around real Valorant skin data.
          Every account starts with 10,000 VC to burn.
        </p>
        <div className="fake-note">This is a demo/portfolio project, not a store.</div>
      </ParallaxHero>

      <LiveFeed drops={drops ?? []} rarities={rarities} />

      <div className="wrap-wide section" id="cases">
        <h2>Cases</h2>
        <div className="case-grid">
          {(() => {
            const list = cases ?? [];
            // one open case gets the big feature slot; the rest stack beside it -
            // an asymmetric 12-col layout instead of a uniform card grid
            const featuredIdx = list.findIndex((c) => !c.disabled);
            const slots = ["feature", "side1", "side2"];
            let slotCursor = 0;
            return list.map((c, i) => {
              const slot = i === featuredIdx ? "feature" : slots.filter((s) => s !== "feature")[slotCursor++] ?? "side1";
              return (
                <div className={`case-card ${slot}${c.disabled ? " is-locked" : ""}`} key={c.id}>
                  <div className="banner" style={{ backgroundImage: `url(${c.banner_url})` }}>
                    {c.disabled && <div className="ribbon">Coming Soon</div>}
                    <div className="banner-fade" />
                  </div>
                  <div className="info">
                    <h3>{c.name}</h3>
                    <div className="tagline">{c.tagline}</div>
                    <div className="price-row">
                      <span className="price-tag">{c.cost.toLocaleString()} VC</span>
                      {c.disabled ? (
                        <button className="btn disabled" disabled>
                          Locked
                        </button>
                      ) : (
                        <Link className="btn" href={`/case/${c.id}`}>
                          Open
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      <div className="wrap">
        <footer>
          <div>
            ValoCase is an unofficial fan-made demo. VALORANT and all associated skin
            names/images are property of Riot Games, Inc. Skin artwork sourced from the
            public <a href="https://valorant-api.com" target="_blank" rel="noopener">valorant-api.com</a> project.
            No real currency, purchases, or account transfers occur anywhere on this site.
          </div>
        </footer>
      </div>
    </>
  );
}
