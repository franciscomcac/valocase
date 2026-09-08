"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; skin_key: string; name: string; rarity: string; image_url: string; value: number };
type Rarity = { key: string; label: string; color: string };

export default function InventoryClient({
  inventory,
  rarities,
}: {
  inventory: Item[];
  rarities: Record<string, Rarity>;
}) {
  const router = useRouter();
  const [items, setItems] = useState(inventory);
  const [toast, setToast] = useState<string | null>(null);

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function sell(item: Item) {
    const res = await fetch("/api/inventory/sell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventoryId: item.id }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      flashToast(`Sold ${item.name} for ${item.value.toLocaleString()} VC`);
      router.refresh();
    } else {
      flashToast(data.error ?? "Couldn't sell that item.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="empty-note">
        No skins yet. Go <a href="/">open a case</a>.
      </div>
    );
  }

  return (
    <>
      <div className="inv-grid">
        {items.map((item) => (
          <div className="inv-card" key={item.id}>
            <img src={item.image_url} alt={item.name} />
            <div className="name">{item.name}</div>
            <div style={{ fontSize: 11, color: rarities[item.rarity]?.color, marginBottom: 6 }}>
              {rarities[item.rarity]?.label}
            </div>
            <div className="val">{item.value.toLocaleString()} VC</div>
            <button className="btn btn-small" onClick={() => sell(item)}>
              Sell
            </button>
          </div>
        ))}
      </div>
      {toast && <div className="toast show">{toast}</div>}
    </>
  );
}
