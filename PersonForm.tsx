"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { FormState } from "@/app/(app)/people/actions";

export type PersonDefaults = {
  given_name?: string; middle_name?: string | null; family_name?: string | null; maiden_name?: string | null;
  nickname?: string | null; sex?: string; birth?: string; birth_place?: string | null;
  death?: string; death_place?: string | null; deceased?: boolean; bio?: string | null;
};

export default function PersonForm({ action, defaults = {}, cancelHref }: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  defaults?: PersonDefaults;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="given_name">Given name *</label><input id="given_name" name="given_name" required defaultValue={defaults.given_name} /></div>
        <div><label htmlFor="middle_name">Middle name</label><input id="middle_name" name="middle_name" defaultValue={defaults.middle_name ?? ""} /></div>
        <div><label htmlFor="family_name">Family name</label><input id="family_name" name="family_name" defaultValue={defaults.family_name ?? ""} /></div>
        <div><label htmlFor="maiden_name">Maiden / birth name</label><input id="maiden_name" name="maiden_name" defaultValue={defaults.maiden_name ?? ""} /></div>
        <div><label htmlFor="nickname">Nickname</label><input id="nickname" name="nickname" defaultValue={defaults.nickname ?? ""} /></div>
        <div><label htmlFor="sex">Sex</label>
          <select id="sex" name="sex" defaultValue={defaults.sex ?? "unknown"}>
            <option value="unknown">Unknown</option><option value="female">Female</option>
            <option value="male">Male</option><option value="other">Other</option>
          </select></div>
        <div><label htmlFor="birth">Born (YYYY, YYYY-MM, YYYY-MM-DD, ~ = approx.)</label><input id="birth" name="birth" defaultValue={defaults.birth ?? ""} placeholder="e.g. 1948 or ~1920" /></div>
        <div><label htmlFor="birth_place">Birthplace</label><input id="birth_place" name="birth_place" defaultValue={defaults.birth_place ?? ""} /></div>
        <div><label htmlFor="death">Died</label><input id="death" name="death" defaultValue={defaults.death ?? ""} placeholder="Leave empty if living or unknown" /></div>
        <div><label htmlFor="death_place">Place of death</label><input id="death_place" name="death_place" defaultValue={defaults.death_place ?? ""} /></div>
      </div>
      <label className="flex items-center gap-2 normal-case tracking-normal text-sm text-zinc-300">
        <input type="checkbox" name="deceased" defaultChecked={defaults.deceased} className="!w-auto" />
        Deceased (date unknown)
      </label>
      <div><label htmlFor="bio">Biography</label><textarea id="bio" name="bio" rows={5} defaultValue={defaults.bio ?? ""} /></div>

      {state?.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
      {state?.duplicates && (
        <div role="alert" className="rounded-md border border-amber-600/60 bg-amber-950/30 p-3 text-sm">
          <p className="mb-2 font-medium text-amber-300">Possible duplicates already exist:</p>
          <ul className="mb-3 list-disc pl-5">
            {state.duplicates.map((d) => (
              <li key={d.person_id}><Link className="underline" href={`/people/${d.person_id}`} target="_blank">{d.full_name}</Link>{d.birth_date ? ` (b. ${d.birth_date.slice(0, 4)})` : ""}</li>
            ))}
          </ul>
          <label className="flex items-center gap-2 normal-case tracking-normal text-sm text-zinc-200">
            <input type="checkbox" name="confirm_duplicate" className="!w-auto" /> This is a different person, create anyway
          </label>
        </div>
      )}
      <div className="flex gap-3">
        <button className="btn" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        <Link href={cancelHref} className="btn-ghost">Cancel</Link>
      </div>
    </form>
  );
}
