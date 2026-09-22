import { defaults, lineText, solve, type Line, type Options, type Prepared } from "./engine.js";

/** CSS for a fixed choice of breaks. Spacing still follows the actual measure. */
export interface StaticLine {
  line: Line;
  /** Compact per-line inputs for staticSpacing(), reusable across width bands. */
  properties: Record<string, string>;
}

export interface StaticBand {
  min: number;
  max: number;
  /** Null retains native wrapping for an unfit measure. */
  lines: StaticLine[] | null;
}

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const number = (n: number) => String(Number(n.toFixed(10)));
const coefficient = (n: number) => String(Number(n.toFixed(7)));

/** Declare these on each rendered word/fragment and gap. Keeping the expressions
 * shared avoids repeating the fitting algebra in every responsive line rule. */
export function staticSpacing(p: Prepared, policy: Partial<Options> = {}): Record<string, string> {
  const o = { ...defaults, ...policy };
  return {
    "--j-cap": "1000000px",
    "--j-left": "0px",
    "--j-d": "min(var(--j-cap), calc(100cqw - var(--j-n)))",
    "--j-t": `clamp(-${number(o.tracking)}px, calc(min(0px, var(--j-d)) * var(--j-m) + max(0px, var(--j-d)) * var(--j-p)), ${number(o.tracking)}px)`,
    "--j-s": `max(-${number(p.space * o.shrink)}px, calc((var(--j-d) - var(--j-t) * var(--j-c)) / var(--j-g)))`,
    "--j-gap": `calc(${number(p.space)}px + var(--j-t) + var(--j-s))`,
  };
}

/** The same fit budgets as the numerical engine, expressed in container units.
 * Each participating piece/gap receives --j-t = tracking and --j-gap = gap.
 * The containing paragraph supplies container-type:inline-size. */
export function staticLine(p: Prepared, line: Line, policy: Partial<Options> = {}): StaticLine {
  const o = { ...defaults, ...policy };
  const gaps = line.end - line.start - 1;
  const chars = [...graphemes.segment(lineText(p, line))].length;
  const loose = gaps * p.space * o.stretch + chars * o.tracking;
  const tight = gaps * p.space * o.shrink + chars * o.tracking;
  const target = `calc(100cqw - ${number(line.natural - line.hanging - line.opening)}px)`;
  const delta = line.last ? `min(0px, ${target})` : target;
  let spacing = "0px";
  if (gaps && o.mode === "strict") {
      const shrink = tight ? `clamp(-${number(p.space * o.shrink)}px, calc(${delta} * ${number(p.space * o.shrink / tight)}), 0px)` : "0px";
      const stretch = loose ? `clamp(0px, calc(${delta} * ${number(p.space * o.stretch / loose)}), ${number(p.space * o.stretch)}px)` : "0px";
      spacing = `calc(${shrink} + ${stretch})`;
  }
  const properties: Record<string, string> = {
    "--j-n": `${number(line.natural - line.hanging - line.opening)}px`,
    "--j-m": coefficient(tight ? o.tracking / tight : 0),
    "--j-p": coefficient(loose ? o.tracking / loose : 0),
    "--j-c": String(chars),
    "--j-g": String(Math.max(1, gaps)),
  };
  if (line.opening) properties["--j-left"] = `${number(-line.opening)}px`;
  if (line.last) properties["--j-cap"] = "0px";
  if (o.mode === "strict" || !gaps) properties["--j-s"] = spacing;
  return { line, properties };
}

/** Build-time break selection. Equal adjacent plans collapse into one CSS band.
 * Measures are sampled at `step` CSS pixels; spacing is continuous within a band.
 * This deliberately makes the sampling policy explicit rather than claiming an
 * unsampled fractional measure necessarily has the same global optimum. */
export function compileStatic(p: Prepared, min: number, max: number, step = 1, policy: Partial<Options> = {}): StaticBand[] {
  if (!(min > 0) || !(max >= min) || !(step > 0) || ![min, max, step].every(Number.isFinite) || min + step === min || max + step === max) throw new RangeError("Invalid static measure range");
  const bands: StaticBand[] = [];
  let previous = "";
  for (let width = min; width <= max + 1e-8; width = min + Math.round((width - min) / step + 1) * step) {
    const layout = solve(p, width, policy);
    const fitted = !layout.lines.some(line => Math.abs(line.residual) > .5);
    const key = fitted ? JSON.stringify(layout.lines.map(line => [line.start, line.end, line.startOffset, line.endOffset])) : "native";
    if (bands.length && key === previous) bands.at(-1)!.max = width + step;
    else bands.push({ min: width, max: width + step, lines: fitted ? layout.lines.map(line => staticLine(p, line, policy)) : null });
    previous = key;
  }
  return bands;
}
