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

  // Two-stage landing physics: the reel doesn't ease straight into the
  // winner, it overshoots slightly past it (fast, weighty deceleration)
  // then snaps back with a small bounce - like something with real mass
  // settling, not a div gliding to a stop. Both phases are driven by
  // actual CSS transitions (transform + filter share the same duration),
  // never by a setTimeout guessing where the animation "probably" is.
  const phaseRef = useRef<"idle" | "phase1" | "phase2">("idle");
  const exactTargetRef = useRef(0);
  const pendingWinnerRef = useRef<OpenResult | null>(null);
  const pendingCountRef = useRef(0);

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
    pendingWinnerRef.current = winner;
    pendingCountRef.current = results.length;

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
    setBlurAmount(8); // full blur, set instantly (no transition) before launch

    requestAnimationFrame(() => {
      const viewportWidth = viewportRef.current?.clientWidth ?? 1060;
      const jitter = (Math.random() * 0.4 - 0.2) * ITEM_WIDTH;
      const targetX = -(targetIndex * ITEM_WIDTH + ITEM_WIDTH / 2 - viewportWidth / 2) + jitter;
      exactTargetRef.current = targetX;
      const overshootX = targetX - ITEM_WIDTH * 0.16;

      requestAnimationFrame(() => {
        phaseRef.current = "phase1";
        setTransition("transform 4.6s cubic-bezier(0.12, 0.85, 0.16, 1), filter 4.2s ease-out");
        setTranslateX(overshootX);
        setBlurAmount(0); // decays over the same 4.2s, tied to the transition itself
      });
    });
  }

  function handleTrackTransitionEnd(e: React.TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== "transform") return;

    if (phaseRef.current === "phase1") {
      // bounce back from the overshoot to the exact winning position
      phaseRef.current = "phase2";
      setTransition("transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1)");
      setTranslateX(exactTargetRef.current);
      return;
    }

    if (phaseRef.current === "phase2") {
      phaseRef.current = "idle";
      const winner = pendingWinnerRef.current;
      if (!winner) return;
      const winnerColor = rarities[skinByKey[winner.skin_key]?.rarity]?.color ?? "#f2b632";
      setFlashColor(winnerColor);
      setImpact(true);
      setTimeout(() => setImpact(false), 450);
      setResult(winner);
      setExtraCount(pendingCountRef.current - 1);
      setSpinning(false);
      router.refresh(); // re-pull balance from the server for the header pill
    }
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
            className={`reel-item-glow result-glow tier-${skinByKey[result.skin_key]?.rarity ?? "common"}`}
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
          onTransitionEnd={handleTrackTransitionEnd}
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
                <div className={`reel-item-glow tier-${skin.rarity}`} style={{ ["--glow" as string]: color }}>
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
