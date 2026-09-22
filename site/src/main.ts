import "@fontsource-variable/eb-garamond";
import { hyphenateSync } from "hyphen/en-us";
import { prepare, solve, withHyphenation, type Line, type Prepared } from "../../src/engine";
import { compileStatic } from "../../src/static";
import { greedy, render } from "./composer";
import { createMeasurer, fragmentsOf, type Measurer } from "./measure";
import "./style.css";

interface Demo {
  id: string;
  label: string;
  text: string;
  states: string[];
  hero?: boolean;
  narrow?: boolean;
  guides?: boolean;
  hyphenate?: boolean;
  /** One set of fitted lines per state, in order. */
  frames(p: Prepared, width: number, ctx: Context): Line[][];
}

interface Context {
  lineHeight: number;
  measurer: Measurer;
  hyphenate: (word: string) => readonly string[];
}

const demos: Demo[] = [
  {
    id: "paragraph",
    label: "Paragraph",
    text: "Browsers justify text one line at a time. Each line takes as many words as will fit, stretches its gaps to reach the margin, and never looks back. The result is familiar: a tight line beside a loose one, rivers of white running down the page, a single word stranded at the end. Justice fits the whole paragraph at once. It weighs every possible arrangement of breaks and chooses the one whose spacing is most even, from the first line to the last, then nudges letters by fractions of a pixel so the gaps never have to carry the whole burden.",
    states: ["Ragged", "Browser", "Justice"],
    hero: true,
    frames: (p, width) => [greedy(p, width, false), greedy(p, width, true), solve(p, width).lines],
  },
  {
    id: "hanging",
    label: "Optical margins",
    text: "“Punctuation is small,” the typographer said, “but it is not invisible.” Periods, commas, colons, quotes: each carries almost no ink, yet a browser sets every one of them flush, so the margin appears to dent inward wherever a line happens to end in one. Hang them, by their own measured width, and the edge straightens. Hang the opening quote, too, and the first letter sits where the other first letters sit: on the margin, not beside it.",
    states: ["Flush", "Hanging"],
    guides: true,
    frames: (p, width) => [solve(p, width, { hanging: 0, opening: 0 }).lines, solve(p, width, { opening: 0.7 }).lines],
  },
  {
    id: "hyphenation",
    label: "Hyphenation",
    text: "Narrow columns are where justification goes to die. With no way to divide a long word, the browser must stretch a few short ones across the whole measure. Give Justice a hyphenation dictionary and it weighs every possible division against the spacing it would save, preferring whole words, and never hyphenating twice in a row or immediately before the final line. A well-known word may still break at its own hyphen.",
    states: ["Whole words", "Hyphenated"],
    narrow: true,
    hyphenate: true,
    frames: (p, width, ctx) => [
      solve(p, width).lines,
      solve(withHyphenation(p, ctx.hyphenate, ctx.measurer.width), width).lines,
    ],
  },
];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, html?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

interface Mounted {
  section: HTMLElement;
  rebuild(): void;
}

function mount(demo: Demo, container: HTMLElement, ctx: Context): Mounted {
  const section = el("section", `demo${demo.hero ? " hero-demo" : ""}`);
  section.id = demo.id;
  section.setAttribute("aria-label", demo.label);
  const name = el("p", "name sans", demo.label);
  const columns = el("div", "columns");
  columns.style.setProperty("--n", String(demo.states.length));
  const stages = demo.states.map(name => {
    const column = el("div", "column");
    column.append(el("p", "sans state", name));
    const stage = el("div", `stage${demo.narrow ? " narrow" : ""}${demo.guides ? " guides" : ""}`);
    const prose = el("div", "prose");
    prose.setAttribute("role", "img");
    prose.setAttribute("aria-label", `${name}: ${demo.text}`);
    stage.append(el("span", "guide left"), el("span", "guide right"), prose);
    column.append(stage);
    columns.append(column);
    return { stage, prose };
  });
  section.append(name, columns);
  container.append(section);

  const mounted: Mounted = {
    section,
    rebuild() {
      const width = stages[0].stage.getBoundingClientRect().width;
      ctx.measurer.prime(fragmentsOf(demo.text, demo.hyphenate ? ctx.hyphenate : undefined));
      const p = prepare(demo.text, ctx.measurer.width);
      const frames = demo.frames(p, width, ctx);
      stages.forEach(({ prose }, i) => {
        prose.replaceChildren();
        render(prose, p, ctx.measurer, ctx.lineHeight, frames[i]);
      });
    },
  };
  mounted.rebuild();
  return mounted;
}

/** Monochrome highlighting: structure recedes, names and strings stay in ink. */
function highlight(code: string): string {
  const escape = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const token = /(\/\/.*$)|("[^"]*")|\b(import|from|const|let|export|return)\b|([{}()[\],;=])/gm;
  return escape(code).replace(token, (match, comment, string, keyword, punctuation) => {
    const kind = comment ? "c" : string ? "s" : keyword ? "k" : punctuation ? "p" : "";
    return kind ? `<span class="${kind}">${match}</span>` : match;
  });
}

function masthead() {
  const header = el("header", "masthead sans");
  header.innerHTML = `<a class="wordmark" href="/">Justice</a><a href="https://www.npmjs.com/package/@kitlangton/justice" target="_blank" rel="noreferrer">npm</a>`;
  return header;
}

/** The same paragraph, compiled for every width in a range at build time. */
function buildTime(ctx: Context) {
  const section = el("section", "closing");
  section.id = "build";
  const text = demos[0].text;
  ctx.measurer.prime(fragmentsOf(text));
  const p = prepare(text, ctx.measurer.width);
  const [min, max] = [320, 960];
  const started = performance.now();
  const bands = compileStatic(p, min, max, 1);
  const ms = performance.now() - started;
  section.innerHTML = `
    <p class="name sans">Build time</p>
    <div class="content">
      <pre class="code" tabindex="0">${highlight(`import { compileStatic } from "@kitlangton/justice/static"

const bands = compileStatic(paragraph, ${min}, ${max})
// one break plan per range of widths → container-query CSS; no script ships`)}</pre>
      <p class="sans">The first paragraph above, ${min}–${max} px: ${bands.length} break plans, compiled in ${ms.toFixed(1)} ms.</p>
    </div>`;
  return section;
}

function closing() {
  const section = el("section", "closing");
  section.id = "install";
  section.innerHTML = `
    <p class="name sans">Install</p>
    <div class="content">
      <pre class="code" tabindex="0"><span class="k">bun add</span> @kitlangton/justice</pre>
      <p class="sans"><a href="/docs.md">Documentation</a> · <a href="/llms.txt">llms.txt</a></p>
    </div>`;
  return section;
}

function nearest(mounted: Mounted[]): number {
  const middle = innerHeight / 2;
  let best = 0, distance = Infinity;
  mounted.forEach((m, i) => {
    const r = m.section.getBoundingClientRect();
    const d = r.top > middle ? r.top - middle : r.bottom < middle ? middle - r.bottom : 0;
    if (d < distance) { distance = d; best = i; }
  });
  return best;
}

/** ↑ ↓ (or j k) move between examples; nothing else is interactive. */
function keyboard(mounted: Mounted[]) {
  addEventListener("keydown", event => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const step = { ArrowDown: 1, j: 1, ArrowUp: -1, k: -1 }[event.key];
    if (!step) return;
    const next = Math.min(mounted.length - 1, Math.max(0, nearest(mounted) + step));
    mounted[next].section.scrollIntoView({ block: "start" });
    event.preventDefault();
  });
}

async function main() {
  const app = document.getElementById("app")!;
  const host = el("div", "prose measure-host");
  document.body.append(host);
  const family = getComputedStyle(host).fontFamily.split(",")[0].trim();
  await document.fonts.load(`400 20px ${family}`).catch(() => undefined);
  await document.fonts.ready;

  app.append(masthead());
  const ctx: Context = {
    lineHeight: parseFloat(getComputedStyle(host).lineHeight),
    measurer: createMeasurer(host),
    hyphenate: word => hyphenateSync(word, { hyphenChar: "\u00ad", minWordLength: 6 }).split("\u00ad"),
  };
  const mounted = demos.map(demo => mount(demo, app, ctx));
  app.append(buildTime(ctx), closing());
  document.body.classList.add("ready");
  keyboard(mounted);

  let timer: ReturnType<typeof setTimeout> | undefined;
  addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      ctx.lineHeight = parseFloat(getComputedStyle(host).lineHeight);
      ctx.measurer.reset();
      for (const m of mounted) m.rebuild();
    }, 150);
  });
}

main();
