/** Batched DOM measurement. Every text becomes its own block-level span so no
 * kerning or shaping crosses a boundary; the composer renders words the same way. */
export interface Measurer {
  width(text: string): number;
  prime(texts: Iterable<string>): void;
  reset(): void;
}

export function createMeasurer(host: HTMLElement): Measurer {
  const cache = new Map<string, number>();
  const prime = (texts: Iterable<string>) => {
    const missing = [...new Set(texts)].filter(text => !cache.has(text));
    if (!missing.length) return;
    const spans = missing.map(text => {
      const span = document.createElement("span");
      span.textContent = text;
      host.append(span);
      return span;
    });
    spans.forEach((span, i) => cache.set(missing[i], span.getBoundingClientRect().width));
    host.replaceChildren();
  };
  return {
    prime,
    width: text => {
      if (!cache.has(text)) prime([text]);
      return cache.get(text)!;
    },
    reset: () => cache.clear(),
  };
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
export const graphemes = (text: string) => [...segmenter.segment(text)].length;

/** Every fragment the engine may ask for: words, their punctuation edges, and
 * contiguous runs of hyphenation parts with and without a trailing hyphen. */
export function fragmentsOf(text: string, hyphenate?: (word: string) => readonly string[]): string[] {
  const out = new Set<string>([" ", "-"]);
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    out.add(word);
    const punctuation = word.match(/[.,;:!?…’”'"]+$/u)?.[0];
    if (punctuation) out.add(punctuation);
    const quote = word.match(/^[“‘"'«‹]/u)?.[0];
    if (quote) out.add(quote);
    const offsets = new Set<number>([0, word.length]);
    for (const m of word.matchAll(/(?<=[\p{L}\p{N}])[-\u2010](?=[\p{L}\p{N}])/gu)) offsets.add(m.index + 1);
    if (hyphenate) {
      let at = 0;
      for (const part of hyphenate(word)) { at += part.length; offsets.add(at); }
    }
    const sorted = [...offsets].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) for (let j = i + 1; j < sorted.length; j++) {
      const piece = word.slice(sorted[i], sorted[j]);
      out.add(piece);
      out.add(piece + "-");
    }
  }
  return [...out];
}
