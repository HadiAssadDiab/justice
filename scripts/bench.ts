import { prepare, solve } from "../src/engine";

const text = "Interoperability, internationalization, and electroencephalography are perfectly ordinary words until they meet an extraordinarily narrow column. A justification algorithm must make a choice: loosen the spaces, tighten the letters, or admit that this particular line simply cannot fit. Short words are a test too. We go up to the old inn by the sea. It is a place of light and air, of tea at six and long walks in the rain. A few small words can leave a very large hole.";

// Deterministic synthetic advances isolate solver CPU, not browser shaping.
const measure = (s: string) => Array.from(s).reduce((sum, c) => sum + (c === " " ? 4 : /[il.,!]/.test(c) ? 4 : /[MW]/.test(c) ? 12 : 8), 0);
function bench(fn: () => unknown, count: number) {
  const samples: number[] = [];
  for (let round = 0; round < 10; round++) {
    const t = performance.now();
    for (let i = 0; i < count; i++) fn();
    const ms = (performance.now() - t) / count;
    if (round) samples.push(ms);
  }
  samples.sort((a, b) => a - b);
  const median = samples[4];
  const mad = samples.map(x => Math.abs(x - median)).sort((a, b) => a - b)[4];
  return { median_ms: median, mad_ms: mad, min_ms: samples[0], max_ms: samples[8] };
}
const output = [];
for (const copies of [1, 4, 12]) {
  const p = prepare(Array(copies).fill(text).join(" "), measure);
  for (const width of [280, 480, 720]) {
    const result = { words: p.words.length, width, ...bench(() => solve(p, width), copies === 12 ? 4 : 20) };
    output.push(result);
    console.log(JSON.stringify(result));
  }
}
console.log(`METRIC solver_geomean_ms=${Math.exp(output.reduce((s, x) => s + Math.log(x.median_ms), 0) / output.length)}`);
