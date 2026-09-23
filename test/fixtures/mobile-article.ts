import type { Prepared, WordFragments } from "../../src/engine";

// Chromium DOM measurements of the reported OpenCode Reloaded paragraph in
// 21px Valkyrie. Numerical fixture only: no font or browser is needed by tests.
// These are the blog adapter's 8/3/3 dictionary breaks and optical margins.
const hyphenation: (WordFragments | undefined)[] = Array(40).fill(undefined);
hyphenation[1] = {
  offsets: [0, 4, 7, 11],
  widths: new Float64Array([0, 40.3125, 72.125, 120.5, 0, 0, 31.828125, 80.203125, 0, 0, 0, 48.390625, 0, 0, 0, 0]),
  hyphenWidths: new Float64Array([0, 47.359375, 79.171875, 0, 0, 0, 38.875, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  characters: new Float64Array([0, 4, 7, 11, 0, 0, 3, 7, 0, 0, 0, 4, 0, 0, 0, 0]),
  startProtrusions: new Float64Array([0, 0, 0.2867758683712528, 0]),
  hyphenProtrusion: 1.511998424530029,
};
hyphenation[9] = {
  offsets: [0, 5, 9],
  widths: new Float64Array([0, 56.375, 96.390625, 0, 0, 40.25, 0, 0, 0]),
  hyphenWidths: new Float64Array([0, 63.421875, 0, 0, 0, 0, 0, 0, 0]),
  characters: new Float64Array([0, 5, 9, 0, 0, 4, 0, 0, 0]),
  startProtrusions: new Float64Array([0.11951600961973392, 0, 0]),
  hyphenProtrusion: 1.511998424530029,
};
hyphenation[16] = {
  offsets: [0, 5, 8],
  widths: new Float64Array([0, 55.875, 81.453125, 0, 0, 25.578125, 0, 0, 0]),
  hyphenWidths: new Float64Array([0, 62.921875, 0, 0, 0, 0, 0, 0, 0]),
  characters: new Float64Array([0, 5, 8, 0, 0, 3, 0, 0, 0]),
  startProtrusions: new Float64Array([0, 0, 0]),
  hyphenProtrusion: 1.511998424530029,
};
hyphenation[27] = {
  offsets: [0, 4, 10],
  widths: new Float64Array([0, 40.75, 95.578125, 0, 0, 54.84375, 0, 0, 0]),
  hyphenWidths: new Float64Array([0, 47.796875, 0, 0, 0, 0, 0, 0, 0]),
  characters: new Float64Array([0, 4, 10, 0, 0, 6, 0, 0, 0]),
  startProtrusions: new Float64Array([0.11951600961973392, 0, 0]),
  hyphenProtrusion: 1.511998424530029,
};

export const mobileArticle: Prepared = {
  words: ["OpenCode’s", "environment", "(its", "models,", "tools,", "agents,", "skills,", "etc.)", "is", "assembled", "by", "plugins.", "Much", "of", "its", "default", "behavior", "lives", "in", "built-in", "plugins.", "And", "you,", "dear", "reader,", "can", "install", "additional", "plugins,", "write", "your", "own,", "or", "ask", "OpenCode", "to", "write", "one", "for", "you."],
  widths: new Float64Array([0, 113.109375, 233.609375, 263.859375, 336.71875, 388.046875, 453.78125, 508.53125, 548.1875, 563.546875, 659.9375, 682.796875, 757.875, 811.765625, 830.609375, 853.46875, 919.390625, 1000.84375, 1043.75, 1062.890625, 1133.796875, 1208.875, 1248.71875, 1289.3125, 1329.328125, 1391.6875, 1424.46875, 1483.125, 1578.703125, 1654.078125, 1701.921875, 1744.578125, 1790.453125, 1809.59375, 1840.96875, 1938.859375, 1957.828125, 2005.671875, 2039.734375, 2066.25, 2106.5625]),
  characters: new Float64Array([0, 10, 21, 25, 32, 38, 45, 52, 57, 59, 68, 70, 78, 82, 84, 87, 94, 102, 107, 109, 117, 125, 128, 132, 136, 143, 146, 153, 163, 171, 176, 180, 184, 186, 189, 197, 199, 204, 207, 210, 214]),
  endHangs: new Float64Array([0, 0, 0, 5.625, 5.625, 5.625, 5.625, 0, 0, 0, 0, 5.328125, 0, 0, 0, 0, 0, 0, 0, 0, 5.328125, 0, 5.609375, 0, 5.625, 0, 0, 0, 5.625, 0, 0, 5.625, 0, 0, 0, 0, 0, 0, 0, 5.328125]),
  startHangs: new Float64Array(40),
  startProtrusions: new Float64Array([0.10215603796101243, 0, 0, 0.2867758683712528, 0, 0.11951600961973392, 0, 0, 0, 0.11951600961973392, 0, 0, 0.3253045200757257, 0.13662597971757337, 0, 0.10119680466791493, 0, 0, 0, 0, 0, 1.2179999931156635, 0, 0.10119680466791493, 0, 0.07614035024635231, 0, 0.11951600961973392, 0, 0.6745187981388906, 0, 0.13662597971757337, 0.13662597971757337, 0.11951600961973392, 0.10215603796101243, 0, 0.6745187981388906, 0.13662597971757337, 0, 0]),
  endProtrusions: new Float64Array([0, 0, 0, 1.374320368273663, 1.374320368273663, 1.374320368273663, 1.374320368273663, 0, 0, 0, 0, 1.9153234074088499, 0, 0, 0, 0, 0, 0, 0, 0, 1.9153234074088499, 0, 1.374320368273663, 0, 1.374320368273663, 0, 0, 0, 1.374320368273663, 0, 0, 1.374320368273663, 0, 0, 0, 0, 0, 0, 0, 1.9153234074088499]),
  space: 4.84375,
  hyphenation,
};
