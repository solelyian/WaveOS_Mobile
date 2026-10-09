// calculator.ts — Calculette (thème sombre, clavier maquette) — fonctionnelle.
import { h } from "../core/el";

const KEYS = ["AC", "±", "%", "÷", 7, 8, 9, "×", 4, 5, 6, "−", 1, 2, 3, "+", 0, ".", "="] as const;
const OPS = ["÷", "×", "−", "+", "="];

export function CalculatorApp() {
  let expr = "120 × 5";
  let out = "600";
  let acc: number | null = null;
  let pending: string | null = null;
  let fresh = true;

  const sub = h("div", { style: { color: "rgba(255,255,255,.6)", fontSize: "20px", fontWeight: "500", marginBottom: "8px" } }, expr);
  const big = h("div", { style: { fontSize: "72px", fontWeight: "200", letterSpacing: "-.03em" } }, out);

  const compute = (a: number, op: string, b: number) =>
    op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : b === 0 ? NaN : a / b;

  const fmt = (n: number) => (Math.abs(n) >= 1e12 || !isFinite(n) ? "Error" : String(+n.toFixed(8)));

  const press = (k: string | number) => {
    const s = String(k);
    if (s === "AC") { acc = null; pending = null; out = "0"; expr = ""; fresh = true; }
    else if (s === "±") { out = fmt(-parseFloat(out || "0")); }
    else if (s === "%") { out = fmt(parseFloat(out || "0") / 100); }
    else if (s === "=") {
      if (acc !== null && pending) {
        const r = compute(acc, pending, parseFloat(out));
        expr = `${fmt(acc)} ${pending} ${out}`;
        out = fmt(r); acc = null; pending = null; fresh = true;
      }
    } else if (OPS.includes(s)) {
      if (acc !== null && pending && !fresh) { out = fmt(compute(acc, pending, parseFloat(out))); }
      acc = parseFloat(out); pending = s; expr = `${out} ${s}`; fresh = true;
    } else {
      if (fresh) { out = s === "." ? "0." : s; fresh = false; expr = ""; }
      else out = out === "0" && s !== "." ? s : out.length < 12 ? out + s : out;
    }
    sub.textContent = expr || " ";
    big.textContent = out;
  };

  return h("div", { style: { height: "100%", padding: "64px 20px 20px", display: "flex", flexDirection: "column" } },
    h("div", { style: { flex: "1", display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-end", marginBottom: "32px", padding: "0 8px" } }, sub, big),
    h("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" } },
      ...KEYS.map((k) => {
        const s = String(k);
        const isOp = OPS.includes(s);
        const isNum = typeof k === "number" || s === ".";
        const cls = isOp ? "calc-key op" : isNum ? "calc-key num" : "calc-key fn";
        const b = h("button", { class: cls, onClick: () => press(k) }, s);
        if (k === 0) b.style.gridColumn = "span 2";
        return b;
      })));
}
