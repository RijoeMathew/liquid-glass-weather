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

  const background = useMemo(() => {
    if (!isDay) return "linear-gradient(135deg, #020617 0%, #1e293b 100%)";
    const dayThemes: Record<WeatherTheme, string> = {
      clear: "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
      cloudy: "linear-gradient(135deg, #94a3b8 0%, #475569 100%)",
      fog: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)",
      rain: "linear-gradient(135deg, #64748b 0%, #334155 100%)",
      snow: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
      thunder: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
    };
    return dayThemes[theme];
  }, [theme, isDay]);

  return (
    <motion.div 
      className="fixed inset-0 -z-10"
      animate={{ background }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    />
  );
}
