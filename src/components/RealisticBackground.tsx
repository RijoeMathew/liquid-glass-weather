'use client';

import { motion } from "framer-motion";
import { useMemo } from "react";

interface Props {
  code?: number;
  isDay?: boolean;
}

type WeatherTheme = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

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

  // Forcefully map to background strings so transition works
  const background = useMemo(() => {
    if (!isDay) return "linear-gradient(180deg, #1e293b 0%, #020617 100%)";
    const dayThemes: Record<WeatherTheme, string> = {
      clear: "linear-gradient(180deg, #38bdf8 0%, #bae6fd 100%)",
      cloudy: "linear-gradient(180deg, #94a3b8 0%, #cbd5e1 100%)",
      fog: "linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%)",
      rain: "linear-gradient(180deg, #475569 0%, #94a3b8 100%)",
      snow: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
      thunder: "linear-gradient(180deg, #334155 0%, #475569 100%)",
    };
    return dayThemes[theme];
  }, [theme, isDay]);

  return (
    <motion.div 
      key={background}
      className="fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, background }}
      transition={{ duration: 1, ease: "easeInOut" }}
    />
  );
}
