"use client";

import { FormEvent, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { firebaseAuth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(firebaseAuth, (user) => {
    if (user && !user.isAnonymous) router.replace(`/admin/chat${window.location.search}`);
  }), [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const token = await credential.user.getIdTokenResult(true);
      if (token.claims.admin !== true) {
        await signOut(firebaseAuth);
        throw new Error("This account is not authorized for the admin dashboard.");
      }
      router.replace(`/admin/chat${window.location.search}`);
    } catch (loginError) {
      setError(loginError instanceof Error && loginError.message.includes("not authorized") ? loginError.message : "Invalid email or password.");
      setBusy(false);
    }
  }

  return <main className="admin-auth-shell"><form className="admin-auth-card" onSubmit={submit}><p className="eyebrow">Private workspace</p><h1>Admin chat</h1><p>Sign in to reply to visitors and manage your inbox.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>{error && <p className="admin-error">{error}</p>}<button className="button button--primary" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button></form></main>;
}
