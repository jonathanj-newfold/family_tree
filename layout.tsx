import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import type { Role } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase.from("family_users").select("role, display_name").eq("user_id", user.id).maybeSingle();
  const role = (member?.role ?? null) as Role | null;

  if (!role) {
    return (
      <main className="mx-auto max-w-md p-10 text-center">
        <h1 className="mb-2 text-xl font-semibold">Access pending</h1>
        <p className="mb-6 text-sm text-zinc-400">
          You&apos;re signed in as {user.email}, but the family owner hasn&apos;t granted you access yet.
        </p>
        <form action={signOut}><button className="btn-ghost">Sign out</button></form>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-4">
        <Link href="/" className="text-lg font-semibold">Family Archive</Link>
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span>{member?.display_name ?? user.email} · {role}</span>
          <form action={signOut}><button className="btn-ghost">Sign out</button></form>
        </div>
      </header>
      {children}
    </div>
  );
}
