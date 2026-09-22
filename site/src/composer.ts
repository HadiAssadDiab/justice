import type { Line, Prepared } from "../../src/engine";
import { graphemes, type Measurer } from "./measure";

/** Render fitted lines as absolutely positioned word spans. Each word is its
 * own block, so DOM-measured advances place it exactly; tracking is letter-spacing. */
export function render(root: HTMLElement, p: Prepared, measurer: Measurer, lineHeight: number, lines: Line[]) {
  lines.forEach((line, index) => {
    let x = -line.opening;
    const y = index * lineHeight;
    for (let w = line.start; w < line.end; w++) {
      const word = p.words[w];
      let text = word;
      if (w === line.start && line.startOffset) text = word.slice(line.startOffset);
      if (w === line.end - 1 && line.endOffset !== undefined) text = word.slice(0, line.endOffset) + (line.hyphenated ? "-" : "");
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = text;
      span.style.transform = `translate(${x}px, ${y}px)`;
      span.style.letterSpacing = `${line.tracking}px`;
      root.append(span);
      x += measurer.width(text) + graphemes(text) * line.tracking + p.space + line.wordSpacing + line.tracking;
    }
  });
  root.style.height = `${lines.length * lineHeight}px`;
}

/** The browser's algorithm, reproduced numerically: take words while they fit,
 * then (when justifying) divide the leftover across the gaps. No tracking,
 * nothing hangs. `justify: false` is text-align: left — the ragged edge. */
export function greedy(p: Prepared, width: number, justify = true): Line[] {
  const lines: Line[] = [];
  let start = 0;
  while (start < p.words.length) {
    let end = start + 1;
    while (end < p.words.length && p.widths[end + 1] - p.widths[start] + (end - start) * p.space <= width) end++;
    const gaps = end - start - 1;
    const natural = p.widths[end] - p.widths[start] + gaps * p.space;
    const last = end === p.words.length;
    const wordSpacing = justify && !last && gaps ? (width - natural) / gaps : 0;
    lines.push({ start, end, width, natural, wordSpacing, tracking: 0, hanging: 0, opening: 0, residual: last ? 0 : width - natural - wordSpacing * gaps, relaxed: false, cost: 0, last });
    start = end;
  }
  return lines;
}
