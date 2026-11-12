"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string } | null;

export async function signIn(_: AuthState, fd: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email") ?? "").trim(),
    password: String(fd.get("password") ?? ""),
  });
  if (error) return { error: "Sign-in failed. Check your email and password." };
  redirect("/");
}

export async function signUp(_: AuthState, fd: FormData): Promise<AuthState> {
  const password = String(fd.get("password") ?? "");
  if (password.length < 10) return { error: "Use a password of at least 10 characters." };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(fd.get("email") ?? "").trim(),
    password,
    options: { data: { display_name: String(fd.get("name") ?? "").trim() || undefined } },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/");
  return { message: "Account created. Check your email to confirm it, then sign in. The family owner must grant you access." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
