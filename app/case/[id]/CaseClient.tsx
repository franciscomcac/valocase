"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Skin = {
  skin_key: string;
  name: string;
  weapon: string;
  rarity: string;
  image_url: string;
  value: number;
};

type Rarity = { key: string; label: string; color: string };

type OpenResult = { skin_key: string; name: string; image_url: string; value: number; inventory_id: string };

const ITEM_WIDTH = 240;

export default function CaseClient({
  caseId,
  cost,
  items,
  rarities,
  balance,
}: {
  caseId: string;
  cost: number;
  items: Skin[];
  rarities: Record<string, Rarity>;
  balance: number;
}) {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [strip, setStrip] = useState<Skin[]>(items);
  const [translateX, setTranslateX] = useState(0);
  const [transition, setTransition] = useState("none");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<OpenResult | null>(null);
  const [extraCount, setExtraCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [blurAmount, setBlurAmount] = useState(0);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [impact, setImpact] = useState(false);

  const skinByKey = Object.fromEntries(items.map((i) => [i.skin_key, i]));

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function openCase(count: number) {
    if (spinning) return;
    setError(null);
    setResult(null);
    setSpinning(true);
    setFlashColor(null);
    setImpact(false);

    const res = await fetch("/api/case/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId, count }),
    });
    const data = await res.json();

    if (!res.ok || !data.results?.length) {
      setSpinning(false);
      setError(data.error ?? "Couldn't open that case.");
      return;
    }

    const results: OpenResult[] = data.results;
    const winner = results[0];

    // build a long filler strip with the real winner planted near the end
    const stripLength = 60;
    const targetIndex = 50;
    const built: Skin[] = [];
    for (let i = 0; i < stripLength; i++) {
      if (i === targetIndex) {
        built.push(skinByKey[winner.skin_key] ?? items[0]);
      } else {
        built.push(items[Math.floor(Math.random() * items.length)]);
      }
    }

    setTransition("none");
    setTranslateX(0);
    setStrip(built);
    setBlurAmount(0);

    requestAnimationFrame(() => {
      const viewportWidth = viewportRef.current?.clientWidth ?? 1060;
      const jitter = (Math.random() * 0.6 - 0.3) * ITEM_WIDTH;
      const targetX = -(targetIndex * ITEM_WIDTH + ITEM_WIDTH / 2 - viewportWidth / 2) + jitter;
      requestAnimationFrame(() => {
        setTransition("transform 5.2s cubic-bezier(0.11, 0.79, 0.15, 1)");
        setTranslateX(targetX);
        // motion blur ramps up hard on launch, then eases off as the reel
        // decelerates into the winner - tied to the same cubic-bezier feel
        setBlurAmount(7);
        setTimeout(() => setBlurAmount(3), 900);
        setTimeout(() => setBlurAmount(1.2), 2600);
        setTimeout(() => setBlurAmount(0), 4600);
      });
    });

    const winnerColor = rarities[skinByKey[winner.skin_key]?.rarity]?.color ?? "#f2b632";

    setTimeout(() => {
      setFlashColor(winnerColor);
      setImpact(true);
      setTimeout(() => setImpact(false), 450);
    }, 5150);

    setTimeout(() => {
      setResult(winner);
      setExtraCount(results.length - 1);
      setSpinning(false);
      router.refresh(); // re-pull balance from the server for the header pill
    }, 5300);
  }

  async function sellResult() {
    if (!result) return;
    const res = await fetch("/api/inventory/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId: result.inventory_id }),
    });
    const data = await res.json();
    if (res.ok) {
      flashToast(`Sold ${result.name} for ${result.value.toLocaleString()} VC`);
      setResult(null);
      router.refresh();
    } else {
      flashToast(data.error ?? "Couldn't sell that item.");
    }
  }

  return (
    <>
      <div className="open-controls">
        <button className="btn" disabled={spinning || balance < cost} onClick={() => openCase(1)}>
          Open for {cost.toLocaleString()} VC
        </button>
        <button
          className="btn btn-outline btn-small"
          disabled={spinning || balance < cost * 10}
          onClick={() => openCase(10)}
        >
          Open x10
        </button>
        {error && <span style={{ color: "#e08080", fontSize: 13 }}>{error}</span>}
      </div>

      {result && (
        <div className="result-banner show">
          <div
            className="reel-item-glow result-glow"
            style={{ ["--glow" as string]: rarities[skinByKey[result.skin_key]?.rarity]?.color ?? "#888" }}
          >
            <img src={result.image_url} alt={result.name} />
          </div>
          <div className="rb-text">
            <div className="won-label">You unboxed</div>
            <div className="won-name">
              {result.name}
              {extraCount > 0 ? ` (+${extraCount} more in your inventory)` : ""}
            </div>
          </div>
          <button className="btn btn-small" onClick={sellResult}>
            Sell for {result.value.toLocaleString()} VC
          </button>
          <button className="btn btn-outline btn-small" onClick={() => setResult(null)}>
            Keep it
          </button>
        </div>
      )}

      <div
        ref={viewportRef}
        className={`reel-viewport${spinning ? " is-spinning" : ""}${impact ? " is-impact" : ""}`}
        style={flashColor ? ({ ["--flash" as string]: flashColor } as React.CSSProperties) : undefined}
      >
        <div className="reel-scanlines" />
        <div className="reel-corner tl" />
        <div className="reel-corner tr" />
        <div className="reel-corner bl" />
        <div className="reel-corner br" />
        <div className="reel-marker" />
        {impact && <div className="reel-flash" />}
        <div
          className="reel-track"
          style={{
            transform: `translateX(${translateX}px)`,
            transition,
            filter: blurAmount ? `blur(${blurAmount}px)` : "none",
          }}
        >
          {strip.map((skin, i) => {
            const color = rarities[skin.rarity]?.color ?? "#888";
            return (
              <div className="reel-item" key={i}>
                <div className="reel-item-glow" style={{ ["--glow" as string]: color }}>
                  <img src={skin.image_url} alt={skin.name} />
                </div>
                <div className="name">{skin.name}</div>
                <div className="rarity-bar" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              </div>
            );
          })}
        </div>
      </div>

      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
