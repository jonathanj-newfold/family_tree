import { test } from "node:test";
import assert from "node:assert/strict";
import { parseFuzzyDate, formatFuzzyDate, toFuzzyInput } from "./dates.ts";

test("parses each precision", () => {
  assert.deepEqual(parseFuzzyDate(""), { date: null, precision: "unknown" });
  assert.deepEqual(parseFuzzyDate("1950"), { date: "1950-01-01", precision: "year" });
  assert.deepEqual(parseFuzzyDate("1950-03"), { date: "1950-03-01", precision: "month" });
  assert.deepEqual(parseFuzzyDate("1950-03-14"), { date: "1950-03-14", precision: "exact" });
  assert.deepEqual(parseFuzzyDate("~1950"), { date: "1950-01-01", precision: "approximate" });
});

test("rejects bad input instead of guessing", () => {
  for (const bad of ["abc", "1950-13", "1950-02-30", "50", "1950/03/14", "~~1950"]) {
    assert.equal(parseFuzzyDate(bad), undefined, bad);
  }
});

test("accepts leap day only in leap years", () => {
  assert.ok(parseFuzzyDate("1952-02-29"));
  assert.equal(parseFuzzyDate("1951-02-29"), undefined);
});

test("format and input round-trip", () => {
  assert.equal(formatFuzzyDate("1950-01-01", "year"), "1950");
  assert.equal(formatFuzzyDate("1950-03-01", "month"), "Mar 1950");
  assert.equal(formatFuzzyDate("1950-03-14", "exact"), "14 Mar 1950");
  assert.equal(formatFuzzyDate("1950-01-01", "approximate"), "c. 1950");
  assert.equal(formatFuzzyDate(null, "unknown"), "Unknown");
  for (const s of ["1950", "1950-03", "1950-03-14", "~1950"]) {
    const p = parseFuzzyDate(s)!;
    assert.equal(toFuzzyInput(p.date, p.precision), s);
  }
});
