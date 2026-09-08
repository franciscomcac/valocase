import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";

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

  return (
    <>
      <SiteHeader active="cases" initialBalance={profile?.balance ?? 0} />

      <div className="hero">
        <div className="wrap">
          <h1>Open cases. Win skins. Zero dollars spent.</h1>
          <p>
            A fun-money case-opening sandbox built around real Valorant skin data.
            Every account starts with 10,000 VC to burn.
          </p>
          <div className="fake-note">This is a demo/portfolio project, not a store.</div>
        </div>
      </div>

      <div className="wrap section" id="cases">
        <h2>Cases</h2>
        <div className="case-grid">
          {(cases ?? []).map((c) => (
            <div className="case-card" key={c.id}>
              <div className="thumb">
                <img src={c.banner_url} alt={c.name} loading="lazy" />
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
          ))}
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
