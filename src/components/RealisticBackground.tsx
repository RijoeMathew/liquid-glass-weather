'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

interface Props {
  code?: number;
  isDay?: boolean;
}

export default function RealisticBackground({ code = 0, isDay = true }: Props) {
  const gradients = useMemo(() => {
    if (!isDay) return "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
    if (code === 0) return "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)";
    if (code <= 3) return "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)";
    if (code <= 65) return "linear-gradient(135deg, #334155 0%, #475569 100%)";
    return "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)";
  }, [code, isDay]);

  return (
    <motion.div 
      className="fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, background: gradients }}
      transition={{ duration: 1 }}
    />
  );
}
