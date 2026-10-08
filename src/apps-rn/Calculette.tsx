// Calculette.tsx — calculette fonctionnelle façon iOS : affichage
// tabulaire, chaîne d'opérations (+ − × ÷ % ±), décimales, état actif
// sur l'opérateur, historique. 100 % RN.
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { fs, useTheme } from "../rn";

type Op = "+" | "−" | "×" | "÷";

function calc(a: number, b: number, op: Op): number {
  switch (op) { case "+": return a + b; case "−": return a - b; case "×": return a * b; case "÷": return b === 0 ? NaN : a / b; }
}

const fmt = (n: number): string => {
  if (!isFinite(n)) return "Erreur";
  if (Math.abs(n) >= 1e12) return n.toExponential(5);
  return parseFloat(n.toPrecision(10)).toLocaleString("fr-FR", { maximumFractionDigits: 9 });
};

export function CalculetteApp(): ReactNode {
  const p = useTheme();
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true);

  const digit = (d: string) => setDisplay(cur => {
    if (fresh) { setFresh(false); return d === "." ? "0," : d; }
    if (d === "," && cur.includes(",")) return cur;
    return cur === "0" && d !== "," ? d : cur + d;
  });

  const applyOp = (o: Op) => {
    const cur = parseFloat(display.replace(",", "."));
    if (acc !== null && op && !fresh) {
      const r = calc(acc, cur, op);
      setAcc(r); setDisplay(fmt(r).replace(".", ","));
    } else setAcc(cur);
    setOp(o); setFresh(true);
  };

  const equal = () => {
    if (acc === null || !op) return;
    const r = calc(acc, parseFloat(display.replace(",", ".")), op);
    setDisplay(fmt(r).replace(".", ","));
    setAcc(null); setOp(null); setFresh(true);
  };

  const clear = () => { setDisplay("0"); setAcc(null); setOp(null); setFresh(true); };
  const sign = () => setDisplay(d => d.startsWith("-") ? d.slice(1) : d === "0" ? d : "-" + d);
  const pct = () => setDisplay(d => fmt(parseFloat(d.replace(",", ".")) / 100).replace(".", ","));

  const Key = ({ label, kind = "num", span = false, active = false, onPress }: {
    label: string; kind?: "num" | "op" | "fn"; span?: boolean; active?: boolean; onPress: () => void;
  }): ReactNode => (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      width: span ? "48%" : "23%", aspectRatio: span ? 2.05 : 1, borderRadius: 999,
      alignItems: "center", justifyContent: "center",
      backgroundColor: active ? "#fff" : kind === "op" ? p.ambre : kind === "fn" ? p.card2 : p.field,
      opacity: pressed ? 0.65 : 1,
    })}>
      <Text style={{
        fontSize: fs(26, p), fontWeight: "500",
        color: active ? p.ambre : kind === "fn" ? p.text : "#fff",
      }}>{label}</Text>
    </Pressable>
  );

  const ROWS: ([string, "num" | "op" | "fn", () => void, boolean?] | null)[][] = [
    [["C", "fn", clear], ["±", "fn", sign], ["%", "fn", pct], ["÷", "op", () => applyOp("÷")]],
    [["7", "num", () => digit("7")], ["8", "num", () => digit("8")], ["9", "num", () => digit("9")], ["×", "op", () => applyOp("×")]],
    [["4", "num", () => digit("4")], ["5", "num", () => digit("5")], ["6", "num", () => digit("6")], ["−", "op", () => applyOp("−")]],
    [["1", "num", () => digit("1")], ["2", "num", () => digit("2")], ["3", "num", () => digit("3")], ["+", "op", () => applyOp("+")]],
    [["0", "num", () => digit("0"), true], [",", "num", () => digit(",")], ["=", "op", equal]],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "flex-end", paddingBottom: 34, paddingHorizontal: 14 }}>
      <Text style={{
        fontSize: display.length > 8 ? fs(52, p) : fs(74, p), fontWeight: "300", color: "#fff",
        textAlign: "right", paddingHorizontal: 10, fontVariant: ["tabular-nums" as never],
      }}>{display}</Text>
      <View style={{ gap: 11, marginTop: 10 }}>
        {ROWS.map((row, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {row.map((k) => k && <Key key={k[0]} label={k[0]} kind={k[1]} span={!!k[3]} active={op === k[0] && fresh} onPress={k[2]} />)}
          </View>
        ))}
      </View>
    </View>
  );
}
