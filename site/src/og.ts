// Dev-only: renders the Open Graph card at 1200×630 for a screenshot. Not built.
import "@fontsource-variable/eb-garamond";
import { prepare, solve } from "../../src/engine";
import { greedy, render } from "./composer";
import { createMeasurer, fragmentsOf } from "./measure";
import "./style.css";

const text = "Browsers justify text one line at a time. Each line takes as many words as will fit, stretches its gaps to reach the margin, and never looks back. The result is familiar: a tight line beside a loose one, rivers of white running down the page, a single word stranded at the end. Justice fits the whole paragraph at once.";

async function main() {
  const root = document.getElementById("og")!;
  Object.assign(document.body.style, { margin: "0", width: "1200px", height: "630px", overflow: "hidden", fontSize: "28px" });
  root.innerHTML = `
    <div style="position:absolute; inset:0; padding:84px 96px; display:grid; grid-template-rows:auto 1fr; row-gap:76px">
      <p class="sans" style="font-size:24px; color:var(--ink)">Justice</p>
      <div style="display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); column-gap:76px; align-items:start"></div>
    </div>`;
  const host = document.createElement("div");
  host.className = "prose measure-host";
  document.body.append(host);
  await document.fonts.load("400 28px 'EB Garamond Variable'");
  await document.fonts.ready;
  const measurer = createMeasurer(host);
  measurer.prime(fragmentsOf(text));
  const p = prepare(text, measurer.width);
  const columns = root.querySelector<HTMLElement>("div > div:last-child")!;
  const lineHeight = parseFloat(getComputedStyle(host).lineHeight);
  for (const name of ["Browser", "Justice"]) {
    const column = document.createElement("div");
    column.className = "column";
    column.innerHTML = `<p class="sans" style="margin-bottom:22px; font-size:17px">${name}</p><div class="stage"><div class="prose"></div></div>`;
    columns.append(column);
  }
  const stages = [...columns.querySelectorAll<HTMLElement>(".prose")];
  const width = stages[0].getBoundingClientRect().width;
  const frames = [greedy(p, width, true), solve(p, width).lines];
  stages.forEach((prose, i) => render(prose, p, measurer, lineHeight, frames[i]));
  document.body.classList.add("ready");
}
main();
