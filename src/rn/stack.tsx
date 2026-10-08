// stack.tsx — mini-navigateur à pile façon iOS : push slide-in 100%→0 avec
// parallaxe de l'écran quitté (-28%), pop symétrique (l'écran sortant file
// à droite pendant que le précédent remonte). Le conteneur de transition
// est une div DOM : le kit peut toucher le web, les apps restent en RN pur.
import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Screen { key: number; node: ReactNode; leaving?: boolean; born?: boolean }

export const StackCtx = createContext<{ push: (n: ReactNode) => void; pop: () => void; depth: number }>({
  push: () => {}, pop: () => {}, depth: 0,
});
export const useStack = () => useContext(StackCtx);

export function StackNav({ root }: { root: ReactNode }): ReactNode {
  const keyRef = useRef(0);
  const [screens, setScreens] = useState<Screen[]>([{ key: keyRef.current++, node: root }]);
  const timers = useRef<number[]>([]);

  const push = useCallback((node: ReactNode) => {
    setScreens(s => [...s, { key: keyRef.current++, node, born: true }]);
    // born=true peint le nouvel écran hors champ une frame, puis on lève le
    // drapeau → la transition CSS joue l'entrée.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setScreens(s => s.map(x => ({ ...x, born: false })));
    }));
  }, []);

  const pop = useCallback(() => {
    setScreens(s => {
      if (s.length < 2) return s;
      const cp = s.slice();
      cp[cp.length - 1] = { ...cp[cp.length - 1], leaving: true };
      return cp;
    });
    timers.current.push(window.setTimeout(() => {
      setScreens(s => s.slice(0, -1));
    }, 400));
  }, []);

  return (
    <StackCtx.Provider value={{ push, pop, depth: screens.length }}>
      <div className="stk">
        {screens.map((s, i) => {
          const top = i === screens.length - 1;
          const belowTop = i === screens.length - 2 && screens[screens.length - 1]?.leaving;
          let tx = "0%";
          if (top) tx = s.born || s.leaving ? "100%" : "0%";
          else if (belowTop) tx = "0%";
          else tx = "-28%";
          return (
            <div key={s.key} className="stk-scr" style={{
              transform: `translateX(${tx})`,
              zIndex: top ? 2 : 1,
              pointerEvents: top && !s.leaving ? "auto" : "none",
            }}>
              {s.node}
            </div>
          );
        })}
      </div>
    </StackCtx.Provider>
  );
}
