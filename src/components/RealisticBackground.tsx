'use client';

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  code?: number;
  isDay?: boolean;
}

type WeatherTheme = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

interface ThemeStyle {
  gradient: string;
  tint: string;
}

export default function RealisticBackground({ code = 0, isDay = true }: Props) {
  const theme = useMemo((): WeatherTheme => {
    if (code === 0) return "clear";
    if (code >= 1 && code <= 3) return "cloudy";
    if (code >= 45 && code <= 48) return "fog";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
    if (code >= 95) return "thunder";
    return "clear";
  }, [code]);

  const themeStyle = useMemo((): ThemeStyle => {
    if (!isDay) {
      return {
        gradient: "linear-gradient(180deg, #1e293b 0%, #020617 100%)",
        tint: "rgba(15, 23, 42, 0.22)",
      };
    }

    const dayThemes: Record<WeatherTheme, ThemeStyle> = {
      clear: {
        gradient: "linear-gradient(180deg, #38bdf8 0%, #bae6fd 100%)",
        tint: "rgba(255, 255, 255, 0.12)",
      },
      cloudy: {
        gradient: "linear-gradient(180deg, #94a3b8 0%, #cbd5e1 100%)",
        tint: "rgba(148, 163, 184, 0.16)",
      },
      fog: {
        gradient: "linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%)",
        tint: "rgba(226, 232, 240, 0.18)",
      },
      rain: {
        gradient: "linear-gradient(180deg, #475569 0%, #94a3b8 100%)",
        tint: "rgba(15, 23, 42, 0.24)",
      },
      snow: {
        gradient: "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)",
        tint: "rgba(255, 255, 255, 0.2)",
      },
      thunder: {
        gradient: "linear-gradient(180deg, #334155 0%, #475569 100%)",
        tint: "rgba(30, 41, 59, 0.28)",
      },
    };

    return dayThemes[theme];
  }, [theme, isDay]);

  const themeKey = `${isDay ? "day" : "night"}-${theme}`;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <AnimatePresence initial={false}>
        <motion.div
          key={themeKey}
          className="absolute inset-0"
          style={{ background: themeStyle.gradient }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      <motion.div
        className="absolute inset-0"
        animate={{ backgroundColor: themeStyle.tint }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
