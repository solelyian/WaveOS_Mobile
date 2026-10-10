// maps.ts — plans vivant : recherche de lieux, catégories qui déplacent le
// repère, mode itinéraire avec étapes, raster C++ en fond.
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, img, toast } from "./ui";

const PLACES = [
  { name: "Union Square", cat: "Shopping", x: 52, y: 46, dist: "1.2 km", im: "/img/maps-1.jpg" },
  { name: "Ferry Building", cat: "Food & Drink", x: 78, y: 30, dist: "2.8 km", im: "/img/maps-2.jpg" },
  { name: "Golden Gate Park", cat: "Parks", x: 18, y: 62, dist: "5.4 km", im: "/img/maps-3.jpg" },
  { name: "Blue Bottle Coffee", cat: "Coffee", x: 60, y: 58, dist: "800 m", im: "/img/maps-1.jpg" },
  { name: "SFMOMA", cat: "Culture", x: 66, y: 44, dist: "1.6 km", im: "/img/maps-2.jpg" },
];

export function MapsApp() {
  const root = h("div", { class: "pg", style: { height: "100%", position: "relative", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const canvas = h("div", { style: { flex: "1", position: "relative", overflow: "hidden", background: "#dce8d4" } });
  const pin = h("div", { style: { position: "absolute", transform: "translate(-50%,-100%)", transition: "left .5s cubic-bezier(.32,.72,.35,1), top .5s cubic-bezier(.32,.72,.35,1)", zIndex: "5", filter: "drop-shadow(0 4px 6px rgba(0,0,0,.3))" } },
    h("div", { style: { color: "#ef4444" } }, svgIcon(I.mapPin, "fill", 34)));
  let place = PLACES[0];

  const card = h("div", { class: "card-white", style: { margin: "10px 16px 0", overflow: "hidden" } });
  const drawCard = (route = false) => {
    card.replaceChildren(
      h("div", { style: { height: "110px", overflow: "hidden", position: "relative" } },
        img(place.im, "img-fill"),
        h("div", { style: { position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 10px", borderRadius: "999px" } }, place.dist)),
      h("div", { style: { padding: "14px 16px" } },
        h("div", { style: { fontSize: "18px", fontWeight: "700" } }, place.name),
        h("div", { style: { fontSize: "13px", color: "#9ca3af", margin: "2px 0 12px" } }, place.cat + " · Open now"),
        route
          ? h("div", {},
              ...[["Head north on Market St", "400 m"], ["Turn left onto Van Ness Ave", "600 m"], ["Arrive at " + place.name, ""],
              ].map(([s, d]) => h("div", { style: { display: "flex", gap: "10px", alignItems: "center", padding: "7px 0", borderTop: "1px solid rgba(0,0,0,.05)" } },
                svgIcon(I.navigation, "", 16), h("span", { style: { flex: "1", fontSize: "14px", fontWeight: "500" } }, s), h("span", { style: { fontSize: "12px", color: "#9ca3af" } }, d))))
          : h("button", { class: "pressable", style: { width: "100%", padding: "11px", borderRadius: "14px", background: "#22c55e", color: "#fff", fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
              onClick: () => drawCard(true) }, svgIcon(I.navigation, "", 16), "Directions · 8 min")));
  };

  const go = (p: typeof PLACES[number]) => {
    place = p;
    pin.style.left = p.x + "%"; pin.style.top = p.y + "%";
    drawCard();
    canvas.append(pin);
  };

  const input = h("input", { attrs: { placeholder: "Search Maps" }, style: { flex: "1", border: "none", outline: "none", background: "none", fontSize: "14px" } }) as HTMLInputElement;
  const results = h("div", { style: { display: "none", margin: "0 16px" } });
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    const hits = PLACES.filter((p) => !q || (p.name + p.cat).toLowerCase().includes(q));
    results.style.display = q ? "block" : "none";
    results.replaceChildren(h("div", { class: "card-white", style: { padding: "4px 10px", marginTop: "6px" } },
      ...(hits.length ? hits.map((p) => h("div", { class: "lrow pressable", onClick: () => { go(p); input.value = ""; results.style.display = "none"; } },
        h("div", { class: "set-ic", style: { background: "#22c55e" } }, svgIcon(I.mapPin)),
        h("div", { class: "tx" }, h("div", { class: "t1" }, p.name), h("div", { class: "t2" }, p.cat + " · " + p.dist))))
        : [h("div", { style: { padding: "14px", fontSize: "13px", color: "#9ca3af" } }, "No results")])));
  });

  const chips = h("div", { class: "no-sb", style: { display: "flex", gap: "8px", overflowX: "auto", padding: "0 16px 8px" } },
    ...([["Coffee", "Coffee"], ["Food", "Food & Drink"], ["Parks", "Parks"], ["Culture", "Culture"], ["Shopping", "Shopping"]] as const).map(([l, c]) =>
      h("button", { class: "chip", onClick: (e) => {
        chips.querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
        (e.currentTarget as HTMLElement).classList.add("on");
        const p = PLACES.find((x) => x.cat === c || x.cat.startsWith(c));
        if (p) go(p);
      } }, l)));

  go(place);
  canvas.append(
    h("div", { style: { position: "absolute", inset: "0", backgroundImage: "repeating-linear-gradient(0deg,transparent 0 39px,rgba(120,140,110,.35) 39px 40px),repeating-linear-gradient(90deg,transparent 0 39px,rgba(120,140,110,.35) 39px 40px)" } }),
    h("div", { style: { position: "absolute", left: "40%", top: "0", width: "26px", height: "100%", background: "rgba(255,255,255,.85)", transform: "skewX(-8deg)" } }),
    h("div", { style: { position: "absolute", top: "52%", left: "0", height: "22px", width: "100%", background: "rgba(255,255,255,.85)" } }),
    h("div", { style: { position: "absolute", left: "8%", top: "8%", width: "24%", height: "30%", borderRadius: "24px", background: "#b8d8a8" } }),
    h("div", { style: { position: "absolute", right: "6%", bottom: "10%", width: "30%", height: "22%", borderRadius: "50%", background: "#a8cf98" } }),
    pin,
    h("div", { style: { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", zIndex: "4" } },
      h("div", { style: { width: "18px", height: "18px", borderRadius: "50%", background: "#2563eb", border: "3px solid #fff", boxShadow: "0 0 0 8px rgba(37,99,235,.2)" } })));

  root.append(
    GlassHeader("Maps", {}),
    h("div", { style: { padding: "0 16px 10px", position: "relative", zIndex: "6" } },
      h("div", { class: "search-pill" }, svgIcon(I.search), input, h("button", { onClick: () => toast(root, "Voice search") }, svgIcon(I.mic, "", 15))),
      results),
    chips, canvas, card,
    h("div", { style: { height: "90px" } }));
  return root;
}
