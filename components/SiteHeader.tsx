"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SiteHeader({
  active,
  initialBalance,
}: {
  active: "home" | "cases" | "inventory";
  initialBalance: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [balance, setBalance] = useState(initialBalance);

  // initialBalance comes from a server component read on every navigation;
  // router.refresh() after a case open / sell re-runs that read.
  useEffect(() => {
    setBalance(initialBalance);
  }, [initialBalance]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="topbar">
        <div className="wrap">
          <div className="logo">
            Valo<span>Case</span>
          </div>
          <ul className="nav-links">
            <li>
              <Link href="/" className={active === "home" || active === "cases" ? "active" : ""}>
                Cases
              </Link>
            </li>
            <li>
              <Link href="/inventory" className={active === "inventory" ? "active" : ""}>
                Inventory
              </Link>
            </li>
          </ul>
          <div className="header-right">
            <div className="balance-pill">{balance.toLocaleString()} VC</div>
            <button className="icon-btn" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </div>
      <div className="disclaimer-strip">
        Play-money demo only &mdash; VC has no real-world value, can&apos;t be purchased or cashed out, and no Valorant accounts are ever involved. Not affiliated with Riot Games.
      </div>
    </>
  );
}
