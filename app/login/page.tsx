"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setError(error.message);
      setInfo("Account created. Check your email if confirmation is required, then sign in.");
      setMode("signin");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="logo" style={{ marginBottom: 18 }}>
          Valo<span>Case</span>
        </div>
        <div className="tab-row">
          <button
            className={mode === "signin" ? "tab active" : "tab"}
            onClick={() => setMode("signin")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === "signup" ? "tab active" : "tab"}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Email</label>
          <input
            className="field-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="field-label">Password</label>
          <input
            className="field-input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <div className="form-msg error">{error}</div>}
          {info && <div className="form-msg info">{info}</div>}

          <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: 14 }}>
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="auth-note">
          New accounts start with 10,000 fun-money VC. No real payment method is ever requested.
        </p>
      </div>
    </div>
  );
}
