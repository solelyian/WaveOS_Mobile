// Bourse.tsx — watchlist façon app Bourse : liste de titres (symbole,
// nom, dernier cours, variation colorée + sparkline), fiche titre
// (grand prix, graphe d'aire jour/semaine/mois, stats ouverture/plus-haut/
// plus-bas/cap), indices en haut. Store externe.
import { useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { AreaChart, fs, Group, Icon, Nav, Row, Scr, SecTitle, Seg, Spark, StackNav, useStack, useTheme } from "../rn";

interface Stock { sym: string; name: string; price: number; chg: number; pts: number[] }

const seed: Stock[] = [
  { sym: "NYN", name: "Nyne Technologies", price: 184.32, chg: +2.41, pts: [12, 14, 13, 16, 18, 17, 19, 21, 20, 22, 24, 23, 26] },
  { sym: "APPL", name: "Opale Audio", price: 92.18, chg: -0.87, pts: [20, 19, 18, 19, 17, 18, 16, 17, 15, 16, 15, 14, 15] },
  { sym: "JDE", name: "Jade Énergie", price: 41.05, chg: +1.12, pts: [8, 9, 8, 10, 11, 10, 12, 11, 12, 13, 12, 14, 13] },
  { sym: "AMB", name: "Ambre Media", price: 66.74, chg: -2.03, pts: [22, 21, 22, 20, 19, 20, 18, 17, 18, 16, 15, 16, 14] },
  { sym: "CRL", name: "Corail Santé", price: 128.90, chg: +0.56, pts: [10, 11, 10, 11, 12, 11, 12, 13, 12, 13, 14, 13, 14] },
  { sym: "ABY", name: "Abysses Data", price: 310.44, chg: +4.88, pts: [8, 9, 11, 10, 12, 14, 13, 15, 17, 16, 18, 20, 22] },
];

const INDICES = [["CAC 40", "7 982,11", "+0,34%", true], ["NASDAQ", "18 244,60", "-0,12%", false], ["EUR/USD", "1,0842", "+0,08%", true]] as const;

function Pct({ v }: { v: number }): ReactNode {
  const p = useTheme();
  const up = v >= 0;
  return (
    <View style={{ backgroundColor: up ? p.jade : p.corail, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, minWidth: 62, alignItems: "center" }}>
      <Text style={{ color: "#fff", fontSize: fs(12.5, p), fontWeight: "700", fontVariant: ["tabular-nums" as never] }}>
        {up ? "+" : ""}{v.toFixed(2)}%
      </Text>
    </View>
  );
}

function Fiche({ s }: { s: Stock }): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const [range, setRange] = useState(0);
  const up = s.chg >= 0;
  const scale = [1, 0.7, 1.4][range];
  const pts = s.pts.map(v => v * (1 + (v / 24 - 0.5) * (scale - 1) * 0.4) * (range === 1 ? 0.9 : range === 2 ? 1.1 : 1));
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav onBack={pop} back="Bourse" right={<Icon name="star" size={19} color={p.ambre} sw={2.2} />} />
      <Scr>
        <Text style={{ fontSize: fs(15, p), color: p.sub, paddingHorizontal: 18 }}>{s.name}</Text>
        <Text style={{ fontSize: fs(15, p), color: p.faint, paddingHorizontal: 18, marginTop: 1 }}>{s.sym} · EURONEXT</Text>
        <Text style={{ fontSize: fs(44, p), fontWeight: "200", color: p.text, paddingHorizontal: 18, marginTop: 8, fontVariant: ["tabular-nums" as never] }}>
          {s.price.toFixed(2).replace(".", ",")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, marginBottom: 8 }}>
          <Icon name={up ? "trending-up" : "trending-down"} size={15} color={up ? p.jade : p.corail} sw={2.4} />
          <Text style={{ fontSize: fs(14, p), fontWeight: "600", color: up ? p.jade : p.corail }}>
            {up ? "+" : ""}{s.chg.toFixed(2).replace(".", ",")}% aujourd'hui
          </Text>
        </View>
        <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
          <Seg items={["J", "S", "M"]} idx={range} onChange={setRange} />
        </View>
        <Group>
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <AreaChart pts={pts} w={330} h={140} color={up ? p.jade : p.corail} />
          </View>
        </Group>
        <SecTitle>Statistiques</SecTitle>
        <Group>
          <Row title="Ouverture" right={<Text style={{ fontSize: fs(14.5, p), color: p.text, fontVariant: ["tabular-nums" as never] }}>{(s.price * 0.99).toFixed(2).replace(".", ",")}</Text>} />
          <Row title="Plus haut" right={<Text style={{ fontSize: fs(14.5, p), color: p.text, fontVariant: ["tabular-nums" as never] }}>{(s.price * 1.02).toFixed(2).replace(".", ",")}</Text>} />
          <Row title="Plus bas" right={<Text style={{ fontSize: fs(14.5, p), color: p.text, fontVariant: ["tabular-nums" as never] }}>{(s.price * 0.97).toFixed(2).replace(".", ",")}</Text>} />
          <Row title="Cap. boursière" right={<Text style={{ fontSize: fs(14.5, p), color: p.text }}>{(s.price * 12.4).toFixed(1)} Md€</Text>} last />
        </Group>
      </Scr>
    </View>
  );
}

function Home(): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Bourse" />
      <Scr>
        {/* bandeau indices */}
        <View style={{ flexDirection: "row", gap: 9, paddingHorizontal: 16, marginBottom: 16 }}>
          {INDICES.map(([n, v, c, up]) => (
            <View key={n} style={{ flex: 1, backgroundColor: p.card, borderRadius: 13, padding: 10, borderWidth: 0.5, borderColor: p.sep }}>
              <Text style={{ fontSize: fs(10.5, p), color: p.faint, letterSpacing: 0.4 }}>{n}</Text>
              <Text style={{ fontSize: fs(13.5, p), fontWeight: "700", color: p.text, marginTop: 3, fontVariant: ["tabular-nums" as never] }}>{v}</Text>
              <Text style={{ fontSize: fs(11, p), fontWeight: "600", color: up ? p.jade : p.corail }}>{c}</Text>
            </View>
          ))}
        </View>
        <SecTitle>Suivis</SecTitle>
        <Group>
          {seed.map((s, i) => (
            <Pressable key={s.sym} onPress={() => push(<Fiche s={s} />)} style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingVertical: 11,
              borderBottomWidth: i === seed.length - 1 ? 0 : 0.5, borderBottomColor: p.sep,
              backgroundColor: pressed ? p.card2 : "transparent",
            })}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(15.5, p), fontWeight: "700", color: p.text }}>{s.sym}</Text>
                <Text style={{ fontSize: fs(11.5, p), color: p.faint }} numberOfLines={1}>{s.name}</Text>
              </View>
              <Spark pts={s.pts} w={58} h={24} color={s.chg >= 0 ? p.jade : p.corail} />
              <View style={{ alignItems: "flex-end", gap: 3 }}>
                <Text style={{ fontSize: fs(15, p), fontWeight: "600", color: p.text, fontVariant: ["tabular-nums" as never] }}>{s.price.toFixed(2).replace(".", ",")}</Text>
                <Pct v={s.chg} />
              </View>
            </Pressable>
          ))}
        </Group>
      </Scr>
    </View>
  );
}

export function BourseApp(): ReactNode {
  return <StackNav root={<Home />} />;
}
