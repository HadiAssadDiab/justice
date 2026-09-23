import { expect, it } from "vitest";
import { lineText, solve } from "../src/engine";
import { compileStatic } from "../src/static";
import { mobileArticle as p } from "./fixtures/mobile-article";

it.each([false, true])("does not prefer eightfold mobile spaces (dictionary breaks: %s)", hyphenated => {
  // The reported 350px measure selected three words, then stretched its two
  // spaces from 4.84px to 39.37px, despite fitting "models," on that line.
  const { lines } = solve({ ...p, hyphenation: hyphenated ? p.hyphenation : undefined }, 350);
  expect(lineText(p, lines[0])).toBe("OpenCode’s environment (its models,");
  expect(p.space + lines[0].wordSpacing + lines[0].tracking).toBeLessThan(p.space * 1.5);
  for (const line of lines) {
    expect(p.space + line.wordSpacing + line.tracking).toBeLessThan(p.space * (hyphenated ? 3 : 3.5));
    expect(Math.abs(line.residual)).toBeLessThan(0.01);
  }
});

it("preserves source and exact fitting throughout the mobile width range", () => {
  for (let width = 268; width <= 448; width++) {
    const { lines } = solve(p, width);
    const source = lines.map((line, index) => {
      const text = lineText(p, line);
      return (index && !lines[index - 1].endOffset ? " " : "") + (line.hyphenated ? text.slice(0, -1) : text);
    }).join("");
    expect(source).toBe(p.words.join(" "));
    expect(lines.every(line => Math.abs(line.residual) < 0.01)).toBe(true);
    expect(lines.at(-1)!.wordSpacing).toBeLessThanOrEqual(0);
  }
});

it("uses the same improved mobile break in statically compiled output", () => {
  const bands = compileStatic(p, 344, 352);
  const band = bands.find(band => band.min <= 350 && band.max > 350)!;
  expect(band.lines?.map(value => lineText(p, value.line))).toEqual(solve(p, 350).lines.map(line => lineText(p, line)));
  expect(lineText(p, band.lines![0].line)).toBe("OpenCode’s environment (its models,");
});
