import { expect, it } from "vitest";
import { lineText, prepare, solve, withHyphenation, withOpticalMargins } from "../src/engine";
import { compileStatic } from "../src/static";

const measure = (text: string) => [...text].reduce((sum, c) => sum + (c === " " ? 4 : 8), 0);
const p = withOpticalMargins(withHyphenation(prepare("Thus, building responsive paragraphs requires careful typesetting. Keep every source word intact.", measure), word => word === "typesetting." ? ["type", "set", "ting."] : [word], measure), () => ({ start: 1, end: 2 }));

it("covers every sampled measure once, coalescing identical plans without losing hyphens or source", () => {
  const bands = compileStatic(p, 90, 400, .5);
  expect(bands.length).toBeLessThan(621);
  expect(bands.some(b => b.lines?.some(l => l.line.hyphenated))).toBe(true);
  for (let width = 90; width <= 400; width += .5) {
    const selected = bands.filter(b => b.min <= width && b.max > width);
    expect(selected.length).toBe(1);
    const actual = selected[0].lines?.map(l => lineText(p, l.line));
    const layout = solve(p, width);
    expect(actual).toEqual(layout.lines.some(l => Math.abs(l.residual) > .5) ? undefined : layout.lines.map(l => lineText(p, l)));
  }
});

it("retains native fallback for unfit text and validates sampled ranges", () => {
  const word = prepare("Indivisible", measure);
  expect(compileStatic(word, 20, 30)).toEqual([{ min: 20, max: 31, lines: null }]);
  for (const args of [[0, 100, 1], [100, 99, 1], [50, 100, 0], [50, Infinity, 1], [50, 100, NaN], [50, 100, Number.MIN_VALUE]]) expect(() => compileStatic(p, ...args as [number, number, number])).toThrow(RangeError);
  expect(() => compileStatic(p, 90, 100, 1, { shrink: 2 })).toThrow(RangeError);
});
