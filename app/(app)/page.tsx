import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canEdit, fullName, type Person, type Role } from "@/lib/types";

type Row = Pick<Person, "id" | "given_name" | "family_name" | "birth_date" | "birth_date_precision" | "death_date" | "is_living">;
import { formatFuzzyDate } from "@/lib/dates";

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: member } = await supabase.from("family_users").select("role").eq("user_id", user!.id).maybeSingle();

  // Strip characters that have meaning in PostgREST filter syntax.
  const term = q.replace(/[,()%*\\]/g, " ").trim();
  let query = supabase.from("persons")
    .select("id, given_name, family_name, birth_date, birth_date_precision, death_date, is_living")
    .order("family_name", { nullsFirst: false }).order("given_name").limit(500);
  if (term) query = query.or(`given_name.ilike.%${term}%,family_name.ilike.%${term}%,nickname.ilike.%${term}%,maiden_name.ilike.%${term}%`);
  const { data: people, error } = await query;

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <form className="flex-1 min-w-[12rem]" role="search">
          <label htmlFor="q">Search people</label>
          <input id="q" name="q" defaultValue={q} placeholder="Name or nickname" />
        </form>
        {canEdit(member?.role as Role) && <Link href="/people/new" className="btn">Add person</Link>}
      </div>
      {error && <p role="alert" className="text-red-400">Could not load people.</p>}
      {!error && !people?.length && (
        <p className="text-zinc-400">{term ? "No one matches that search." : "No people visible to you yet."}</p>
      )}
      <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {(people as Row[] | null)?.map((p) => (
          <li key={p.id}>
            <Link href={`/people/${p.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-900">
              <span>{fullName(p)}</span>
              <span className="text-sm text-zinc-500">
                {formatFuzzyDate(p.birth_date, p.birth_date_precision)}{!p.is_living ? " – deceased" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
