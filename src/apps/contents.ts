// contents.ts — corps des apps du prototype : du VRAI contenu structuré,
// pas des placeholders. Chaque écran suit la même coque (appbar + appbody)
// et respecte les tokens Sillage. Calculette calcule réellement ; Messages
// ouvre un fil ; Horloge est vivante.
import { el, svgEl } from "../core/el";
import { lucide } from "../core/lucide";

/* ---------- briques communes ---------- */

function card(children: (HTMLElement | string)[]): HTMLElement {
  return el("div", { class: "card" }, ...children);
}

function tabbar(items: [string, string][], active = 0): HTMLElement {
  const bar = el("div", { class: "tabbar" });
  items.forEach(([ic, label], i) => {
    bar.append(el("span", { class: `tab${i === active ? " on" : ""}` }, lucide(ic), el("em", {}, label)));
  });
  return bar;
}

function avatar(initials: string, hue: number): HTMLElement {
  return el("span", { class: "avatar", style: `background:linear-gradient(140deg,hsl(${hue} 62% 60%),hsl(${hue + 30} 58% 40%))` }, initials);
}

/* ---------- Téléphone ---------- */
export function phoneContent(): HTMLElement {
  const calls: [string, string, string, string][] = [
    ["Camille Aubry", "Mobile — il y a 12 min", "phone-incoming", ""],
    ["Studio Nyne", "Lyon — il y a 1 h", "phone-missed", "missed"],
    ["Ian", "Mobile — hier", "phone-outgoing", ""],
    ["Maman", "Mobile — hier", "phone-incoming", ""],
    ["Julien R.", "Mobile — lundi", "phone-incoming", ""],
  ];
  const keys = ["1", "2ABC", "3DEF", "4GHI", "5JKL", "6MNO", "7PQRS", "8TUV", "9WXYZ", "*+", "0", "#"];
  const pad = el("div", { class: "keypad" },
    ...keys.map((k) => el("button", { class: "key g g-thin" },
      el("b", {}, k[0]), el("span", {}, k.slice(1)))));
  return el("div", { class: "app-flow" },
    el("div", { class: "sec-t" }, "Récents"),
    card(calls.map(([n, s, ic, cls]) =>
      el("div", { class: `row ${cls}` },
        avatar(n.split(" ").map((x) => x[0]).join(""), 210),
        el("span", { class: "row-tx" }, el("b", {}, n), el("span", {}, s)),
        lucide(ic, "row-luc")))),
    el("div", { class: "sec-t", style: "margin-top:14px" }, "Clavier"), pad);
}

/* ---------- Messages : liste → fil ---------- */
export function messagesContent(): HTMLElement {
  const convos: [string, string, string, number, string][] = [
    ["Camille", "On se retrouve à 19h au studio ?", "19:02", 2, "#1FA870"],
    ["Équipe Nyne", "La build WaveOS 0.9 est prête 🎉", "18:55", 0, "#5570D6"],
    ["Julien R.", "Je t'envoie les maquettes demain", "17:41", 0, "#B04A78"],
    ["Maman", "Appelle-moi quand tu peux", "16:20", 0, "#E87E1E"],
    ["Léa D.", "Top, à jeudi !", "hier", 0, "#2E8B57"],
  ];
  const openThread = (root: HTMLElement, name: string, hue: string) => {
    const bubbles: [string, boolean][] = [
      ["Salut ! Tu as vu la nouvelle maquette ?", false],
      ["Oui, elle est superbe. Les rubans rendent vraiment bien.", true],
      ["On se retrouve à 19h au studio ?", false],
      ["Parfait, j'y serai. J'apporte le proto.", true],
    ];
    const thread = el("div", { class: "thread" },
      ...bubbles.map(([txt, me]) => el("div", { class: `bub-m${me ? " me" : ""}` }, txt)),
      el("div", { class: "composer" },
        el("span", { class: "cmp-field" }, "Message…"),
        el("span", { class: "cmp-send", style: `background:${hue}` }, lucide("chevron-up"))));
    const back = el("button", { class: "row", style: "background:none;padding:10px 0" },
      lucide("chevron-left", "row-luc"), el("b", {}, name));
    back.addEventListener("click", () => { root.replaceChildren(list()); });
    root.replaceChildren(back, thread);
  };
  const list = (): HTMLElement => {
    const l = el("div", { class: "app-flow" }, card(convos.map(([n, p, t, u, hue]) => {
      const r = el("button", { class: "row" },
        avatar(n[0], parseInt(hue.slice(1), 16) % 360),
        el("span", { class: "row-tx" }, el("b", {}, n), el("span", {}, p)),
        el("span", { class: "row-r" }, t),
        u ? el("span", { class: "unread", style: `background:${hue}` }, String(u)) : el("span", {}));
      r.addEventListener("click", () => openThread(root, n, hue));
      return r;
    })));
    return l;
  };
  const root = el("div");
  root.append(list());
  return root;
}

/* ---------- Photos ---------- */
export function photosContent(): HTMLElement {
  const grid = el("div", { class: "ph-grid" });
  const hues = [210, 260, 320, 20, 40, 160, 190, 280, 340, 10, 60, 140];
  for (let i = 0; i < 15; i++) {
    const h = hues[i % hues.length];
    grid.append(el("div", {
      class: "ph-tile",
      style: `background:linear-gradient(${140 + i * 23}deg,hsl(${h} 70% 62%),hsl(${(h + 40) % 360} 60% 38%))`,
    }));
  }
  return el("div", { class: "app-flow" },
    el("div", { class: "ph-sub" }, "Octobre — 128 éléments"),
    grid,
    tabbar([["image", "Photothèque"], ["star", "Pour toi"], ["folder", "Albums"], ["search", "Rechercher"]]));
}

/* ---------- Horloge : vivante + villes ---------- */
export function clockContent(): HTMLElement {
  const cities: [string, number][] = [["Paris", 0], ["New York", -6], ["Tokyo", 7], ["Sydney", 9]];
  const big = el("div", { class: "clk-big" });
  const list = el("div", { class: "card" });
  const paint = () => {
    const now = new Date();
    const hm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    big.textContent = hm(now);
    list.replaceChildren(...cities.map(([city, off]) => {
      const d = new Date(now.getTime() + off * 3600_000);
      return el("div", { class: "row" },
        el("span", { class: "row-tx" }, el("b", {}, city),
          el("span", {}, off === 0 ? "Heure locale" : `UTC${off > 0 ? "+" : ""}${off}`)),
        el("span", { class: "row-r t-sub", style: "font-variant-numeric:tabular-nums;font-weight:600;font-size:calc(17px*var(--ts))" }, hm(d)));
    }));
  };
  paint();
  window.setInterval(paint, 20000);
  return el("div", { class: "app-flow" },
    el("div", { class: "clk-wrap" }, big, el("div", { class: "t-cap", style: "text-align:center;color:rgba(255,255,255,.55)" }, "Heure locale")),
    list,
    tabbar([["clock", "Heure"], ["alarm-clock", "Alarmes"], ["timer", "Chrono"], ["hourglass", "Minuteur"]]));
}

/* ---------- Météo ---------- */
export function meteoContent(): HTMLElement {
  const hours = [["Maint.", "19°", "cloud-sun"], ["19h", "18°", "cloud-rain"], ["20h", "16°", "cloud-rain"], ["21h", "15°", "cloud"], ["22h", "14°", "cloud"], ["23h", "13°", "moon"]];
  const days = [["Mer.", "12° / 19°", "cloud-rain"], ["Jeu.", "11° / 17°", "cloud"], ["Ven.", "10° / 18°", "cloud-sun"], ["Sam.", "9° / 16°", "sun"], ["Dim.", "8° / 15°", "sun"], ["Lun.", "9° / 17°", "cloud-sun"]];
  const sky = el("div", { class: "wx-sky" },
    el("i", { class: "s1" }), el("i", { class: "s2" }), el("i", { class: "s3" }));
  const hero = el("div", { class: "wx-hero" }, sky,
    el("div", { class: "wx-city" }, "Lyon"),
    el("div", { class: "wx-t" }, "19°"),
    el("div", { class: "wx-c" }, "Averses — Max. 21° · Min. 12°"));
  // « spatial camera movement » : la skyline glisse en parallaxe sous le doigt.
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    hero.style.setProperty("--wx", `${nx * 22}px`);
    hero.style.setProperty("--wy", `${ny * 10}px`);
  });
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--wx", "0px");
    hero.style.setProperty("--wy", "0px");
  });
  return el("div", { class: "app-flow" }, hero,
    el("div", { class: "sec-t" }, "Heure par heure"),
    el("div", { class: "wx-hours card" }, ...hours.map(([h, t, ic]) =>
      el("div", { class: "wx-h" }, el("span", {}, h), lucide(ic), el("b", {}, t)))),
    el("div", { class: "sec-t" }, "6 jours"),
    card(days.map(([d, t, ic]) => el("div", { class: "row" },
      el("span", { class: "row-tx" }, el("b", {}, d)),
      lucide(ic, "row-luc"),
      el("span", { class: "row-r" }, t)))));
}

/* ---------- Calculette : fonctionnelle ---------- */
export function calcContent(): HTMLElement {
  const display = el("div", { class: "calc-disp" }, "0");
  let acc = 0, cur = "", op: string | null = null, fresh = true;
  const render = () => { display.textContent = cur || String(acc); };
  const apply = (a: number, b: number, o: string) =>
    o === "+" ? a + b : o === "−" ? a - b : o === "×" ? a * b : b === 0 ? a : a / b;
  const press = (k: string) => {
    if (/[0-9.,]/.test(k)) {
      if (fresh) { cur = ""; fresh = false; }
      if (k === "," && cur.includes(",")) return;
      cur = cur === "0" ? k : cur + k;
    } else if (k === "C") { acc = 0; cur = ""; op = null; }
    else if (k === "+/-") { cur = cur.startsWith("-") ? cur.slice(1) : "-" + cur; }
    else if (k === "=") {
      if (op && cur) { acc = apply(acc, parseFloat(cur.replace(",", ".")), op); cur = String(acc).replace(".", ","); op = null; fresh = true; }
    } else {
      if (cur) { acc = op ? apply(acc, parseFloat(cur.replace(",", ".")), op) : parseFloat(cur.replace(",", ".")); }
      op = k; fresh = true;
    }
    render();
  };
  const rows = [
    ["C", "+/-", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ",", "="],
  ];
  const pad = el("div", { class: "calc-pad" },
    ...rows.map((r) => r.map((k) => {
      const isOp = "÷×−+=".includes(k);
      const isFn = "C+/-%".includes(k);
      const b = el("button", { class: `calc-k${isOp ? " op" : isFn ? " fn" : ""}${k === "0" ? " zero" : ""}` }, k);
      b.addEventListener("click", () => press(k));
      return b;
    })).flat());
  render();
  return el("div", { class: "app-flow calc" }, display, pad);
}

/* ---------- Musique ---------- */
export function musicContent(): HTMLElement {
  const tracks: [string, string, string][] = [
    ["Sillage", "Lumen", "3:42"], ["Courant calme", "Lumen", "4:10"],
    ["Reflets", "Nadir", "2:58"], ["Onde 07", "Celle", "5:01"], ["Marée basse", "Lumen", "4:47"],
  ];
  let playing = false;
  const pb = el("span", { role: "button", "aria-label": "Lecture", class: "mus-play" }, lucide("play"));
  pb.addEventListener("click", () => { playing = !playing; pb.replaceChildren(lucide(playing ? "pause" : "play")); });
  return el("div", { class: "app-flow" },
    el("div", { class: "mus-hero" },
      el("div", { class: "mus-art" }),
      el("b", {}, "Sillage"), el("span", {}, "Lumen — Single")),
    el("div", { class: "mus-track" }, el("div", { class: "mus-prog" })),
    el("div", { class: "mus-ctl" }, lucide("skip-back"), pb, lucide("skip-forward")),
    el("div", { class: "sec-t" }, "File d'attente"),
    card(tracks.map(([t, a, d]) => el("div", { class: "row" },
      el("span", { class: "row-ic", style: "background:rgba(255,255,255,.12)" }, lucide("music")),
      el("span", { class: "row-tx" }, el("b", {}, t), el("span", {}, a)),
      el("span", { class: "row-r" }, d)))));
}

/* ---------- Mail ---------- */
export function mailContent(): HTMLElement {
  const mails: [string, string, string, boolean, number][] = [
    ["Stripe", "Facture validée", "Votre paiement de 49,00 € a été accepté.", true, 200],
    ["Équipe Nyne", "Build 0.9 disponible", "Le snapshot de ce soir inclut le nouveau wallpaper.", true, 330],
    ["GitHub", "[WaveOS_Mobile] PR #1", "devin opened a pull request.", false, 30],
    ["Camille A.", "Re: studio", "On se retrouve à 19h ?", false, 160],
    ["Nyne Store", "Votre commande", "Expédiée — livraison jeudi.", false, 340],
  ];
  return el("div", { class: "app-flow" },
    el("div", { class: "sec-t" }, "Boîte de réception — 2 non lus"),
    card(mails.map(([f, s, p, u, hue]) => el("div", { class: "row" },
      avatar(f[0], hue),
      el("span", { class: "row-tx" },
        el("span", { class: "row-subj" }, u ? el("span", { class: "dot" }) : "", el("b", {}, f), el("em", {}, s)),
        el("span", {}, p))))));
}

/* ---------- Notes ---------- */
export function notesContent(): HTMLElement {
  const notes: [string, string, string][] = [
    ["Directions Sillage", "Rubans −16°, verre épais, motif O…", "18:30"],
    ["Idées icônes", "Squircle n=4.6 pour tout, glyphes Lucide…", "hier"],
    ["Recette ramen", "Bouillon 6h, chashu laqué, œuf ajitsuke…", "hier"],
    ["Roadmap produit", "v0.9 : CC/NC refaits, apps réelles, tests…", "lundi"],
  ];
  return el("div", { class: "app-flow" },
    el("div", { class: "sec-t" }, "iWave — 4 notes"),
    card(notes.map(([t, p, d]) => el("div", { class: "row" },
      el("span", { class: "row-tx" }, el("b", {}, t), el("span", {}, p)),
      el("span", { class: "row-r" }, d)))));
}

/* ---------- Rappels ---------- */
export function rappelsContent(): HTMLElement {
  const items: [string, string, boolean][] = [
    ["Design review", "16:00 — salle Rubans", false],
    ["Appeler le studio", "19:30", false],
    ["Point tests E2E", "Demain 09:00", false],
    ["Arroser les plantes", "Demain", true],
  ];
  return el("div", { class: "app-flow" },
    el("div", { class: "rgl-grid" },
      ...[["Aujourd'hui", "3", "#5570D6"], ["Programmé", "4", "#E87E1E"], ["Tout", "12", "#8B90A0"]].map(([t, n, c]) =>
        el("div", { class: "rgl card" }, el("b", { style: `color:${c}` }, String(n)), el("span", {}, String(t))))),
    el("div", { class: "sec-t" }, "Aujourd'hui"),
    card(items.map(([t, s, done]) => el("button", { class: `row rgl${done ? " done" : ""}` },
      el("span", { class: "rgl-dot", style: done ? "background:var(--jade)" : "" }),
      el("span", { class: "row-tx" }, el("b", {}, t), el("span", {}, s))))));
}

/* ---------- Fichiers ---------- */
export function fichiersContent(): HTMLElement {
  const folders: [string, string][] = [["Maquettes", "12 éléments"], ["Specs", "8 éléments"], ["Exports", "34 éléments"], ["Photos shoot", "210 éléments"]];
  const files: [string, string, string][] = [
    ["direction-v3.fig", "il y a 2 h", "file"],
    ["waveos-spec.pdf", "hier", "file"],
    ["wallpaper-rubans.png", "hier", "image"],
  ];
  return el("div", { class: "app-flow" },
    el("div", { class: "fich-grid" },
      ...folders.map(([n, c]) => el("div", { class: "card fich" },
        el("span", { class: "row-ic", style: "background:var(--opale)" }, lucide("folder")),
        el("b", {}, n), el("span", {}, c)))),
    el("div", { class: "sec-t" }, "Récents"),
    card(files.map(([n, d, ic]) => el("div", { class: "row" },
      el("span", { class: "row-ic", style: "background:rgba(255,255,255,.12)" }, lucide(ic)),
      el("span", { class: "row-tx" }, el("b", {}, n), el("span", {}, d))))));
}

/* ---------- Caméra ---------- */
export function cameraContent(): HTMLElement {
  return el("div", { class: "app-flow cam" },
    el("div", { class: "cam-view" },
      el("div", { class: "cam-grid" }),
      el("div", { class: "cam-modes" }, ...["Vidéo", "Photo", "Portrait", "Pano"].map((m, i) =>
        el("span", { class: i === 1 ? "on" : "" }, m)))),
    el("div", { class: "cam-bar" },
      el("span", { class: "cam-thumb" }),
      el("button", { class: "cam-shut", "aria-label": "Déclencher" }),
      lucide("refresh-cw", "cam-flip")));
}

/* ---------- Plans ---------- */
export function plansContent(): HTMLElement {
  const pins: [number, number, string][] = [[140, 210, "#FF5FA2"], [230, 330, "#4FD8FF"], [90, 420, "#F0A02E"]];
  return el("div", { class: "app-flow plans" },
    el("div", { class: "map-view" },
      ...pins.map(([x, y, c]) => el("span", { class: "pin", style: `left:${x}px;top:${y}px;color:${c}` }, lucide("map-pin")))),
    el("div", { class: "map-search g g-thin" }, lucide("search"), "Rechercher un lieu"),
    card([
      el("div", { class: "row" },
        el("span", { class: "row-ic", style: "background:var(--jade)" }, lucide("home")),
        el("span", { class: "row-tx" }, el("b", {}, "Maison"), el("span", {}, "12 min — A6"))),
      el("div", { class: "row" },
        el("span", { class: "row-ic", style: "background:var(--opale)" }, lucide("map-pin")),
        el("span", { class: "row-tx" }, el("b", {}, "Studio Nyne"), el("span", {}, "8 min — Part-Dieu"))),
    ]));
}

/* ---------- Santé ---------- */
export function santeContent(): HTMLElement {
  const rings: [string, number, string][] = [["Bouger", 78, "#FF5FA2"], ["Exercice", 62, "#2FCC92"], ["Debout", 90, "#4FD8FF"]];
  const stats: [string, string, string, string][] = [
    ["Pas", "8 214", "activity", "#2FCC92"], ["Sommeil", "7 h 12", "moon", "#8A7CFF"],
    ["Fréquence", "64 bpm", "heart-pulse", "#FF6B57"], ["Étages", "9", "layers", "#F0A02E"],
  ];
  return el("div", { class: "app-flow" },
    el("div", { class: "rings" },
      ...rings.map(([n, v, c]) => el("div", { class: "ring-w" },
        el("div", { class: "ring", style: `background:conic-gradient(${c} ${v}%,rgba(255,255,255,.10) ${v}%)` }, el("span", {}, `${v}%`)),
        el("em", {}, n)))),
    el("div", { class: "fich-grid" },
      ...stats.map(([n, v, ic, c]) => el("div", { class: "card fich" },
        el("span", { class: "row-ic", style: `background:${c}` }, lucide(ic)),
        el("b", {}, v), el("span", {}, n)))));
}

/* ---------- Bourse ---------- */
export function bourseContent(): HTMLElement {
  const stocks: [string, string, string, boolean, string][] = [
    ["NYNE", "184,32 €", "+2,4 %", true, "M4 16 10 10l4 3 6-7"],
    ["AAPL", "228,10 $", "+0,8 %", true, "M4 14l5-4 4 3 7-5"],
    ["TSLA", "174,90 $", "−1,3 %", false, "M4 9l5 5 4-2 7 4"],
    ["MSFT", "412,55 $", "+1,1 %", true, "M4 15l6-5 4 2 6-4"],
    ["NVDA", "131,20 $", "+3,9 %", true, "M4 17l4-6 5 2 7-8"],
  ];
  const spark = (d: string, up: boolean) => {
    const s = svgEl("svg", { viewBox: "0 0 24 24", class: "spark" });
    s.append(svgEl("path", { d, fill: "none", stroke: up ? "#2FCC92" : "#FF6B57", "stroke-width": 1.8, "stroke-linecap": "round" }));
    return s;
  };
  return el("div", { class: "app-flow" },
    el("div", { class: "sec-t" }, "Favoris"),
    card(stocks.map(([sym, px, ch, up, d]) => el("div", { class: "row" },
      el("span", { class: "row-tx" }, el("b", {}, sym), el("span", {}, px)),
      spark(d, up),
      el("span", { class: `row-r${up ? " up" : " dn"}` }, ch)))));
}

/* ---------- Wave Store ---------- */
export function storeContent(): HTMLElement {
  const apps: [string, string, string, string][] = [
    ["Celle", "Musique & ondes", "music", "#E8446B"],
    ["Nadir Studio", "Montage photo", "image", "#5570D6"],
    ["Flux", "Productivité", "check-circle", "#2FCC92"],
    ["Traînée", "Course GPS", "activity", "#F0A02E"],
  ];
  return el("div", { class: "app-flow" },
    el("div", { class: "store-hero" },
      el("div", { class: "t-cap", style: "color:rgba(255,255,255,.6)" }, "SÉLECTION"),
      el("b", {}, "Apps qui ondulent"),
      el("p", {}, "Les meilleures apps WaveOS de la semaine.")),
    el("div", { class: "sec-t" }, "Incontournables"),
    card(apps.map(([n, s, ic, c]) => el("div", { class: "row" },
      el("span", { class: "row-ic", style: `background:${c}` }, lucide(ic)),
      el("span", { class: "row-tx" }, el("b", {}, n), el("span", {}, s)),
      el("button", { class: "get" }, "Obtenir")))));
}

/* ---------- Navigateur ---------- */
export function navContent(): HTMLElement {
  const favs: [string, string, string][] = [
    ["wave.os", "globe", "#5570D6"], ["docs.devin.ai", "file-text", "#2FCC92"],
    ["github.com", "globe", "#8B90A0"], ["huawei.dev", "globe", "#E8446B"],
  ];
  return el("div", { class: "app-flow" },
    el("div", { class: "map-search g g-thin", style: "margin-bottom:14px" }, lucide("search"), "Rechercher ou saisir une URL"),
    el("div", { class: "sec-t" }, "Favoris"),
    el("div", { class: "fich-grid" },
      ...favs.map(([n, ic, c]) => el("div", { class: "card fich" },
        el("span", { class: "row-ic", style: `background:${c}` }, lucide(ic)),
        el("b", {}, n)))));
}
