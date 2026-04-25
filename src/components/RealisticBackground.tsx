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
        clear:   { bg: "linear-gradient(to bottom, #020111 10%, #191621 100%)", orb: "#1e3a8a", orbOpacity: 0.3, clouds: false },
        cloudy:  { bg: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)", orb: "#334155", orbOpacity: 0.2, clouds: true },
        fog:     { bg: "linear-gradient(to bottom, #1e293b 0%, #334155 100%)", orb: "transparent", orbOpacity: 0, clouds: true },
        rain:    { bg: "linear-gradient(to bottom, #020111 0%, #0f172a 100%)", orb: "#172554", orbOpacity: 0.2, clouds: true },
        snow:    { bg: "linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)", orb: "#ffffff", orbOpacity: 0.1, clouds: true },
        thunder: { bg: "linear-gradient(to bottom, #020111 0%, #1e1b4b 100%)", orb: "#312e81", orbOpacity: 0.3, clouds: true },
      }[theme];
    }
    return {
      clear:   { bg: "linear-gradient(to bottom, #0ea5e9 0%, #38bdf8 100%)", orb: "#fbbf24", orbOpacity: 0.6, clouds: false },
      cloudy:  { bg: "linear-gradient(to bottom, #94a3b8 0%, #cbd5e1 100%)", orb: "#fbbf24", orbOpacity: 0.2, clouds: true },
      fog:     { bg: "linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 100%)", orb: "transparent", orbOpacity: 0, clouds: true },
      rain:    { bg: "linear-gradient(to bottom, #475569 0%, #64748b 100%)", orb: "transparent", orbOpacity: 0, clouds: true },
      snow:    { bg: "linear-gradient(to bottom, #f1f5f9 0%, #ffffff 100%)", orb: "transparent", orbOpacity: 0, clouds: true },
      thunder: { bg: "linear-gradient(to bottom, #334155 0%, #475569 100%)", orb: "transparent", orbOpacity: 0, clouds: true },
    }[theme];
  }, [theme, isDay]);

  return (
    <div 
      className="fixed inset-0 -z-10 transition-colors duration-1000"
      style={{ background: config.bg }}
    >
      <div className="noise-overlay" />
      
      {/* Sun/Moon Orb */}
      {config.orb !== "transparent" && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: config.orbOpacity,
            backgroundColor: config.orb,
            x: isDay ? "20vw" : "-20vw",
            y: isDay ? "-20vh" : "-30vh"
          }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 w-[40vw] h-[40vw] rounded-full blur-[100px]"
        />
      )}

      {/* Cloud Layers */}
      {config.clouds && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ x: ["-10%", "10%", "-10%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-0 w-[120%] h-full opacity-30 blur-[60px] bg-white"
            style={{ borderRadius: "40%" }}
          />
          <motion.div 
            animate={{ x: ["5%", "-5%", "5%"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-0 right-0 w-[100%] h-2/3 opacity-20 blur-[80px] bg-white/50"
            style={{ borderRadius: "50%" }}
          />
        </div>
      )}

      {/* Precipitation Overlay */}
      <AnimatePresence>
        {(theme === 'rain' || theme === 'thunder') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: "-10vh", x: `${Math.random() * 100}%` }}
                animate={{ y: "110vh" }}
                transition={{ 
                  duration: 0.5 + Math.random() * 0.3, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 2
                }}
                className="absolute w-[1px] h-10 bg-white/20"
                style={{ transform: "rotate(10deg)" }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Atmospheric Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none" />
    </div>
  );
}
