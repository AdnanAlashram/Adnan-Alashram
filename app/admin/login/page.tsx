"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!response.ok) {
      setError((await response.json().catch(() => ({ error: "Unable to sign in." }))).error);
      setBusy(false);
      return;
    }
    const conversation = new URLSearchParams(window.location.search).get("conversation");
    router.replace(`/admin/chat${conversation ? `?conversation=${encodeURIComponent(conversation)}` : ""}`);
  }

  return <main className="admin-auth-shell"><form className="admin-auth-card" onSubmit={submit}>
    <p className="eyebrow">Private workspace</p>
    <h1>Admin chat</h1>
    <p>Sign in to reply to visitors and manage your inbox.</p>
    <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
    <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
    {error && <p className="admin-error">{error}</p>}
    <button className="button button--primary" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
  </form></main>;
}
