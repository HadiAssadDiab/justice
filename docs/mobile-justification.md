# Mobile justification: emergency credit

22 September 2026. A reader reported large gaps in the “The Problem” paragraph
of [OpenCode Reloaded](https://anoma.ly/notes/opencode-reloaded/).

## Reproduction

The numerical fixture in `test/fixtures/mobile-article.ts` preserves the blog's
DOM measurements: 21px Valkyrie, its dictionary-supplied 8/3/3 hyphenation policy,
and optical margins. It includes numerical advances, not font files. At a 350px
measure, the original engine produces the screenshot's exact eight lines,
starting with “OpenCode’s environment (its”. Its two inter-word gaps are 39.37px
each; a natural space is 4.84375px. Adding “models,” to that line is feasible.

## Cause and correction

In the emergency pass, the original scorer added 15% of the column width to
each candidate's fitting capacity. A line with only two spaces received the same
52.5px credit as a line with many spaces. Very large actual word spaces could
therefore score cheaply enough to beat a more even layout with a few hyphens.
The adjacency penalty reinforced the choice of similarly loose lines.

Emergency credit is now capped at one natural space per inter-word gap. A
natural-space floor keeps the denominator finite even for indivisible lines.
Ordinary-pass scoring, hyphenation candidates, tracking/shrink limits, fitness
classes, and rendering contracts are unchanged. Emergency credit is a scoring
allowance, not permission to stretch glyphs or increase tracking limits.

At the reported measure, the new first line includes “models,” with 5.59px gaps.
The largest gap anywhere in the paragraph falls from 39.37px to 14.14px. The
paragraph now occupies seven lines and uses two dictionary hyphens.

## Evidence

- Regression tests failed on the original line break, then passed after the fix,
  including whole-word and hyphenated solving and static compilation.
- The measured paragraph preserves its complete source, fitting, and ragged last
  line at every integer measure from 268 through 448px.
- Existing independent exhaustive-partition oracles still verify the optimum
  for whole-word, hyphenated, per-line-width, and impossible-fit cases under the
  corrected cost model. The adjacency demonstration now uses a 300px measure,
  where the penalty reduces fitness jumps from three to one; the old 187px
  example relied on the excessive emergency discount to prefer fewer jumps.
- A wider local sweep used the blog's 22 paragraphs with 21px measurements at
  every second pixel from 268 through 448px: **2,002 cases**. Cases containing a
  gap over three natural spaces fell from **716 to 465**; cases over five fell
  from **188 to 68**. Neither version overflowed in this sweep. Hyphen counts
  increased from 802 to 891 across all cases.
- Of those cases, 459 improved their largest gap by more than 0.1 natural spaces.
  Three worsened by that amount: approximately 0.53px each. The change optimizes
  paragraph cost, not the largest gap in isolation.
- A comparison using the same font in headless Chromium and WebKit reproduced
  the old ~39.36px gaps and the new ~5.58px gaps in rendered DOM geometry.

The site includes this paragraph as a narrow-column example, comparing ragged
setting, whole-word fitting, and dictionary hyphenation. Its demonstration font
is EB Garamond, so its breaks differ from the captured Valkyrie regression.

## What remains inherent

Narrow columns contain fewer words and fewer possible breaks. Keeping both
margins aligned therefore trades off word-spacing variation, hyphen frequency,
and type size relative to column width. The blog's policy excludes words shorter
than eight letters and requires three letters on each side of a break; relaxing
that policy is a separate editorial choice. Some remaining extreme cases involve
indivisible technical tokens. This scoring correction cannot create legal breaks
that the adapter does not supply.

Professional print composition combines dictionary and discretionary hyphens,
paragraph-wide break selection, and controlled spacing ranges. Small tracking or
glyph-width adjustments are also available in tools such as InDesign, although
typographers differ on their use. Editorial intervention and ragged-right setting
remain valid options. Newspapers also exhibit poor justification; a narrow
measure does not guarantee an attractive result with any composer.

References:

- [Adobe: text composition](https://helpx.adobe.com/indesign/desktop/format-and-style-text/composition-and-text-wrapping/set-text-composition.html)
- [Fonts.com: hyphenation and justification](https://www.myfonts.com/pages/fontscom-learning-fontology-level-2-text-typography-hyphenation-and-justification/)
- [Practical Typography: justified text](https://practicaltypography.com/justified-text.html)
