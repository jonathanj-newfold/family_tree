import { redirect } from "next/navigation";
import PersonForm from "@/components/PersonForm";
import { createClient } from "@/lib/supabase/server";
import { canEdit, type Role } from "@/lib/types";
import { createPerson } from "../actions";

export default async function NewPersonPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: m } = await supabase.from("family_users").select("role").eq("user_id", user!.id).maybeSingle();
  if (!canEdit(m?.role as Role)) redirect("/");
  return (
    <main className="max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Add person</h1>
      <PersonForm action={createPerson} cancelHref="/" />
    </main>
  );
}
