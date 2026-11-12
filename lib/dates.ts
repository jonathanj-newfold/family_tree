import type { Precision } from "./types.ts";

export type FuzzyDate = { date: string | null; precision: Precision };

// Accepts "", "1950", "1950-03", "1950-03-14", with optional "~" prefix for approximate.
// Returns undefined when the text is not understood. Never guesses missing parts.
export function parseFuzzyDate(input: string | null | undefined): FuzzyDate | undefined {
  const t = (input ?? "").trim();
  if (!t) return { date: null, precision: "unknown" };
  const approx = t.startsWith("~");
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(approx ? t.slice(1).trim() : t);
  if (!m) return undefined;
  const [, y, mo, d] = m;
  const month = mo ? Number(mo) : 1;
  const day = d ? Number(d) : 1;
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  const iso = `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const check = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(check.getTime()) || check.toISOString().slice(0, 10) !== iso) return undefined;
  if (approx) return { date: iso, precision: "approximate" };
  return { date: iso, precision: d ? "exact" : mo ? "month" : "year" };
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function formatFuzzyDate(date: string | null, precision: Precision): string {
  if (!date || precision === "unknown") return "Unknown";
  const [y, m, d] = date.split("-");
  if (precision === "year") return y;
  if (precision === "month") return `${MONTHS[Number(m) - 1]} ${y}`;
  const full = `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
  return precision === "approximate" ? `c. ${y}` : full;
}

// Inverse of parseFuzzyDate, for pre-filling edit forms.
export function toFuzzyInput(date: string | null, precision: Precision): string {
  if (!date || precision === "unknown") return "";
  if (precision === "year") return date.slice(0, 4);
  if (precision === "month") return date.slice(0, 7);
  if (precision === "approximate") return `~${date.slice(0, 4)}`;
  return date;
}
