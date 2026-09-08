type Drop = {
  skin_key: string;
  name: string;
  rarity: string;
  image_url: string;
  value: number;
  won_at: string;
};

type Rarity = { key: string; label: string; color: string };

function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function LiveFeed({
  drops,
  rarities,
}: {
  drops: Drop[];
  rarities: Record<string, Rarity>;
}) {
  if (!drops.length) return null;

  // duplicate the list so the CSS marquee can loop seamlessly
  const loop = [...drops, ...drops];

  return (
    <div className="live-feed">
      <div className="live-feed-label">
        <span className="live-dot" /> Live drops
      </div>
      <div className="live-feed-track-wrap">
        <div className="live-feed-track">
          {loop.map((d, i) => {
            const color = rarities[d.rarity]?.color ?? "#888";
            return (
              <div className="live-feed-item" key={`${d.skin_key}-${i}`} style={{ ["--glow" as string]: color }}>
                <img src={d.image_url} alt={d.name} />
                <div className="live-feed-meta">
                  <div className="live-feed-name">{d.name}</div>
                  <div className="live-feed-time">{timeAgo(d.won_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
