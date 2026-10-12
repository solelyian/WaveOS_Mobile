import * as React from "react";
import { View, Text } from "react-native";
import { fmtTime } from "../system/state";
import { clearGlassClock, glassClock } from "../system/glassClock";
import { domOf } from "./fx";

const sourceAttrs: Record<string, unknown> = { dataSet: { clockSource: "" }, "aria-hidden": true };

export function GlassClock({ size = 188 }: { size?: number }) {
  const ref = React.useRef<View>(null);
  const [time, setTime] = React.useState(fmtTime);

  React.useEffect(() => {
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        setTime(fmtTime());
        schedule();
      }, 60000 - Date.now() % 60000 + 50);
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      window.clearTimeout(timer);
      setTime(fmtTime());
      schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  React.useLayoutEffect(() => {
    const el = domOf(ref);
    if (el) glassClock(el, time, size);
  }, [time, size]);

  React.useEffect(() => {
    const el = domOf(ref);
    return () => { if (el) clearGlassClock(el); };
  }, []);

  return (
    <View ref={ref} style={{
      position: "relative", width: size * 1.85, height: size + 8,
      justifyContent: "center", alignItems: "center",
    }}>
      <Text {...sourceAttrs} style={{
        fontSize: size, fontWeight: "500", letterSpacing: -size * .04,
        color: "rgba(255,255,255,.82)", lineHeight: size + 8,
        fontFamily: "system-ui",
      } as object}>
        {time}
      </Text>
    </View>
  );
}
