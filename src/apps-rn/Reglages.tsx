// Reglages.tsx — l'app système complète, en React Native, câblée sur
// sys/toggle/set/on de src/system/state.ts : chaque interrupteur change
// VRAIMENT le prototype (thème, radios, PIN, luminosité, taille du texte).
// Sous-pages poussées sur la pile : Wi-Fi, Bluetooth, Apparence,
// Fond d'écran, Notifications, Général (À propos + stockage), Batterie,
// Confidentialité, Sécurité.
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { AreaChart, Avatar, fs, Group, Icon, Nav, Row, Scr, SecTitle, Seg, StackNav, Tg, useStack, useTheme } from "../rn";
import { on, set, sys, toggle } from "../system/state";

/** Abonne un composant à une clé de sys. */
function useSys<K extends keyof typeof sys>(key: K): (typeof sys)[K] {
  const [v, setV] = useState(sys[key]);
  useEffect(() => on(key, setV as never) as never, [key]);
  return v;
}

/** Barre de valeur tactile (luminosité/volume) — tap pour régler. */
function ValBar({ v, onChange, icon }: { v: number; onChange: (n: number) => void; icon: string }): ReactNode {
  const p = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 11 }}>
      <Icon name={icon} size={16} color={p.sub} sw={2.2} />
      <Pressable onPress={() => onChange(v >= 0.95 ? 0.25 : v + 0.15)} style={{ flex: 1 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: p.field, overflow: "hidden" }}>
          <View style={{ height: 6, width: `${v * 100}%`, backgroundColor: p.text, borderRadius: 3 }} />
        </View>
      </Pressable>
      <Pressable onPress={() => onChange(Math.max(0.25, v - 0.1))}><Text style={{ fontSize: 17, color: p.faint, paddingHorizontal: 4 }}>−</Text></Pressable>
      <Pressable onPress={() => onChange(Math.min(1, v + 0.1))}><Text style={{ fontSize: 17, color: p.faint, paddingHorizontal: 4 }}>+</Text></Pressable>
    </View>
  );
}

/* ---------- sous-pages ---------- */

function Wifi(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const wifi = useSys("wifi");
  const NETS = [["Nyne-5G", true], ["Nyne-2.4G", false], ["Cafe-Invite", false], ["BOX-8F2A", false], ["Voisinage", false]] as const;
  const [sel, setSel] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Wi-Fi" onBack={pop} back="Réglages" />
      <Scr>
        <Group><Row icon="wifi" iconBg={p.tint} title="Wi-Fi" right={<Tg v={wifi} onChange={() => toggle("wifi")} />} last /></Group>
        {wifi ? (<>
          <SecTitle>Réseaux</SecTitle>
          <Group>
            {NETS.map(([n, secured], i) => (
              <Row key={n} title={n} last={i === NETS.length - 1} onPress={() => setSel(i)}
                icon={i === sel ? "check" : undefined} iconBg={i === sel ? p.jade : undefined}
                right={<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {secured ? <Icon name="lock" size={12} color={p.faint} sw={2.4} /> : null}
                  <Icon name="wifi" size={15} color={i === sel ? p.tint : p.faint} sw={2.4} />
                </View>} />
            ))}
          </Group>
        </>) : null}
      </Scr>
    </View>
  );
}

function Bluetooth(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const bt = useSys("bt");
  const DEVS = [["AirPods Pro", "Écouteurs", true], ["Nyne Watch", "Montre", true], ["Clavier Sillage", "Clavier", false], ["Enceinte Atelier", "Audio", false]] as const;
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Bluetooth" onBack={pop} back="Réglages" />
      <Scr>
        <Group><Row icon="bluetooth" iconBg={p.tint} title="Bluetooth" right={<Tg v={bt} onChange={() => toggle("bt")} />} last /></Group>
        {bt ? (<>
          <SecTitle>Appareils</SecTitle>
          <Group>
            {DEVS.map(([n, kind, on_], i) => (
              <Row key={n} title={n} sub={on_ ? "Connecté" : kind} last={i === DEVS.length - 1}
                right={<Text style={{ fontSize: fs(13, p), color: on_ ? p.jade : p.faint }}>{on_ ? "●" : ""}</Text>} />
            ))}
          </Group>
        </>) : null}
      </Scr>
    </View>
  );
}

function Apparence(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const theme = useSys("theme");
  const ts = useSys("textScale");
  const bright = useSys("brightness");
  const idx = ts <= 0.9 ? 0 : ts <= 1.1 ? 1 : ts <= 1.4 ? 2 : 3;
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Apparence" onBack={pop} back="Réglages" />
      <Scr>
        <SecTitle>Thème</SecTitle>
        <Group><Row icon="moon" iconBg="#5856D6" title="Mode sombre" right={<Tg v={theme === "dark"} onChange={v => set("theme", v ? "dark" : "light")} />} last /></Group>
        <SecTitle>Taille du texte</SecTitle>
        <View style={{ paddingHorizontal: 16 }}>
          <Seg items={["S", "M", "L", "XL"]} idx={idx} onChange={i => set("textScale", [0.85, 1, 1.3, 1.6][i])} />
        </View>
        <SecTitle>Luminosité</SecTitle>
        <Group><ValBar icon="sun" v={bright} onChange={v => set("brightness", v)} /></Group>
      </Scr>
    </View>
  );
}

function WallpaperPage(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const wp = useSys("wallpaper");
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Fond d'écran" onBack={pop} back="Réglages" />
      <Scr>
        <Group>
          {([["Rubans", "Ondes indigo inclinées — sombre", 0], ["Aube", "Rubans pastel — clair", 1]] as const).map(([n, d, v], i) => (
            <Row key={n} title={n} sub={d} last={i === 1} onPress={() => set("wallpaper", v as 0 | 1)}
              right={wp === v ? <Icon name="check" size={17} color={p.tint} sw={2.6} /> : undefined} />
          ))}
        </Group>
      </Scr>
    </View>
  );
}

function Securite(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const pin = useSys("pinLock");
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Sécurité" onBack={pop} back="Réglages" />
      <Scr>
        <Group>
          <Row icon="lock" iconBg={p.jade} title="Code de verrouillage" sub={pin ? "Activé — code 8520" : "Désactivé"} right={<Tg v={pin} onChange={() => toggle("pinLock")} />} last />
        </Group>
        <Text style={{ paddingHorizontal: 20, paddingTop: 8, fontSize: fs(11.5, p), color: p.faint, lineHeight: 16 }}>
          Le code PIN (8520) sera demandé à l'écran de verrouillage. Essayez-le après avoir verrouillé.
        </Text>
      </Scr>
    </View>
  );
}

function NotifsPage(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const APPS = [["Messages", "message-circle", p.jade], ["Mail", "mail", "#5570D6"], ["Rappels", "bell", p.corail], ["Bourse", "trending-up", p.ambre]] as const;
  const [on_, setOn] = useState<Record<string, boolean>>({ Messages: true, Mail: true, Rappels: true, Bourse: false });
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Notifications" onBack={pop} back="Réglages" />
      <Scr>
        <SecTitle>Autoriser</SecTitle>
        <Group>
          {APPS.map(([n, ic, bg], i) => (
            <Row key={n} icon={ic} iconBg={bg} title={n} last={i === APPS.length - 1}
              right={<Tg v={on_[n]} onChange={v => setOn(o => ({ ...o, [n]: v }))} />} />
          ))}
        </Group>
        <SecTitle>Style</SecTitle>
        <Group>
          <Row icon="layers" iconBg={p.violet} title="Regrouper par app" right={<Tg v={true} onChange={() => { }} />} />
          <Row icon="bell-ring" iconBg={p.ambre} title="Aperçus sur verrouillage" right={<Tg v={true} onChange={() => { }} />} last />
        </Group>
      </Scr>
    </View>
  );
}

function Batterie(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const [low, setLow] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Batterie" onBack={pop} back="Réglages" />
      <Scr>
        <SecTitle>Niveau — 24 h</SecTitle>
        <Group>
          <View style={{ paddingVertical: 14 }}>
            <AreaChart pts={[100, 96, 93, 91, 90, 88, 87, 85, 84, 84, 82, 80, 79, 76, 74, 72, 71, 70, 68, 67, 65, 64, 63, 62]} w={320} h={120} color={p.jade} />
          </View>
        </Group>
        <Group>
          <Row icon="zap" iconBg={p.ambre} title="Économie d'énergie" right={<Tg v={low} onChange={setLow} />} last />
        </Group>
        <SecTitle>Consommation par app</SecTitle>
        <Group>
          {[["Musique", 31, p.tint], ["Messages", 22, p.jade], ["Photos", 18, p.ambre], ["Plans", 12, p.violet], ["Autres", 17, p.faint]].map(([n, pct, c], i, arr) => (
            <View key={n as string} style={{ borderBottomWidth: i === arr.length - 1 ? 0 : 0.5, borderBottomColor: p.sep }}>
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fs(14.5, p), color: p.text }}>{n as string}</Text>
                  <View style={{ height: 5, borderRadius: 3, backgroundColor: p.field, marginTop: 6, overflow: "hidden" }}>
                    <View style={{ height: 5, width: `${pct as number}%`, backgroundColor: c as string, borderRadius: 3 }} />
                  </View>
                </View>
                <Text style={{ fontSize: fs(13, p), color: p.sub, width: 40, textAlign: "right" }}>{pct as number}%</Text>
              </View>
            </View>
          ))}
        </Group>
      </Scr>
    </View>
  );
}

function General(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const free = 42;
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Général" onBack={pop} back="Réglages" />
      <Scr>
        <SecTitle>À propos</SecTitle>
        <Group>
          <Row title="Nom" right={<Text style={{ fontSize: fs(14, p), color: p.sub }}>WaveOS · Sillage</Text>} />
          <Row title="Version" right={<Text style={{ fontSize: fs(14, p), color: p.sub }}>0.7.0 prototype</Text>} />
          <Row title="Modèle" right={<Text style={{ fontSize: fs(14, p), color: p.sub }}>Navigateur</Text>} last />
        </Group>
        <SecTitle>Stockage</SecTitle>
        <Group>
          <View style={{ paddingHorizontal: 14, paddingVertical: 13 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: fs(14, p), color: p.text }}>Utilisé</Text>
              <Text style={{ fontSize: fs(14, p), color: p.sub }}>{128 - free} Go / 128 Go</Text>
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: p.field, overflow: "hidden" }}>
              <View style={{ height: 8, width: `${(128 - free) / 128 * 100}%`, backgroundColor: p.tint, borderRadius: 4 }} />
            </View>
          </View>
        </Group>
        <SecTitle>Langue & région</SecTitle>
        <Group>
          {[["Français", true], ["English", false], ["Deutsch", false], ["", false]].map(([l, sel], i) => (
            <Row key={l as string} title={l as string} last={i === 3}
              right={sel ? <Icon name="check" size={17} color={p.tint} sw={2.6} /> : undefined} />
          ))}
        </Group>
      </Scr>
    </View>
  );
}

function Confidentialite(): ReactNode {
  const p = useTheme();
  const { pop } = useStack();
  const ITEMS = [["Localisation", "map-pin", true], ["Analytique", "chart-bar", true], ["Suivi publicitaire", "scan-eye", false], ["Accès photos", "image", true]] as const;
  const [vals, setVals] = useState([true, true, false, true]);
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav title="Confidentialité" onBack={pop} back="Réglages" />
      <Scr>
        <Group>
          {ITEMS.map(([n, ic], i) => (
            <Row key={n} icon={ic} iconBg={p.violet} title={n} last={i === ITEMS.length - 1}
              right={<Tg v={vals[i]} onChange={v => setVals(a => a.map((x, j) => j === i ? v : x))} />} />
          ))}
        </Group>
      </Scr>
    </View>
  );
}

/* ---------- liste racine ---------- */

function Home(): ReactNode {
  const p = useTheme();
  const { push } = useStack();
  const wifi = useSys("wifi");
  const airplane = useSys("airplane");
  const bt = useSys("bt");
  const focus = useSys("focus");
  const theme = useSys("theme");
  const pin = useSys("pinLock");
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <Nav large="Réglages" />
      <Scr bottomPad={40}>
        {/* carte profil */}
        <Group>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 14, paddingVertical: 12 }}>
            <Avatar name="IA" size={52} hue={222} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(17, p), fontWeight: "700", color: p.text }}>Ian Alexandre</Text>
              <Text style={{ fontSize: fs(12.5, p), color: p.sub }}>Nyne ID, médias et achats</Text>
            </View>
            <Icon name="chevron-right" size={16} color={p.faint} sw={2.4} />
          </View>
        </Group>
        <Group>
          <Row icon="plane" iconBg={p.corail} title="Mode avion" right={<Tg v={airplane} onChange={() => toggle("airplane")} />} />
          <Row icon="wifi" iconBg={p.tint} title="Wi-Fi" sub={wifi ? "Nyne-5G" : "Inactif"} onPress={() => push(<Wifi />)} />
          <Row icon="bluetooth" iconBg={p.tint} title="Bluetooth" sub={bt ? "Activé" : "Inactif"} onPress={() => push(<Bluetooth />)} />
          <Row icon="moon" iconBg="#5856D6" title="Focus" right={<Tg v={focus} onChange={() => toggle("focus")} />} last />
        </Group>
        <Group>
          <Row icon="bell" iconBg={p.corail} title="Notifications" onPress={() => push(<NotifsPage />)} />
          <Row icon="sun" iconBg={p.ambre} title="Apparence" sub={theme === "dark" ? "Sombre" : "Clair"} onPress={() => push(<Apparence />)} />
          <Row icon="image" iconBg={p.jade} title="Fond d'écran" onPress={() => push(<WallpaperPage />)} />
          <Row icon="lock" iconBg={p.jade} title="Sécurité" sub={pin ? "Code activé" : "Aucun code"} onPress={() => push(<Securite />)} last />
        </Group>
        <Group>
          <Row icon="settings-2" iconBg={p.sub} title="Général" onPress={() => push(<General />)} />
          <Row icon="battery-charging" iconBg={p.jade} title="Batterie" onPress={() => push(<Batterie />)} />
          <Row icon="shield-check" iconBg={p.tint} title="Confidentialité" onPress={() => push(<Confidentialite />)} last />
        </Group>
        <View style={{ alignItems: "center", paddingVertical: 18 }}>
          <Text style={{ fontSize: fs(11.5, p), color: p.faint }}>WaveOS 0.7.0 — « Sillage »</Text>
          <Text style={{ fontSize: fs(10.5, p), color: p.faint, marginTop: 2 }}>Prototype · Nyne Technologies</Text>
        </View>
      </Scr>
    </View>
  );
}

export function ReglagesApp(): ReactNode {
  return <StackNav root={<Home />} />;
}
