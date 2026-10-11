// CalculatorApp.tsx — calculette thème sombre, même logique que main.
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

const KEYS = ["AC", "±", "%", "÷", 7, 8, 9, "×", 4, 5, 6, "−", 1, 2, 3, "+", 0, ".", "="] as const;
const OPS = ["÷", "×", "−", "+", "="];

export function CalculatorApp() {
  const [expr, setExpr] = React.useState("120 × 5");
  const [out, setOut] = React.useState("600");
  const mem = React.useRef<{ acc: number | null; pending: string | null; fresh: boolean }>({ acc: null, pending: null, fresh: true });

  const compute = (a: number, op: string, b: number) =>
    op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : b === 0 ? NaN : a / b;
  const fmt = (n: number) => (Math.abs(n) >= 1e12 || !isFinite(n) ? "Error" : String(+n.toFixed(8)));

  const press = (k: string | number) => {
    const s = String(k);
    const m = mem.current;
    let o = out, e = expr;
    if (s === "AC") { m.acc = null; m.pending = null; o = "0"; e = ""; m.fresh = true; }
    else if (s === "±") { o = fmt(-parseFloat(o || "0")); }
    else if (s === "%") { o = fmt(parseFloat(o || "0") / 100); }
    else if (s === "=") {
      if (m.acc !== null && m.pending) {
        const r = compute(m.acc, m.pending, parseFloat(o));
        e = `${fmt(m.acc)} ${m.pending} ${o}`;
        o = fmt(r); m.acc = null; m.pending = null; m.fresh = true;
      }
    } else if (OPS.includes(s)) {
      if (m.acc !== null && m.pending && !m.fresh) { o = fmt(compute(m.acc, m.pending, parseFloat(o))); }
      m.acc = parseFloat(o); m.pending = s; e = `${o} ${s}`; m.fresh = true;
    } else {
      if (m.fresh) { o = s === "." ? "0." : s; m.fresh = false; e = ""; }
      else o = o === "0" && s !== "." ? s : o.length < 12 ? o + s : o;
    }
    setOut(o); setExpr(e);
  };

  return (
    <View style={cs.root}>
      <View style={cs.disp}>
        <Text style={cs.sub}>{expr || " "}</Text>
        <Text style={cs.big}>{out}</Text>
      </View>
      <View style={cs.grid}>
        {KEYS.map((k, i) => {
          const s = String(k);
          const isOp = OPS.includes(s);
          const isNum = typeof k === "number" || s === ".";
          return (
            <Pressable key={i} onPress={() => press(k)}
              style={[cs.key, isOp ? cs.op : isNum ? cs.num : cs.fn, k === 0 && { flexBasis: "47%" }]}>
              <Text style={[cs.kt, isOp ? { color: "#fff" } : isNum ? { color: "#fff" } : { color: "#000" }]}>{s}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1f2937", paddingTop: 64, paddingHorizontal: 20, paddingBottom: 20 },
  disp: { flex: 1, alignItems: "flex-end", justifyContent: "flex-end", marginBottom: 32, paddingHorizontal: 8 },
  sub: { color: "rgba(255,255,255,.6)", fontSize: 20, fontWeight: "500", marginBottom: 8 },
  big: { fontSize: 72, fontWeight: "200", letterSpacing: -2, color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 } as object,
  key: {
    flexBasis: "21%", height: 64, borderRadius: 24, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,.1)",
  } as object,
  num: { backgroundColor: "rgba(0,0,0,.4)" } as object,
  op: { backgroundColor: "#f97316" } as object,
  fn: { backgroundColor: "rgba(255,255,255,.8)" } as object,
  kt: { fontSize: 24, fontWeight: "500" },
});
