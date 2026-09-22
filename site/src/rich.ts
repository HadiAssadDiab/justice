import "@fontsource-variable/eb-garamond";
import { hyphenateSync } from "hyphen/en-us";
import { solve } from "../../src/engine";
import { prepareRich, lineRuns, type RichRun } from "../../src/rich";

type Mark = { tag: "a" | "strong" | "em" | "code" | "u" | "span"; href?: string; className?: string };
type Marks = readonly Mark[];
const source = document.querySelector<HTMLElement>("#source")!;
const composed = document.querySelector<HTMLElement>("#composed")!;
const host = document.querySelector<HTMLElement>("#measure")!;
const slider = document.querySelector<HTMLInputElement>("#width")!;
const output = document.querySelector<HTMLOutputElement>("#width-value")!;
const allowed = new Set(["a", "strong", "em", "code", "u", "span"]);
const runs: RichRun<Marks>[] = [];
const linkMarks = new WeakMap<Element, Mark>();
const linkFragments = new Map<Mark, HTMLElement[]>();
let hoveredLink: Mark | undefined;

// This demo adapts its own inline HTML. Applications own their markup policy;
// the rich-text entry point stores metadata and never parses or injects HTML.
function read(node: Node, marks: Marks) {
  if (node.nodeType === Node.TEXT_NODE) {
    runs.push({ text: node.textContent!, marks });
    return;
  }
  if (node instanceof HTMLElement && allowed.has(node.localName)) {
    const mark: Mark = { tag: node.localName as Mark["tag"] };
    if (node instanceof HTMLAnchorElement && /^https?:$/.test(new URL(node.href).protocol)) mark.href = node.href;
    if (node.classList.contains("small-caps")) mark.className = "small-caps";
    if (node.classList.contains("accent")) mark.className = "accent";
    marks = [...marks, mark];
  }
  node.childNodes.forEach(child => read(child, marks));
}
read(source, []);

function markElement(mark: Mark) {
  const element = document.createElement(mark.tag);
  if (mark.href) element.setAttribute("href", mark.href);
  if (mark.tag === "a") linkMarks.set(element, mark);
  if (mark.className) element.className = mark.className;
  return element;
}

function linkAt(target: EventTarget | null): Mark | undefined {
  const anchor = target instanceof Element ? target.closest("a") : null;
  return anchor ? linkMarks.get(anchor) : undefined;
}

function hoverLink(mark: Mark | undefined) {
  if (mark === hoveredLink) return;
  if (hoveredLink) for (const anchor of linkFragments.get(hoveredLink) ?? []) anchor.classList.remove("is-hovered");
  hoveredLink = mark;
  if (mark) for (const anchor of linkFragments.get(mark) ?? []) anchor.classList.add("is-hovered");
}

// A source link may occupy several lines or part of a word. Share its hover
// state by mark identity; separate links to the same URL remain independent.
composed.addEventListener("pointerover", event => hoverLink(linkAt(event.target)));
composed.addEventListener("pointerout", event => hoverLink(linkAt(event.relatedTarget)));

function appendRuns(parent: HTMLElement, parts: readonly RichRun<Marks>[], depth = 0) {
  for (const run of parts) {
    let target = parent;
    for (const mark of run.marks.slice(depth)) {
      const element = markElement(mark);
      target.append(element);
      target = element;
    }
    if (run.generated) {
      const hyphen = document.createElement("span");
      hyphen.className = "generated";
      hyphen.setAttribute("aria-hidden", "true");
      hyphen.textContent = run.text;
      target.append(hyphen);
    } else target.append(document.createTextNode(run.text));
  }
}

await document.fonts.ready;
const hyphenate = (word: string) => hyphenateSync(word).split("\u00ad");
const requests = new Map<string, readonly RichRun<Marks>[]>();
const key = (parts: readonly RichRun<Marks>[]) => JSON.stringify(parts);
const space: RichRun<Marks>[] = [{ text: " ", marks: [] }];
requests.set(key(space), space);
// Collect the engine's measurement requests first, then batch every DOM write
// before reading any width. Only this first preparation touches layout.
prepareRich(runs, parts => { requests.set(key(parts), parts); return 1; }, { space: 1, hyphenate });
const elements = [...requests].map(([id, parts]) => {
  const element = document.createElement("span");
  appendRuns(element, parts);
  return { id, element };
});
host.append(...elements.map(({ element }) => element));
const widths = new Map(elements.map(({ id, element }) => [id, element.getBoundingClientRect().width]));
host.replaceChildren();
const prepared = prepareRich(runs, parts => widths.get(key(parts))!, { space: widths.get(key(space))!, hyphenate });
requests.clear();
widths.clear();
elements.length = 0;

let lastWidth = 0;
function render() {
  const width = composed.getBoundingClientRect().width;
  if (width === lastWidth) return;
  lastWidth = width;
  const layout = solve(prepared, width);
  const fragment = document.createDocumentFragment();
  for (const line of layout.lines) {
    const row = document.createElement("span");
    row.className = "line";
    row.style.marginLeft = `${-line.opening}px`;
    let active: Marks = [];
    const parents = [row];
    for (const piece of lineRuns(prepared, line)) {
      // Lift shared outer tags around adjacent words and gaps. A link then
      // remains one continuous click target on each line, including its spaces.
      const common: Mark[] = [];
      for (const mark of piece.runs[0].marks) {
        if (!piece.runs.every(run => run.marks[common.length] === mark)) break;
        common.push(mark);
      }
      let shared = 0;
      while (shared < common.length && common[shared] === active[shared]) shared++;
      parents.length = shared + 1;
      for (const mark of common.slice(shared)) {
        const element = markElement(mark);
        parents.at(-1)!.append(element);
        parents.push(element);
      }
      active = common;
      const element = document.createElement("span");
      element.className = piece.kind === "word" ? "word" : "gap";
      if (piece.kind === "word") element.style.letterSpacing = `${line.tracking}px`;
      else element.style.width = `${prepared.space + line.wordSpacing + line.tracking}px`;
      appendRuns(element, piece.runs, common.length);
      parents.at(-1)!.append(element);
    }
    // Preserve the source separator for copying, without adding visual advance.
    // A discretionary break inside a word has no source separator.
    if (!line.last && line.endOffset === undefined) {
      const separator = document.createElement("span");
      separator.className = "source-space";
      separator.textContent = " ";
      row.append(separator);
    }
    fragment.append(row);
  }
  composed.replaceChildren(fragment);
  linkFragments.clear();
  hoveredLink = undefined;
  for (const anchor of composed.querySelectorAll("a")) {
    const mark = linkMarks.get(anchor)!;
    let group = linkFragments.get(mark);
    if (!group) linkFragments.set(mark, group = []);
    group.push(anchor);
  }
  hoverLink(linkAt(composed.querySelector("a:hover")));
  output.value = `${Math.round(width)} px`;
}

// Coalesce rapid input/resize events; measurement is never repeated here.
let pending = false;
function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}
slider.addEventListener("input", () => {
  document.documentElement.style.setProperty("--measure", `${slider.value}px`);
  schedule();
});
composed.addEventListener("copy", event => {
  const selection = getSelection();
  if (!event.clipboardData || selection?.rangeCount !== 1) return;
  const range = selection.getRangeAt(0);
  if (!composed.contains(range.startContainer) || !composed.contains(range.endContainer)) return;
  const selected = range.cloneContents();
  selected.querySelectorAll(".generated").forEach(hyphen => hyphen.remove());
  event.clipboardData.setData("text/plain", selected.textContent!);
  event.preventDefault();
});
new ResizeObserver(entries => {
  if (entries[0].contentRect.width !== lastWidth) schedule();
}).observe(composed);
render();
