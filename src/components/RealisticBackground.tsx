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
        bg: "linear-gradient(to bottom, #020617 0%, #0f172a 100%)",
        orb: "#3b82f6",
        orbOpacity: 0.1,
        clouds: 2
      };
    }
    return {
      clear:   { bg: "linear-gradient(to bottom, #0ea5e9 0%, #38bdf8 50%, #7dd3fc 100%)", orb: "#fbbf24", orbOpacity: 0.4, clouds: 0 },
      cloudy:  { bg: "linear-gradient(to bottom, #94a3b8 0%, #cbd5e1 100%)", orb: "#fbbf24", orbOpacity: 0.1, clouds: 3 },
      fog:     { bg: "linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 100%)", orb: "transparent", orbOpacity: 0, clouds: 4 },
      rain:    { bg: "linear-gradient(to bottom, #475569 0%, #64748b 100%)", orb: "transparent", orbOpacity: 0, clouds: 4 },
      snow:    { bg: "linear-gradient(to bottom, #f1f5f9 0%, #ffffff 100%)", orb: "transparent", orbOpacity: 0, clouds: 2 },
      thunder: { bg: "linear-gradient(to bottom, #334155 0%, #475569 100%)", orb: "transparent", orbOpacity: 0, clouds: 4 },
    }[theme];
  }, [theme, isDay]);

  return (
    <div 
      className="fixed inset-0 -z-10 transition-all duration-1000 ease-in-out"
      style={{ background: config.bg }}
    >
      <div className="noise-overlay" />
      
      {/* Sun/Moon Orb */}
      {config.orb !== "transparent" && (
        <motion.div
          key={`orb-${isDay}-${theme}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: config.orbOpacity, 
            scale: 1,
            backgroundColor: config.orb,
            x: isDay ? "25vw" : "-25vw",
            y: isDay ? "-25vh" : "-30vh"
          }}
          transition={{ duration: 3, ease: "circOut" }}
          className="absolute top-1/2 left-1/2 w-[60vw] h-[60vw] rounded-full blur-[120px]"
        />
      )}

      {/* Fluffy Clouds */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {config.clouds > 0 && Array.from({ length: config.clouds }).map((_, i) => (
          <motion.div
            key={`cloud-${i}-${theme}`}
            initial={{ opacity: 0, x: i % 2 === 0 ? "-30%" : "30%" }}
            animate={{ 
              opacity: isDay ? [0.1, 0.3, 0.1] : [0.05, 0.1, 0.05],
              x: i % 2 === 0 ? ["-10%", "10%", "-10%"] : ["10%", "-10%", "10%"]
            }}
            transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[140%] h-[80%] blur-[80px] bg-white"
            style={{ 
              top: `${i * 15}%`, 
              left: "-20%", 
              borderRadius: "50%",
              transform: `scale(${1 + i * 0.3})`
            }}
          />
        ))}
      </div>

      {/* Dynamic Precipitation */}
      <AnimatePresence>
        {(theme === 'rain' || theme === 'thunder') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "-10vh", x: `${Math.random() * 100}%` }}
                animate={{ y: "110vh" }}
                transition={{ duration: 0.5 + Math.random() * 0.3, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                className="absolute w-[1.5px] h-16 bg-blue-400/30"
                style={{ transform: "rotate(10deg)" }}
              />
            ))}
          </motion.div>
        )}
        {theme === 'snow' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "-10vh", x: `${Math.random() * 100}%` }}
                animate={{ y: "110vh", x: [`${Math.random() * 100}%`, `${Math.random() * 100 + 5}%`, `${Math.random() * 100}%`] }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "linear", delay: Math.random() * 2 }}
                className="absolute w-2 h-2 rounded-full bg-white/40 blur-[1px]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5 pointer-events-none" />
    </div>
  );
}
