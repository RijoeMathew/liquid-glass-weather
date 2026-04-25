'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface Props {
  code?: number;
  time?: string;
  isDay?: boolean;
}

type WeatherCategory = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

export default function LiquidBackground({ code = 0, time, isDay }: Props) {
  const category = useMemo((): WeatherCategory => {
    if (code === 0) return "clear";
    if (code >= 1 && code <= 3) return "cloudy";
    if (code >= 45 && code <= 48) return "fog";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
    if (code >= 95) return "thunder";
    return "clear";
  }, [code]);

  const nightMode = useMemo(() => {
    if (isDay !== undefined) return !isDay;
    const hour = time ? new Date(time).getHours() : new Date().getHours();
    return hour < 6 || hour >= 18;
  }, [time, isDay]);

  const particles = useMemo(() => {
    const count = (category === 'rain' || category === 'thunder') ? 60
      : category === 'snow' ? 40
      : category === 'cloudy' ? 25
      : 0;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: (category === 'rain' || category === 'thunder') ? 0.4 + Math.random() * 0.3 : 3 + Math.random() * 4,
      size: Math.random() * (category === 'snow' ? 5 : 2) + (category === 'cloudy' ? 30 : 1),
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, [category]);

  const config = useMemo(() => {
    if (nightMode) {
      return {
        clear:   { bg: "bg-[#020617]", colors: ["#1e3a8a", "#0f172a", "#4c1d95"] },
        cloudy:  { bg: "bg-[#0f172a]", colors: ["#1e293b", "#334155", "#020617"] },
        fog:     { bg: "bg-[#1e293b]", colors: ["#0f172a", "#334155", "#1e293b"] },
        rain:    { bg: "bg-[#020617]", colors: ["#172554", "#1e1b4b", "#0f172a"] },
        snow:    { bg: "bg-[#020617]", colors: ["#1e293b", "#334155", "#475569"] },
        thunder: { bg: "bg-[#020617]", colors: ["#1e1b4b", "#312e81", "#581c87"] },
      }[category];
    }
    return {
      clear:   { bg: "bg-[#0ea5e9]", colors: ["#38bdf8", "#fbbf24", "#60a5fa"] },
      cloudy:  { bg: "bg-[#94a3b8]", colors: ["#cbd5e1", "#64748b", "#94a3b8"] },
      fog:     { bg: "bg-[#cbd5e1]", colors: ["#e2e8f0", "#94a3b8", "#cbd5e1"] },
      rain:    { bg: "bg-[#475569]", colors: ["#334155", "#1e293b", "#64748b"] },
      snow:    { bg: "bg-[#f1f5f9]", colors: ["#e2e8f0", "#cbd5e1", "#ffffff"] },
      thunder: { bg: "bg-[#334155]", colors: ["#1e1b4b", "#4c1d95", "#1e293b"] },
    }[category];
  }, [category, nightMode]);

  const noiseSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${config.bg} transition-colors duration-1000`}>
      {/* Animated Mesh Blobs */}
      <motion.div
        animate={{ 
          x: [0, 50, -30, 0], 
          y: [0, -40, 60, 0], 
          scale: [1, 1.2, 0.9, 1],
          backgroundColor: config.colors[0]
        }}
        transition={{ 
          x: { duration: 25, repeat: Infinity, ease: "linear" },
          y: { duration: 25, repeat: Infinity, ease: "linear" },
          scale: { duration: 25, repeat: Infinity, ease: "linear" },
          backgroundColor: { duration: 2 }
        }}
        className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full blur-[120px] opacity-60"
      />
      <motion.div
        animate={{ 
          x: [0, -60, 40, 0], 
          y: [0, 50, -30, 0], 
          scale: [1, 1.1, 1.3, 1],
          backgroundColor: config.colors[1]
        }}
        transition={{ 
          x: { duration: 30, repeat: Infinity, ease: "linear" },
          y: { duration: 30, repeat: Infinity, ease: "linear" },
          scale: { duration: 30, repeat: Infinity, ease: "linear" },
          backgroundColor: { duration: 2 }
        }}
        className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[100px] opacity-60"
      />
      <motion.div
        animate={{ 
          x: [-50, 50, 0, -50], 
          y: [30, -30, 50, 30],
          backgroundColor: config.colors[2]
        }}
        transition={{ 
          x: { duration: 20, repeat: Infinity, ease: "linear" },
          y: { duration: 20, repeat: Infinity, ease: "linear" },
          backgroundColor: { duration: 2 }
        }}
        className="absolute top-[20%] left-[30%] w-[50%] h-[50%] rounded-full blur-[110px] opacity-60"
      />

      {/* Weather Particles */}
      <AnimatePresence mode="wait">
        <motion.div key={category + nightMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }} className="absolute inset-0">
          {(category === 'rain' || category === 'thunder') && particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: "-10vh", x: p.left }}
              animate={{ y: "110vh" }}
              transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
              className="absolute w-[1.5px] h-16 bg-gradient-to-b from-transparent via-white/30 to-transparent"
              style={{ transform: 'rotate(12deg)', opacity: p.opacity }}
            />
          ))}
          {category === 'snow' && particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: "-10vh", x: p.left }}
              animate={{ y: "110vh", x: [p.left, `calc(${p.left} + 25px)`, p.left] }}
              transition={{
                y: { duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay },
                x: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute rounded-full blur-[1px] bg-white"
              style={{ width: p.size, height: p.size, opacity: p.opacity }}
            />
          ))}
          {category === 'cloudy' && particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: p.left, y: `${20 + Math.random() * 60}vh` }}
              animate={{ opacity: [0, 0.3, 0], x: [`calc(${p.left} - 100px)`, `calc(${p.left} + 100px)`] }}
              transition={{ duration: 15 + Math.random() * 15, repeat: Infinity, ease: "linear", delay: p.delay }}
              className="absolute rounded-full blur-[50px] bg-white"
              style={{ width: p.size * 6, height: p.size * 2.5 }}
            />
          ))}
          {category === 'thunder' && (
            <motion.div
              animate={{ opacity: [0, 0, 0.3, 0, 0.5, 0, 0] }}
              transition={{ duration: 6, repeat: Infinity, times: [0, 0.7, 0.71, 0.72, 0.73, 0.75, 1] }}
              className="absolute inset-0 bg-white/20 blur-[120px]"
            />
          )}
          {category === 'fog' && (
            <>
              <motion.div
                animate={{ x: ["-20%", "20%", "-20%"], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-white/20 blur-[80px]"
              />
              <motion.div
                animate={{ x: ["10%", "-10%", "10%"], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
                className="absolute inset-0 bg-slate-200/20 blur-[100px]"
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Overlays */}
      <div className="absolute inset-0 backdrop-blur-[80px] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("${noiseSvg}")` }}
      />
    </div>
  );
}
