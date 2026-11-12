import { notFound, redirect } from "next/navigation";
import PersonForm from "@/components/PersonForm";
import { createClient } from "@/lib/supabase/server";
import { canEdit, type Person, type Role } from "@/lib/types";
import { toFuzzyInput } from "@/lib/dates";
import { updatePerson } from "../../actions";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase.from("family_users").select("role").eq("user_id", user!.id).maybeSingle();
  if (!canEdit(m?.role as Role)) redirect(`/people/${id}`);
  const { data } = await supabase.from("persons").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Person;
  return (
    <main className="max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Edit {p.given_name}</h1>
      <PersonForm
        action={updatePerson.bind(null, id)}
        cancelHref={`/people/${id}`}
        defaults={{
          ...p,
          birth: toFuzzyInput(p.birth_date, p.birth_date_precision),
          death: toFuzzyInput(p.death_date, p.death_date_precision),
          deceased: !p.is_living,
        }}
      />
    </main>
  );
}
