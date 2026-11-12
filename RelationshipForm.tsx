"use client";
import { useActionState } from "react";
import type { RelState } from "@/app/(app)/people/actions";

export default function RelationshipForm({ label, kind, action, options }: {
  label: string;
  kind: "parent" | "child" | "spouse";
  action: (state: RelState, fd: FormData) => Promise<RelState>;
  options: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[12rem] flex-1">
        <label htmlFor={`rel-${kind}`}>{label}</label>
        <select id={`rel-${kind}`} name="other_id" defaultValue="">
          <option value="" disabled>Select a person…</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      {kind !== "spouse" ? (
        <div><label htmlFor={`pt-${kind}`}>Type</label>
          <select id={`pt-${kind}`} name="parent_type" defaultValue="biological">
            <option value="biological">Biological</option><option value="adoptive">Adoptive</option>
            <option value="step">Step</option><option value="guardian">Guardian</option><option value="foster">Foster</option>
          </select></div>
      ) : (
        <div><label htmlFor="ut">Type</label>
          <select id="ut" name="union_type" defaultValue="marriage">
            <option value="marriage">Marriage</option><option value="partnership">Partnership</option>
            <option value="civil_union">Civil union</option><option value="other">Other</option>
          </select></div>
      )}
      <button className="btn" disabled={pending}>Add</button>
      {state?.error && <p role="alert" className="w-full text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
