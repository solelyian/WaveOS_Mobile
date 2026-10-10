// phone.ts — téléphone complet : clavier (effacement, appel), favoris, fiche
// contact (appel/message/FaceTime), récents cliquables, voicemail avec lecteur
// et transcription, écran d'appel avec chrono et boutons à état réel
// (mute/speaker actifs, pavé in-call, liste de contacts in-call).
import { h, svgIcon } from "../core/el";
import { I } from "../core/lucide";
import { GlassHeader, FloatingTabBar, img, pane, toast } from "./ui";
import { shell } from "../shell/api";

const CONTACTS = [
  ["Alex Morgan", "+1 (415) 555-0142", "/img/avatar/a-2.jpg"],
  ["Jordan Lee", "+1 (628) 555-0177", "/img/avatar/a-5.jpg"],
  ["Sam Rivera", "+1 (510) 555-0109", "/img/avatar/a-8.jpg"],
  ["Mom", "+1 (925) 555-0134", "/img/avatar/a-12.jpg"],
  ["Chris Park", "+1 (650) 555-0190", "/img/avatar/a-21.jpg"],
  ["Taylor Kim", "+1 (415) 555-0128", "/img/avatar/a-24.jpg"],
] as const;

const RECENTS = [
  ["Alex Morgan", "phoneIncoming", "9:10 AM", "mobile"],
  ["Mom", "phoneMissed", "Yesterday", "mobile"],
  ["Jordan Lee", "phoneOutgoing", "Yesterday", "FaceTime audio"],
  ["Sam Rivera", "phoneIncoming", "Monday", "mobile"],
] as const;

const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]] as const;

const VM = [
  ["Mom", "2:14", "Yesterday", "Hi honey, it's me. Just calling to check if you're still coming for dinner on Sunday — your brother will be there too. Call me back when you get this, love you!", "/img/avatar/a-12.jpg"],
  ["Unknown", "0:37", "Monday", "This is a reminder about your delivery scheduled for tomorrow between 9 AM and noon. Press any key to reschedule.", ""],
] as const;

export function PhoneApp() {
  const root = h("div", { class: "pg", style: { height: "100%", display: "flex", flexDirection: "column", background: "#f4f4f5" } });
  const scroll = h("div", { class: "app-scroll no-sb", style: { padding: "0 20px 120px", display: "flex", flexDirection: "column" } });
  let digits = "";

  // ---- écran d'appel -------------------------------------------------------
  function call(name: string, avatar?: string) {
    pane(root, (close) => {
      const st = h("div", { style: { fontSize: "15px", color: "rgba(255,255,255,.75)", marginTop: "4px" } }, "calling…");
      let secs = -1;
      const iv = setInterval(() => {
        secs++;
        st.textContent = secs < 0 ? "calling…" : `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
      }, 800);
      setTimeout(() => { if (secs < 0) { secs = 0; st.textContent = "00:00"; } }, 1500);
      const end = () => { clearInterval(iv); close(); };

      const active = new Set<string>();
      const btn = (ic: keyof typeof I, l: string, fn?: (b: HTMLElement) => void) => {
        const b = h("button", { class: "g-btn pressable", style: { width: "62px", height: "62px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "background .2s" },
          onClick: () => {
            if (fn) return fn(b);
            active.has(l) ? (active.delete(l), b.style.background = "") : (active.add(l), b.style.background = "rgba(255,255,255,.28)");
          } }, svgIcon(I[ic], "", 22));
        return h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" } },
          b, h("span", { style: { fontSize: "11px", color: "rgba(255,255,255,.7)" } }, l));
      };

      const inCallKeypad = (wrap: HTMLElement) => {
        const d = h("div", { style: { position: "absolute", inset: "0", zIndex: "90", background: "rgba(10,10,12,.96)", display: "flex", flexDirection: "column", alignItems: "center", padding: "90px 28px 60px", transform: "translateY(100%)", transition: "transform .3s cubic-bezier(.32,.72,.35,1)" } },
          h("div", { style: { fontSize: "22px", fontWeight: "600", color: "#fff", marginBottom: "26px" } }, name),
          h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,72px)", gap: "12px", justifyContent: "center" } },
            ...KEYS.map(([n, s]) => h("button", { class: "pk-key", style: { background: "rgba(255,255,255,.1)", color: "#fff" }, onClick: (e) => { (e.currentTarget as HTMLElement).animate([{ transform: "scale(.88)" }, { transform: "scale(1)" }], { duration: 140 }); } },
              h("span", { class: "n" }, n), h("span", { class: "s", style: { color: "rgba(255,255,255,.4)" } }, s || " ")))),
          h("div", { style: { flex: "1" } }),
          h("button", { class: "pressable", style: { padding: "12px 34px", borderRadius: "999px", background: "rgba(255,255,255,.14)", color: "#fff", fontWeight: "600", fontSize: "15px" },
            onClick: () => { d.style.transform = "translateY(100%)"; setTimeout(() => d.remove(), 300); } }, "Hide"));
        wrap.append(d);
        requestAnimationFrame(() => d.style.transform = "none");
      };

      const inCallContacts = () => pane(root, (close2) =>
        h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
            h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close2 }, svgIcon(I.chevronLeft, "", 18)),
            h("span", { style: { fontWeight: "700", fontSize: "17px" } }, "Contacts")),
          h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "0 16px" } },
            h("div", { class: "card-white", style: { padding: "2px 14px" } },
              ...CONTACTS.map(([n, num, a]) => h("div", { class: "lrow pressable", onClick: () => { close2(); toast(root, `Merging call with ${n.split(" ")[0]}…`); } },
                img(a, "av rd"), h("div", { class: "tx" }, h("div", { class: "t1" }, n), h("div", { class: "t2" }, num)),
                h("span", { style: { color: "#22c55e" } }, svgIcon(I.plus, "", 18))))))));

      // iOS 26 : fond photo flouté plein écran, nom + « mobile » + chrono en
      // haut, carte verre 3×2 en bas — speaker/FaceTime/mute · add call/END/keypad.
      const endBtn = h("button", { class: "pressable", style: { width: "68px", height: "68px", borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(239,68,68,.4)" }, onClick: end },
        h("span", { style: { display: "flex", transform: "rotate(135deg)" } }, svgIcon(I.phone, "", 28)));
      const endCell = h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" } },
        endBtn, h("span", { style: { fontSize: "11px", color: "rgba(255,255,255,.7)" } }, "end"));

      // fond verre : photo du contact, sinon le wallpaper du homescreen (flouté)
      const wpBg = document.getElementById("wp")?.style.backgroundImage || "url(/img/wallpaper.jpg)";
      const wrap = h("div", { class: "pg", style: { position: "relative", color: "#fff", height: "100%", overflow: "hidden" } },
        avatar
          ? h("div", { style: { position: "absolute", inset: "-24px", background: `url(${avatar}) center/cover`, filter: "blur(30px) brightness(.62) saturate(1.35)", transform: "scale(1.05)" } })
          : h("div", { style: { position: "absolute", inset: "-24px", backgroundImage: wpBg, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(26px) brightness(.58) saturate(1.4)", transform: "scale(1.08)" } }),
        h("div", { style: "position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 30%,transparent 60%,rgba(0,0,0,.5))" }),
        h("div", { style: { position: "relative", zIndex: "2", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "76px 28px 44px" } },
          !avatar ? h("div", { style: { width: "84px", height: "84px", borderRadius: "50%", background: "rgba(255,255,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" } }, svgIcon(I.user, "", 36)) : null,
          h("div", { style: { fontSize: "30px", fontWeight: "700", letterSpacing: "-.01em" } }, name),
          h("div", { style: { fontSize: "13px", color: "rgba(255,255,255,.6)", marginTop: "3px" } }, "mobile"),
          h("div", { style: { marginTop: "2px" } }, st),
          h("div", { style: { flex: "1" } }),
          h("div", { style: { width: "100%", padding: "22px 18px 24px", borderRadius: "40px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)", backdropFilter: "blur(24px) saturate(160%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.16), 0 18px 40px rgba(0,0,0,.35)" } },
            h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px 8px" } },
              btn("volume2", "speaker"),
              btn("video", "FaceTime", () => toast(root, "Switching to FaceTime…")),
              btn("micOff", "mute"),
              btn("plus", "add call", () => inCallContacts()),
              endCell,
              btn("layoutGrid", "keypad", () => inCallKeypad(wrap))))));
      return wrap;
    });
  }

  // ---- fiche contact -------------------------------------------------------
  function contactCard(name: string, num: string, avatar: string) {
    pane(root, (close) => {
      const act = (ic: keyof typeof I, l: string, bg: string, fn: () => void) =>
        h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" } },
          h("button", { class: "pressable", style: { width: "54px", height: "54px", borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: () => { close(); fn(); } }, svgIcon(I[ic], "", 20)),
          h("span", { style: { fontSize: "11px", color: "#6b7280", fontWeight: "600" } }, l));
      return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", alignItems: "center", padding: "60px 16px 4px" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: close }, svgIcon(I.chevronLeft, "", 18))),
        h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "10px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center" } },
          h("div", { style: { width: "104px", height: "104px", borderRadius: "50%", overflow: "hidden", marginBottom: "12px", boxShadow: "0 12px 30px rgba(0,0,0,.15)" } }, img(avatar, "img-fill")),
          h("div", { style: { fontSize: "24px", fontWeight: "800", letterSpacing: "-.01em" } }, name),
          h("div", { style: { display: "flex", gap: "18px", margin: "20px 0 26px" } },
            act("messageCircle", "message", "#2563eb", () => shell.launchApp("messages")),
            act("phone", "call", "#22c55e", () => call(name, avatar)),
            act("video", "video", "#0ea5e9", () => call(name, avatar)),
            act("mail", "mail", "#8b5cf6", () => shell.launchApp("mail"))),
          h("div", { class: "card-white", style: { width: "100%", padding: "2px 14px" } },
            h("div", { class: "lrow" }, h("div", { class: "set-ic", style: { background: "#22c55e" } }, svgIcon(I.phone)), h("div", { class: "tx" }, h("div", { class: "t2" }, "mobile"), h("div", { class: "t1" }, num))),
            h("div", { class: "lrow" }, h("div", { class: "set-ic", style: { background: "#8b5cf6" } }, svgIcon(I.mail)), h("div", { class: "tx" }, h("div", { class: "t2" }, "email"), h("div", { class: "t1" }, `${name.split(" ")[0].toLowerCase()}@nyne.dev`))),
            h("div", { class: "lrow" }, h("div", { class: "set-ic", style: { background: "#f59e0b" } }, svgIcon(I.bell)), h("div", { class: "tx" }, h("div", { class: "t1" }, "Ringtone"), h("div", { class: "t2" }, "Ripples")))),
          h("div", { class: "card-white pressable", style: { width: "100%", marginTop: "12px", padding: "14px", textAlign: "center", color: "#ef4444", fontWeight: "600" },
            onClick: () => { close(); toast(root, `${name.split(" ")[0]} blocked`); } }, "Block this Caller")));
    });
  }

  // ---- voicemail -----------------------------------------------------------
  function voicemail(name: string, dur: string, when: string, transcript: string, avatar: string) {
    pane(root, (close) => {
      let playing = false, pos = 0;
      const secs = (() => { const [m, s] = dur.split(":").map(Number); return m * 60 + s; })();
      const fill = h("i", { style: { display: "block", height: "100%", width: "0%", background: "#2563eb", borderRadius: "3px", transition: "width .2s linear" } });
      const timeEl = h("span", { style: { fontSize: "11px", color: "#9ca3af", fontVariantNumeric: "tabular-nums" } }, `0:00 / ${dur}`);
      const pp = h("button", { class: "pressable", style: { width: "52px", height: "52px", borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
        onClick: () => { playing = !playing; draw(); } });
      const draw = () => pp.replaceChildren(svgIcon(playing ? I.pause : I.play, "fill", 22) as Node);
      let raf = 0, last = 0;
      const tick = (t: number) => {
        if (!last) last = t;
        if (playing) { pos += (t - last) / 1000; if (pos >= secs) { pos = secs; playing = false; draw(); } }
        last = t;
        fill.style.width = `${(pos / secs) * 100}%`;
        timeEl.textContent = `${Math.floor(pos / 60)}:${String(Math.floor(pos % 60)).padStart(2, "0")} / ${dur}`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      const stop = () => { cancelAnimationFrame(raf); close(); };
      return h("div", { class: "pg", style: { background: "#f4f4f5", height: "100%", display: "flex", flexDirection: "column" } },
        h("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "60px 16px 10px" } },
          h("button", { class: "g-btn", style: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: stop }, svgIcon(I.chevronLeft, "", 18)),
          h("span", { style: { fontWeight: "700", fontSize: "17px" } }, "Voicemail")),
        h("div", { class: "no-sb", style: { flex: "1", overflowY: "auto", padding: "6px 20px 40px" } },
          h("div", { class: "card-white", style: { display: "flex", alignItems: "center", gap: "12px", padding: "14px" } },
            avatar ? img(avatar, "av rd") : h("div", { class: "av rd", style: { background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" } }, svgIcon(I.user, "", 20)),
            h("div", { style: { flex: "1" } }, h("div", { style: { fontWeight: "700", fontSize: "16px" } }, name), h("div", { style: { fontSize: "12px", color: "#9ca3af" } }, when)),
            h("button", { class: "pressable", style: { width: "38px", height: "38px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }, onClick: () => { stop(); call(name, avatar || undefined); } }, svgIcon(I.phone, "", 16))),
          h("div", { class: "card-white", style: { marginTop: "14px", padding: "18px" } },
            h("div", { style: { display: "flex", alignItems: "center", gap: "14px" } },
              (draw(), pp),
              h("div", { style: { flex: "1" } },
                h("div", { style: { height: "6px", borderRadius: "3px", background: "rgba(0,0,0,.08)", overflow: "hidden" } }, fill),
                h("div", { style: { marginTop: "6px" } }, timeEl))),
            h("div", { style: { height: "1px", background: "rgba(0,0,0,.06)", margin: "16px -18px" } }),
            h("div", { style: { fontSize: "11px", fontWeight: "700", letterSpacing: ".08em", color: "#9ca3af", textTransform: "uppercase", marginBottom: "6px" } }, "Transcription"),
            h("p", { style: { fontSize: "14px", lineHeight: "1.55", color: "#374151" } }, transcript))));
    });
  }

  // ---- clavier -------------------------------------------------------------
  const fmtNumber = (raw: string) => {
    const plus = raw.startsWith("+");
    let d = (plus ? raw.slice(1) : raw).replace(/\D/g, "");
    // code pays : « +1 » séparé comme iOS (+1 (415) 555-0142), sinon « + » collé
    let cc = plus ? "+" : "";
    if (plus && d.startsWith("1") && d.length > 10) { cc = "+1 "; d = d.slice(1); }
    let out = "";
    if (d.length <= 3) out = d;
    else if (d.length <= 6) out = `${d.slice(0, 3)}-${d.slice(3)}`;
    else if (d.length <= 10) out = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    else out = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)} ${d.slice(10)}`;
    return cc + out;
  };
  const normalize = (s: string) => s.replace(/\D/g, "");
  const matchContact = () => {
    const d = normalize(digits);
    if (d.length < 4) return null;
    const c = CONTACTS.find(([, num]) => {
      const n = normalize(num), local = n.slice(-10);
      return local.startsWith(d) || d.endsWith(local) || (d.startsWith("1") && d.slice(1).endsWith(local));
    });
    return c ? c[0] : null;
  };

  const keypad = () => {
    const disp = h("div", { style: { textAlign: "center", fontSize: "38px", fontWeight: "300", letterSpacing: ".01em", minHeight: "48px", margin: "4px 0 0", fontVariantNumeric: "tabular-nums", transition: "font-size .15s" } }, " ");
    const who = h("div", { style: { textAlign: "center", fontSize: "13px", fontWeight: "600", color: "#22c55e", minHeight: "18px", marginBottom: "10px" } }, " ");
    let suppress0 = false;
    const delBtn = h("button", { class: "pressable", style: { width: "68px", height: "68px", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", visibility: "hidden" } }, svgIcon(I.delete, "", 26));
    const upd = () => {
      disp.textContent = fmtNumber(digits) || " ";
      disp.style.fontSize = digits.replace(/\D/g, "").length > 10 ? "30px" : "38px";
      who.textContent = matchContact() ?? " ";
      delBtn.style.visibility = digits ? "visible" : "hidden";
    };
    // effacement : tap = 1 chiffre, maintien = tout effacer
    let hold = 0;
    delBtn.addEventListener("pointerdown", () => { hold = window.setTimeout(() => { digits = ""; upd(); }, 550); });
    for (const ev of ["pointerup", "pointerleave", "pointercancel"]) delBtn.addEventListener(ev, () => { clearTimeout(hold); });
    delBtn.addEventListener("click", () => { digits = digits.slice(0, -1); upd(); });
    const callRow = h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,80px)", justifyContent: "center", alignItems: "center", marginTop: "14px" } },
      h("span"),
      h("button", { class: "pressable", style: { width: "68px", height: "68px", borderRadius: "50%", background: "#22c55e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", justifySelf: "center" },
        onClick: () => { if (!digits) { toast(root, "Enter a number"); return; } call(fmtNumber(digits)); digits = ""; upd(); } }, svgIcon(I.phone, "", 28)),
      delBtn);
    scroll.append(disp, who,
      h("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,80px)", gap: "12px", justifyContent: "center" } },
        ...KEYS.map(([n, s]) => {
          const b = h("button", { class: "pk-key", onClick: () => { if (n === "0" && suppress0) { suppress0 = false; return; } digits += n; upd(); } },
            h("span", { class: "n" }, n), s ? h("span", { class: "s" }, s) : h("span", { class: "s" }, " "));
          if (n === "0") { // maintien 0 -> « + » (préfixe international)
            let t = 0;
            b.addEventListener("pointerdown", () => { t = window.setTimeout(() => { suppress0 = true; if (!digits.startsWith("+")) { digits = "+" + digits; upd(); } }, 500); });
            for (const ev of ["pointerup", "pointerleave", "pointercancel"]) b.addEventListener(ev, () => { clearTimeout(t); });
          }
          return b;
        })),
      callRow);
  };

  const personRow = (name: string, avatar: string, sub: string, ic: keyof typeof I = "phone", red = false) =>
    h("div", { class: "lrow pressable", onClick: () => { const c = CONTACTS.find((x) => x[0] === name); contactCard(name, c ? c[1] : sub, avatar); } },
      img(avatar, "av rd"),
      h("div", { class: "tx" }, h("div", { class: "t1", style: red ? { color: "#ef4444" } : {} }, name), h("div", { class: "t2" }, sub)),
      h("button", { class: "pressable", style: { width: "34px", height: "34px", borderRadius: "50%", background: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" },
        onClick: (e) => { e.stopPropagation(); call(name, avatar); } }, svgIcon(I[ic], "", 16)));

  const show = (tab: string) => {
    scroll.replaceChildren();
    if (tab === "keypad") { keypad(); return; }
    if (tab === "favorites") {
      scroll.append(h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" } },
        ...CONTACTS.slice(0, 4).map(([n, num, a]) => h("div", { class: "card-white pressable", style: { padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }, onClick: () => contactCard(n, num, a) },
          h("div", { style: { position: "relative" } },
            h("div", { style: { width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden" } }, img(a, "img-fill")),
            h("div", { style: { position: "absolute", top: "-4px", right: "-4px", background: "#f59e0b", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" } }, svgIcon(I.star, "fill", 12))),
          h("span", { style: { fontWeight: "600", fontSize: "14px" } }, n),
          h("span", { style: { fontSize: "11px", color: "#9ca3af", marginTop: "-6px" } }, "mobile")))));
    } else if (tab === "contacts") {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...CONTACTS.map(([n, num, a]) => personRow(n, a, num))));
    } else if (tab === "voicemail") {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...VM.map(([n, d, t, tr, a]) =>
          h("div", { class: "lrow pressable", onClick: () => voicemail(n, d, t, tr, a) },
            h("div", { class: "set-ic", style: { background: "#6b7280" } }, svgIcon(I.voicemail)),
            h("div", { class: "tx" }, h("div", { class: "t1" }, n), h("div", { class: "t2" }, `${d} · ${t}`)),
            h("button", { class: "pressable", style: { color: "#2563eb" }, onClick: (e) => { e.stopPropagation(); voicemail(n, d, t, tr, a); } }, svgIcon(I.play, "fill", 20))))));
    } else {
      scroll.append(h("div", { class: "card-white", style: { padding: "2px 14px" } },
        ...RECENTS.map(([n, ic, t, how]) => {
          const c = CONTACTS.find((x) => x[0] === n);
          return personRow(n, c ? c[2] : "/img/avatar/a-0.jpg", `${how} · ${t}`, ic as keyof typeof I, ic === "phoneMissed");
        })));
    }
  };

  const tabs = FloatingTabBar([
    { id: "favorites", icon: "star", label: "Favorites" },
    { id: "recents", icon: "clock", label: "Recents" },
    { id: "contacts", icon: "user", label: "Contacts" },
    { id: "keypad", icon: "layoutGrid", label: "Keypad" },
    { id: "voicemail", icon: "voicemail", label: "Voicemail" },
  ], "keypad", show);

  show("keypad");
  root.append(GlassHeader("Phone", {}), scroll, tabs.el);
  return root;
}
