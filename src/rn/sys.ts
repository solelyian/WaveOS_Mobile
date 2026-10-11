// sys.ts — hook React sur l'état OS central (system/state.ts).
import * as React from "react";
import { onChange, sys, set, type SysState } from "../system/state";

export function useSys(): SysState {
  const [, bump] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => { const off = onChange(() => bump()); return () => { off(); }; }, []);
  return sys;
}
export { set };
