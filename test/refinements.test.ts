import { expect, it } from "vitest";
import { defaults, lineText, prepare, solve, withHyphenation, withOpticalMargins, type Layout } from "../src/engine";

const measure = (text: string) => [...text].reduce((sum, c) => sum + (c === " " ? 4 : 8), 0);
const jumps = (layout: Layout) => layout.lines.slice(1).filter((line, i) => Math.abs(line.fitness! - layout.lines[i].fitness!) > 1).length;

it("retains competing fitness histories and chooses a smoother complete paragraph", () => {
  const text = "A quiet paragraph can become much more comfortable when its lines share a reasonably even rhythm of spaces instead of alternating between very tight and very loose arrangements.";
  const p = prepare(text, measure);
  const independent = solve(p, 300, { adjacentPenalty: 0 });
  const adjacent = solve(p, 300);
  expect(jumps(independent)).toBe(3);
  expect(jumps(adjacent)).toBe(1);
  expect(adjacent.cost).toBeLessThan(independent.cost + jumps(independent) * defaults.adjacentPenalty);
  expect(adjacent.lines.map(line => lineText(p, line)).join(" ")).toBe(text);
  expect(adjacent.lines.reduce((sum, line) => sum + line.cost, 0)).toBeCloseTo(adjacent.cost, 8);
});

it("combines measured margins with punctuation and can disable only the optical model", () => {
  const p = withOpticalMargins(prepare("Thus.", measure), () => ({ start: 2, end: 3 }));
  const on = solve(p, 100).lines[0];
  expect([on.opening, on.hanging]).toEqual([2, 8]);
  const off = solve(p, 100, { protrusion: 0 }).lines[0];
  expect([off.opening, off.hanging]).toEqual([0, 8]);
  const half = solve(p, 100, { protrusion: 0.5, hanging: 0 }).lines[0];
  expect([half.opening, half.hanging]).toEqual([1, 1.5]);
});

it("measures continuation and hyphen edges once, without dropping original word measurements", () => {
  const original = withHyphenation(prepare("abcdefghijklmnopqr", measure), word => word.match(/.{3}/g)!, measure);
  let calls = 0;
  const p = withOpticalMargins(original, text => { calls++; return { start: text.startsWith("a") ? 1 : 2, end: text === "-" ? 4 : 0 }; });
  const count = calls;
  const layout = solve(p, 54, { tracking: 0 });
  expect(layout.lines.some(line => line.hyphenated)).toBe(true);
  for (const line of layout.lines) {
    expect(line.opening).toBe(line.startOffset ? 2 : 1);
    expect(line.hanging).toBe(line.hyphenated ? 4 : 0);
  }
  solve(p, 100); solve(p, 250);
  expect(calls).toBe(count);
  expect(p.widths).toBe(original.widths);
  expect(() => withOpticalMargins(original, () => ({ start: -1, end: 0 }))).toThrow(RangeError);
  expect(() => withOpticalMargins(original, () => ({ start: 0, end: Infinity }))).toThrow(RangeError);
  expect(() => solve(p, 100, { protrusion: 1.1 })).toThrow(RangeError);
});
