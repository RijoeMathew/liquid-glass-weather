'use client';

import { motion, AnimatePresence } from "framer-motion";
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

  const config = useMemo(() => {
    if (!isDay) {
      return {
        bg: "#020617",
        orb: "#1e3a8a",
        orbOpacity: 0.1,
      };
    }
    return {
      clear:   { bg: "#0f172a", orb: "#1d4ed8", orbOpacity: 0.15 },
      cloudy:  { bg: "#020617", orb: "#1e293b", orbOpacity: 0.1 },
      fog:     { bg: "#1e293b", orb: "transparent", orbOpacity: 0 },
      rain:    { bg: "#020617", orb: "#1e1b4b", orbOpacity: 0.1 },
      snow:    { bg: "#0f172a", orb: "#ffffff", orbOpacity: 0.05 },
      thunder: { bg: "#020617", orb: "#312e81", orbOpacity: 0.15 },
    }[theme];
  }, [theme, isDay]);

  return (
    <div 
      className="fixed inset-0 -z-10 transition-colors duration-1000"
      style={{ backgroundColor: config.bg }}
    >
      <div className="noise-overlay" />
      
      {/* Subtle Atmospheric Depth (No Blur, Solid Orb) */}
      {config.orb !== "transparent" && (
        <motion.div
          key={`${isDay}-${theme}`}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: config.orbOpacity,
            backgroundColor: config.orb,
            x: isDay ? "30vw" : "-30vw",
            y: isDay ? "-30vh" : "-40vh"
          }}
          transition={{ duration: 2 }}
          className="absolute top-1/2 left-1/2 w-[60vw] h-[60vw] rounded-full blur-[150px]"
        />
      )}

      {/* Precipitation Particles (Refined for Tactile look) */}
      <AnimatePresence>
        {(theme === 'rain' || theme === 'thunder') && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "-10vh", x: `${Math.random() * 100}%` }}
                animate={{ y: "110vh" }}
                transition={{ 
                  duration: 0.6 + Math.random() * 0.4, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 2
                }}
                className="absolute w-[1px] h-12 bg-blue-500/10"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 pointer-events-none" />
    </div>
  );
}
