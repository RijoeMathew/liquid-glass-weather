'use client';

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

  const themeClass = useMemo(() => {
    if (!isDay) return "bg-theme-night";
    const dayThemes: Record<WeatherTheme, string> = {
      clear: "bg-theme-clear",
      cloudy: "bg-theme-cloudy",
      fog: "bg-theme-fog",
      rain: "bg-theme-rain",
      snow: "bg-theme-snow",
      thunder: "bg-theme-thunder",
    };
    return dayThemes[theme];
  }, [theme, isDay]);

  return (
    <div 
      className={`fixed inset-0 -z-10 transition-colors duration-1000 ${themeClass}`}
    />
  );
}
