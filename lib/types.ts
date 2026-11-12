export type Precision = "exact" | "month" | "year" | "approximate" | "unknown";
export type Role = "owner" | "admin" | "contributor" | "viewer";

export type Person = {
  id: string;
  given_name: string;
  middle_name: string | null;
  family_name: string | null;
  maiden_name: string | null;
  nickname: string | null;
  sex: "male" | "female" | "other" | "unknown";
  birth_date: string | null;
  birth_date_precision: Precision;
  birth_place: string | null;
  death_date: string | null;
  death_date_precision: Precision;
  death_place: string | null;
  is_living: boolean;
  bio: string | null;
};

export type PersonRef = Pick<Person, "id" | "given_name" | "family_name"> &
  Partial<Pick<Person, "birth_date" | "birth_date_precision" | "death_date" | "is_living">>;

export const canEdit = (role: Role | null) =>
  role === "owner" || role === "admin" || role === "contributor";

export const fullName = (p: Pick<Person, "given_name" | "family_name">) =>
  [p.given_name, p.family_name].filter(Boolean).join(" ");
