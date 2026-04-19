'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface Props {
  code?: number;
  time?: string;
}

type WeatherCategory = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

export default function LiquidBackground({ code = 0, time }: Props) {
  const category = useMemo((): WeatherCategory => {
    if (code === 0) return "clear";
    if (code >= 1 && code <= 3) return "cloudy";
    // Bug fix: codes 45–48 are fog — previously fell through to "clear"
    if (code >= 45 && code <= 48) return "fog";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
    if (code >= 95) return "thunder";
    return "clear";
  }, [code]);

  const isNight = useMemo(() => {
    const hour = time ? new Date(time).getHours() : new Date().getHours();
    return hour < 6 || hour >= 18;
  }, [time]);

  const particles = useMemo(() => {
    const count = (category === 'rain' || category === 'thunder') ? 40
      : category === 'snow' ? 30
      : category === 'cloudy' ? 20
      : 0;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 5,
      duration: (category === 'rain' || category === 'thunder') ? 0.5 + Math.random() * 0.3 : 4 + Math.random() * 5,
      size: Math.random() * (category === 'snow' ? 4 : 1.5) + (category === 'cloudy' ? 20 : 1),
    }));
  }, [category]);

  const config = useMemo(() => {
    if (isNight) {
      return {
        clear:   { bg: "bg-[#020617]", colors: ["rgba(30, 58, 138, 0.4)", "rgba(17, 24, 39, 0.4)", "rgba(76, 29, 149, 0.3)"] },
        cloudy:  { bg: "bg-[#0f172a]", colors: ["rgba(30, 41, 59, 0.6)", "rgba(51, 65, 85, 0.5)", "rgba(71, 85, 105, 0.4)"] },
        fog:     { bg: "bg-[#1e293b]", colors: ["rgba(31, 41, 55, 0.6)", "rgba(55, 65, 81, 0.5)", "rgba(75, 85, 99, 0.4)"] },
        rain:    { bg: "bg-[#0f172a]", colors: ["rgba(30, 58, 138, 0.6)", "rgba(17, 24, 39, 0.6)", "rgba(30, 41, 59, 0.5)"] },
        snow:    { bg: "bg-[#0f172a]", colors: ["rgba(209, 213, 219, 0.2)", "rgba(243, 244, 246, 0.1)", "rgba(156, 163, 175, 0.2)"] },
        thunder: { bg: "bg-[#020617]", colors: ["rgba(49, 46, 129, 0.7)", "rgba(17, 24, 39, 0.8)", "rgba(88, 28, 135, 0.6)"] },
      }[category];
    }
    return {
      clear:   { bg: "bg-sky-500",   colors: ["rgba(56, 189, 248, 0.6)", "rgba(14, 165, 233, 0.5)", "rgba(186, 230, 253, 0.4)"] },
      cloudy:  { bg: "bg-slate-400", colors: ["rgba(203, 213, 225, 0.6)", "rgba(148, 163, 184, 0.5)", "rgba(226, 232, 240, 0.4)"] },
      fog:     { bg: "bg-slate-300", colors: ["rgba(203, 213, 225, 0.4)", "rgba(148, 163, 184, 0.3)", "rgba(241, 245, 249, 0.2)"] },
      rain:    { bg: "bg-slate-500", colors: ["rgba(71, 85, 105, 0.5)", "rgba(51, 65, 85, 0.4)", "rgba(30, 41, 59, 0.3)"] },
      snow:    { bg: "bg-sky-100",   colors: ["rgba(186, 230, 253, 0.4)", "rgba(241, 245, 249, 0.3)", "rgba(148, 163, 184, 0.2)"] },
      thunder: { bg: "bg-slate-700", colors: ["rgba(76, 29, 149, 0.5)", "rgba(30, 58, 138, 0.5)", "rgba(17, 24, 39, 0.4)"] },
    }[category];
  }, [category, isNight]);

  const noiseSvg = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${config.bg} transition-colors duration-1000`}>
      {/* Mesh Blobs */}
      <motion.div
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 60, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full blur-[120px]"
        style={{ background: config.colors[0] }}
      />
      <motion.div
        animate={{ x: [0, -60, 40, 0], y: [0, 50, -30, 0], scale: [1, 1.1, 1.3, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[100px]"
        style={{ background: config.colors[1] }}
      />
      <motion.div
        animate={{ x: [-50, 50, 0, -50], y: [30, -30, 50, 30] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] left-[30%] w-[50%] h-[50%] rounded-full blur-[110px]"
        style={{ background: config.colors[2] }}
      />

      {/* Weather Particles */}
      <AnimatePresence mode="wait">
        <motion.div key={category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
          {(category === 'rain' || category === 'thunder') && particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: "-10vh", x: p.left }}
              animate={{ y: "110vh" }}
              transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
              className="absolute w-[2px] h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent"
              style={{ transform: 'rotate(12deg)' }}
            />
          ))}
          {category === 'snow' && particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: "-10vh", x: p.left }}
              animate={{ y: "110vh", x: [p.left, `calc(${p.left} + 20px)`, p.left] }}
              transition={{
                y: { duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay },
                x: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute rounded-full blur-[2px] bg-white/50"
              style={{ width: p.size, height: p.size }}
            />
          ))}
          {category === 'cloudy' && particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: p.left, y: "40vh" }}
              animate={{ opacity: [0, 0.4, 0], x: [`calc(${p.left} - 50px)`, `calc(${p.left} + 50px)`] }}
              transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, ease: "linear", delay: p.delay }}
              className="absolute rounded-full blur-[40px] bg-white/30"
              style={{ width: p.size * 5, height: p.size * 2 }}
            />
          ))}
          {category === 'thunder' && (
            <motion.div
              animate={{ opacity: [0, 0, 0.2, 0, 0.4, 0, 0] }}
              transition={{ duration: 5, repeat: Infinity, times: [0, 0.8, 0.81, 0.82, 0.83, 0.85, 1] }}
              className="absolute inset-0 bg-white/10 blur-[100px]"
            />
          )}
          {/* Fog: soft drifting white layers */}
          {category === 'fog' && (
            <>
              <motion.div
                animate={{ x: ["-10%", "10%", "-10%"], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-white/20 blur-[60px]"
              />
              <motion.div
                animate={{ x: ["5%", "-5%", "5%"], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                className="absolute inset-0 bg-slate-200/20 blur-[80px]"
              />
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 backdrop-blur-[60px]" />
      <div
        className="absolute inset-0 opacity-[0.1] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("${noiseSvg}")` }}
      />
    </div>
  );
}
