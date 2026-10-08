// Sante.tsx — santé façon app Health : anneaux d'activité (Bouger/
// Exercice/Debout), carte pas du jour avec graphe horaire, métriques
// (FC, sommeil, distance), liste détaillée. Rings + AreaChart du kit.
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { fs, Group, Icon, Nav, Rings, Scr, SecTitle, StackNav, useTheme } from "../rn";

const HOURS = [2, 0, 0, 0, 0, 1, 4, 8, 12, 9, 6, 14, 10, 8, 15, 11, 6, 9, 12, 7, 4, 3, 2, 1];

function Metric({ icon, color, title, value, sub }: {
  icon: string; color: string; title: string; value: string; sub: string;
}): ReactNode {
  const p = useTheme();
  return (
    <View style={{ width: "48%", backgroundColor: p.card, borderRadius: 15, padding: 12, borderWidth: 0.5, borderColor: p.sep }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name={icon} size={13} color={color} sw={2.4} />
        <Text style={{ fontSize: fs(12, p), color: p.sub }}>{title}</Text>
      </View>
      <Text style={{ fontSize: fs(21, p), fontWeight: "700", color: p.text, marginTop: 8 }}>{value}</Text>
      <Text style={{ fontSize: fs(10.5, p), color: p.faint, marginTop: 2 }}>{sub}</Text>
    </View>
  );
}

function Home(): ReactNode {
  const p = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Santé" right={<Icon name="user-round" size={19} color={p.tint} sw={2.2} />} />
      <Scr>
        {/* anneaux activité */}
        <Group>
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 12, gap: 16 }}>
            <Rings size={86} values={[0.78, 0.62, 0.9]} />
            <View style={{ flex: 1, gap: 7 }}>
              {[["Bouger", "640/820 kcal", p.corail], ["Exercice", "37/60 min", p.jade], ["Debout", "11/12 h", p.tint]].map(([l, v, c]) => (
                <View key={l as string} style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c as string }} />
                  <Text style={{ fontSize: fs(12.5, p), color: p.sub, flex: 1 }}>{l as string}</Text>
                  <Text style={{ fontSize: fs(12.5, p), fontWeight: "600", color: p.text, fontVariant: ["tabular-nums" as never] }}>{v as string}</Text>
                </View>
              ))}
            </View>
          </View>
        </Group>
        {/* pas */}
        <SecTitle>Pas — aujourd'hui</SecTitle>
        <Group>
          <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
            <Text style={{ fontSize: fs(26, p), fontWeight: "700", color: p.text, fontVariant: ["tabular-nums" as never] }}>8 472</Text>
            <Text style={{ fontSize: fs(11.5, p), color: p.faint }}>objectif 10 000 · 5,9 km</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2.5, paddingHorizontal: 14, paddingVertical: 14, height: 74 }}>
            {HOURS.map((v, i) => (
              <View key={i} style={{ flex: 1, height: `${Math.max(4, v / 15 * 100)}%`, borderRadius: 2, backgroundColor: i === 14 ? p.corail : p.card2 }} />
            ))}
          </View>
        </Group>
        {/* métriques */}
        <SecTitle>Aperçu</SecTitle>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 }}>
          <Metric icon="heart-pulse" color={p.corail} title="Fréquence cardiaque" value="62 bpm" sub="repos · il y a 4 min" />
          <Metric icon="moon" color={p.violet} title="Sommeil" value="7 h 12" sub="qualité bonne" />
          <Metric icon="navigation" color={p.jade} title="Distance" value="5,9 km" sub="aujourd'hui" />
          <Metric icon="activity" color={p.tint} title="VO₂ max" value="43,1" sub="stable ce mois" />
        </View>
      </Scr>
    </View>
  );
}

export function SanteApp(): ReactNode {
  return <StackNav root={<Home />} />;
}
