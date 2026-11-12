"use client";
import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/login/actions";

export default function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "in" ? signIn : signUp, null);
  return (
    <form action={action} className="card w-full max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Family Archive</h1>
      {mode === "up" && (
        <div><label htmlFor="name">Your name</label><input id="name" name="name" autoComplete="name" /></div>
      )}
      <div><label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
      <div><label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete={mode === "in" ? "current-password" : "new-password"} /></div>
      {state?.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
      {state?.message && <p className="text-sm text-emerald-400">{state.message}</p>}
      <button className="btn w-full justify-center" disabled={pending}>{mode === "in" ? "Sign in" : "Create account"}</button>
      <button type="button" className="w-full text-center text-sm text-zinc-400 hover:text-zinc-200"
        onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
