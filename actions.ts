"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseFuzzyDate } from "@/lib/dates";

export type Duplicate = { person_id: string; full_name: string; birth_date: string | null };
export type FormState = { error?: string; duplicates?: Duplicate[] } | null;

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim() || null;

function readPerson(fd: FormData) {
  const given_name = text(fd, "given_name");
  if (!given_name) return { error: "Given name is required." } as const;
  const birth = parseFuzzyDate(text(fd, "birth"));
  const death = parseFuzzyDate(text(fd, "death"));
  if (!birth) return { error: "Birth date: use YYYY, YYYY-MM or YYYY-MM-DD (prefix ~ if approximate)." } as const;
  if (!death) return { error: "Death date: use YYYY, YYYY-MM or YYYY-MM-DD (prefix ~ if approximate)." } as const;
  const sex = text(fd, "sex") ?? "unknown";
  if (!["male", "female", "other", "unknown"].includes(sex)) return { error: "Invalid sex value." } as const;
  const deceased = fd.get("deceased") === "on" || death.date !== null;
  return {
    values: {
      given_name,
      middle_name: text(fd, "middle_name"),
      family_name: text(fd, "family_name"),
      maiden_name: text(fd, "maiden_name"),
      nickname: text(fd, "nickname"),
      sex,
      birth_date: birth.date, birth_date_precision: birth.precision, birth_place: text(fd, "birth_place"),
      death_date: death.date, death_date_precision: death.precision, death_place: text(fd, "death_place"),
      is_living: !deceased,
      bio: text(fd, "bio"),
    },
  } as const;
}

export async function createPerson(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = readPerson(fd);
  if ("error" in parsed) return { error: parsed.error };
  const supabase = await createClient();

  if (fd.get("confirm_duplicate") !== "on") {
    const name = [parsed.values.given_name, parsed.values.family_name].filter(Boolean).join(" ");
    const { data } = await supabase.rpc("find_similar_persons", { p_name: name, p_threshold: 0.6 });
    if (data?.length) return { duplicates: data as Duplicate[] };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("persons").insert({ ...parsed.values, created_by: user?.id }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/people/${data.id}`);
}

export async function updatePerson(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const parsed = readPerson(fd);
  if ("error" in parsed) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase.from("persons").update(parsed.values).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/people/${id}`);
  redirect(`/people/${id}`);
}

export type RelState = { error?: string } | null;

export async function addRelationship(personId: string, kind: "parent" | "child" | "spouse", _: RelState, fd: FormData): Promise<RelState> {
  const otherId = text(fd, "other_id");
  if (!otherId) return { error: "Choose a person." };
  if (otherId === personId) return { error: "Choose a different person." };
  const supabase = await createClient();

  if (kind === "spouse") {
    const { error } = await supabase.rpc("create_union", { p_a: personId, p_b: otherId, p_type: text(fd, "union_type") ?? "marriage" });
    if (error) return { error: error.message };
  } else {
    const parent_type = text(fd, "parent_type") ?? "biological";
    const row = kind === "parent"
      ? { parent_id: otherId, child_id: personId, parent_type }
      : { parent_id: personId, child_id: otherId, parent_type };
    const { error } = await supabase.from("parent_child").insert(row);
    if (error) {
      return { error: error.code === "23505" ? "That relationship is already recorded." : error.message };
    }
  }
  revalidatePath(`/people/${personId}`);
  return null;
}
