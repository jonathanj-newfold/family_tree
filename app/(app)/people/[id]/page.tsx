import Link from "next/link";
import { notFound } from "next/navigation";
import RelationshipForm from "@/components/RelationshipForm";
import { createClient } from "@/lib/supabase/server";
import { canEdit, fullName, type Person, type PersonRef, type Role } from "@/lib/types";
import { formatFuzzyDate } from "@/lib/dates";
import { addRelationship } from "../actions";

type Ref = Pick<PersonRef, "id" | "given_name" | "family_name">;
const REF = "id, given_name, family_name";

const uniq = <T extends { person: Ref | null }>(rows: T[] | null) => {
  const seen = new Map<string, T>();
  (rows ?? []).forEach((r) => r.person && !seen.has(r.person.id) && seen.set(r.person.id, r));
  return [...seen.values()];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card"><h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>{children}</section>;
}

function People({ rows, empty }: { rows: { person: Ref; note?: string }[]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-zinc-500">{empty}</p>;
  return (
    <ul className="space-y-1">
      {rows.map(({ person, note }) => (
        <li key={person.id}><Link className="text-emerald-400 hover:underline" href={`/people/${person.id}`}>{fullName(person)}</Link>
          {note && <span className="ml-2 text-xs text-zinc-500">{note}</span>}</li>
      ))}
    </ul>
  );
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase.from("family_users").select("role").eq("user_id", user!.id).maybeSingle();
  const editable = canEdit(m?.role as Role);

  const { data: personRow } = await supabase.from("persons").select("*").eq("id", id).maybeSingle();
  if (!personRow) notFound(); // also what a viewer gets for a living person
  const p = personRow as Person;

  const [parentsQ, childrenQ, memberQ] = await Promise.all([
    supabase.from("parent_child").select(`parent_type, person:persons!parent_child_parent_id_fkey(${REF})`).eq("child_id", id),
    supabase.from("parent_child").select(`parent_type, person:persons!parent_child_child_id_fkey(${REF})`).eq("parent_id", id),
    supabase.from("union_members").select("union_id").eq("person_id", id),
  ]);
  const parents = uniq(parentsQ.data as unknown as { parent_type: string; person: Ref | null }[] | null);
  const children = uniq(childrenQ.data as unknown as { parent_type: string; person: Ref | null }[] | null);
  const unionIds = (memberQ.data ?? []).map((r) => r.union_id as string);
  const parentIds = parents.map((r) => r.person!.id);

  const [sibQ, spouseQ, optQ] = await Promise.all([
    parentIds.length
      ? supabase.from("parent_child").select(`person:persons!parent_child_child_id_fkey(${REF})`).in("parent_id", parentIds).neq("child_id", id)
      : Promise.resolve({ data: [] as unknown[] }),
    unionIds.length
      ? supabase.from("union_members").select(`union:unions!union_members_union_id_fkey(union_type, status), person:persons!union_members_person_id_fkey(${REF})`).in("union_id", unionIds).neq("person_id", id)
      : Promise.resolve({ data: [] as unknown[] }),
    editable ? supabase.from("persons").select(REF).neq("id", id).order("family_name").order("given_name").limit(1000) : Promise.resolve({ data: [] as Ref[] }),
  ]);
  const siblings = uniq(sibQ.data as { person: Ref | null }[] | null);
  const spouses = uniq(spouseQ.data as unknown as { union: { union_type: string; status: string } | null; person: Ref | null }[] | null);
  const options = ((optQ.data ?? []) as Ref[]).map((o) => ({ id: o.id, name: fullName(o) }));

  const names = [p.nickname && `“${p.nickname}”`, p.maiden_name && `born ${p.maiden_name}`].filter(Boolean).join(" · ");

  return (
    <main className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{[p.given_name, p.middle_name, p.family_name].filter(Boolean).join(" ")}</h1>
          {names && <p className="text-sm text-zinc-400">{names}</p>}
        </div>
        {editable && <Link href={`/people/${id}/edit`} className="btn-ghost">Edit</Link>}
      </div>

      <Section title="Life">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-zinc-500">Born</dt><dd>{formatFuzzyDate(p.birth_date, p.birth_date_precision)}{p.birth_place ? `, ${p.birth_place}` : ""}</dd></div>
          <div><dt className="text-zinc-500">{p.is_living ? "Status" : "Died"}</dt>
            <dd>{p.is_living ? "Living" : `${formatFuzzyDate(p.death_date, p.death_date_precision)}${p.death_place ? `, ${p.death_place}` : ""}`}</dd></div>
        </dl>
        {p.bio && <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-300">{p.bio}</p>}
      </Section>

      <div className="grid gap-5 md:grid-cols-2">
        <Section title="Parents"><People rows={parents.map((r) => ({ person: r.person!, note: r.parent_type !== "biological" ? r.parent_type : undefined }))} empty="None recorded" /></Section>
        <Section title="Spouses & partners"><People rows={spouses.map((r) => ({ person: r.person!, note: r.union ? r.union.union_type.replace("_", " ") : undefined }))} empty="None recorded" /></Section>
        <Section title="Children"><People rows={children.map((r) => ({ person: r.person!, note: r.parent_type !== "biological" ? r.parent_type : undefined }))} empty="None recorded" /></Section>
        <Section title="Siblings (share at least one parent)"><People rows={siblings.map((r) => ({ person: r.person! }))} empty="None recorded" /></Section>
      </div>

      {editable && (
        <Section title="Add relationship">
          <div className="space-y-4">
            <RelationshipForm label="Add a parent" kind="parent" options={options} action={addRelationship.bind(null, id, "parent")} />
            <RelationshipForm label="Add a child" kind="child" options={options} action={addRelationship.bind(null, id, "child")} />
            <RelationshipForm label="Add a spouse or partner" kind="spouse" options={options} action={addRelationship.bind(null, id, "spouse")} />
            <p className="text-xs text-zinc-500">Not in the list? Add the person first, then link them here.</p>
          </div>
        </Section>
      )}
    </main>
  );
}
