"use client";

import { useState, useEffect, useRef } from "react";
import LiquidBackground from "../components/LiquidBackground";
import { 
    Cloud, Sun, CloudRain, Wind, Thermometer, MapPin, Loader2, 
    CloudSnow, CloudLightning, CloudFog, Droplets, Navigation, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WeatherData {
    current: {
        temp: number;
        condition: string;
        windspeed: number;
        humidity: number;
        code: number;
    };
    hourly: Array<{
        time: string;
        temp: number;
        code: number;
    }>;
    daily: Array<{
        date: string;
        temp_max: number;
        temp_min: number;
        condition: string;
        code: number;
    }>;
}

export default function WeatherApp() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const hourlyScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setLoading(true);
                const pos = await new Promise<GeolocationPosition>((res, rej) => {
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 });
                });

                const { latitude, longitude } = pos.coords;

                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
                );

                if (!res.ok) throw new Error("Failed to fetch weather");
                const data = await res.json();

                setWeather({
                    current: {
                        temp: data.current.temperature_2m,
                        condition: getWeatherDesc(data.current.weather_code),
                        windspeed: data.current.wind_speed_10m,
                        humidity: data.current.relative_humidity_2m,
                        code: data.current.weather_code,
                    },
                    hourly: data.hourly.time.map((time: string, i: number) => ({
                        time,
                        temp: data.hourly.temperature_2m[i],
                        code: data.hourly.weather_code[i],
                    })),
                    daily: data.daily.time.map((date: string, i: number) => ({
                        date,
                        temp_max: data.daily.temperature_2m_max[i],
                        temp_min: data.daily.temperature_2m_min[i],
                        condition: getWeatherDesc(data.daily.weather_code[i]),
                        code: data.daily.weather_code[i],
                    })).slice(0, 7),
                });
            } catch (err) {
                console.error(err);
                setError("Location access denied. Please enable GPS to see your local weather.");
            } finally {
                setLoading(false);
            }
        };

        fetchWeather();
    }, []);

    // Reset scroll when day changes
    useEffect(() => {
        if (hourlyScrollRef.current) {
            hourlyScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        }
    }, [selectedDayIndex]);

    function getWeatherDesc(code: number): string {
        if (code === 0) return "Clear Sky";
        if (code <= 3) return "Mainly Clear";
        if (code <= 48) return "Foggy";
        if (code <= 55) return "Drizzle";
        if (code <= 65) return "Rain";
        if (code <= 67) return "Freezing Rain";
        if (code <= 77) return "Snow";
        if (code <= 82) return "Rain Showers";
        if (code <= 86) return "Snow Showers";
        if (code === 95) return "Thunderstorm";
        if (code <= 99) return "Thunderstorm with Hail";
        return "Unknown";
    }

    function getWeatherIcon(code: number, size: number = 24, className: string = "") {
        if (code === 0) return <Sun size={size} className={`text-yellow-400 ${className}`} />;
        if (code <= 3) return <Sun size={size} className={`text-yellow-200 ${className}`} />;
        if (code <= 48) return <CloudFog size={size} className={`text-slate-400 ${className}`} />;
        if (code <= 55) return <CloudRain size={size} className={`text-blue-300 ${className}`} />;
        if (code <= 65) return <CloudRain size={size} className={`text-blue-500 ${className}`} />;
        if (code <= 67) return <CloudSnow size={size} className={`text-blue-200 ${className}`} />;
        if (code <= 77) return <CloudSnow size={size} className={`text-white ${className}`} />;
        if (code <= 82) return <CloudRain size={size} className={`text-blue-400 ${className}`} />;
        if (code <= 86) return <CloudSnow size={size} className={`text-white ${className}`} />;
        if (code === 95) return <CloudLightning size={size} className={`text-purple-400 ${className}`} />;
        if (code <= 99) return <CloudLightning size={size} className={`text-purple-600 ${className}`} />;
        return <Cloud size={size} className={`text-gray-400 ${className}`} />;
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 gap-6">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                </motion.div>
                <p className="text-white/50 text-sm tracking-[0.3em] uppercase font-bold">Initializing</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-full flex items-center justify-center p-4 text-center bg-slate-950">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-10 max-w-md space-y-6">
                    <div className="text-red-400 text-6xl">📍</div>
                    <h2 className="text-3xl font-bold text-white">Location Access</h2>
                    <p className="text-red-200/70 text-lg leading-relaxed">{error}</p>
                    <button onClick={() => window.location.reload()} className="w-full mt-4 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10 font-semibold">
                        Try Again
                    </button>
                </motion.div>
            </div>
        );
    }

    // Filter hourly data for the selected day
    const getSelectedDayHourly = () => {
        if (!weather) return [];
        const startIdx = selectedDayIndex * 24;
        return weather.hourly.slice(startIdx, startIdx + 24);
    };

    const selectedDayHourly = getSelectedDayHourly();

    return (
        <main className="min-h-screen p-4 md:p-12 lg:p-20 flex flex-col items-center relative z-0 overflow-x-hidden">
            <LiquidBackground code={weather?.current.code} />

            <AnimatePresence>
                {weather && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-5xl space-y-8">
                        {/* Current Weather Card */}
                        <motion.div variants={itemVariants} className="glass-card p-10 text-center relative overflow-hidden">
                            <motion.div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity }} />
                            
                            <div className="relative z-10 space-y-6">
                                <motion.div className="flex justify-center" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                                    {getWeatherIcon(weather.current.code, 120, "drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]")}
                                </motion.div>
                                
                                <div className="space-y-2">
                                    <h1 className="text-8xl font-black tracking-tighter text-white">
                                        {Math.round(weather.current.temp)}°
                                    </h1>
                                    <p className="text-3xl text-white/90 font-light tracking-wide">
                                        {weather.current.condition}
                                    </p>
                                </div>

                                <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-white/10 mt-8">
                                    <div className="flex items-center gap-3 text-white/70">
                                        <Wind className="w-6 h-6 text-blue-400" />
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase tracking-tighter opacity-50 font-bold">Wind</p>
                                            <p className="text-lg font-mono">{weather.current.windspeed} <span className="text-sm opacity-50">km/h</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-white/70">
                                        <Droplets className="w-6 h-6 text-cyan-400" />
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase tracking-tighter opacity-50 font-bold">Humidity</p>
                                            <p className="text-lg font-mono">{weather.current.humidity}%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-white/70">
                                        <Thermometer className="w-6 h-6 text-red-400" />
                                        <div className="text-left">
                                            <p className="text-[10px] uppercase tracking-tighter opacity-50 font-bold">Feel</p>
                                            <p className="text-lg font-mono">{Math.round(weather.current.temp)}°</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Hourly Forecast */}
                        <motion.div variants={itemVariants} className="glass-card p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                    <Navigation className="w-5 h-5 text-blue-400 rotate-45" /> 
                                    Hourly Forecast
                                    <span className="text-white/40 font-medium text-sm ml-2 px-2 py-1 rounded-lg bg-white/5">
                                        {selectedDayIndex === 0 ? "Today" : new Date(weather.daily[selectedDayIndex].date).toLocaleDateString('en-US', { weekday: 'long' })}
                                    </span>
                                </h2>
                                {selectedDayIndex !== 0 && (
                                    <button 
                                        onClick={() => setSelectedDayIndex(0)}
                                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full transition-all active:scale-95"
                                    >
                                        Today
                                    </button>
                                )}
                            </div>
                            
                            <div ref={hourlyScrollRef} className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-2">
                                {selectedDayHourly.map((hour, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="flex flex-col items-center min-w-[80px] p-4 rounded-2xl bg-white/5 border border-white/5"
                                    >
                                        <span className="text-xs font-bold text-white/40 mb-3">
                                            {new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                                        </span>
                                        {getWeatherIcon(hour.code, 32, "mb-3")}
                                        <span className="text-xl font-mono font-bold text-white">
                                            {Math.round(hour.temp)}°
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 7-Day Forecast */}
                        <motion.div variants={itemVariants} className="glass-card p-8 space-y-8">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                <Calendar className="w-5 h-5 text-blue-400" /> Daily Forecast
                                <span className="text-xs font-normal text-white/40 ml-auto">Click a day to view hourly details</span>
                            </h2>
                            <div className="grid gap-3">
                                {weather.daily.map((day, idx) => (
                                    <motion.div 
                                        key={idx} 
                                        onClick={() => setSelectedDayIndex(idx)}
                                        whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.05)" }}
                                        className={`flex items-center justify-between py-4 px-4 rounded-2xl group cursor-pointer transition-all border ${selectedDayIndex === idx ? 'bg-white/10 border-white/20' : 'border-transparent'}`}
                                    >
                                        <div className="w-24">
                                            <p className={`text-lg font-bold ${selectedDayIndex === idx ? 'text-blue-400' : 'text-white'}`}>
                                                {idx === 0 ? "Today" : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </p>
                                            <p className="text-[10px] text-white/30 uppercase font-black">{day.date}</p>
                                        </div>
                                        
                                        <div className="flex items-center gap-6 flex-1 px-8 justify-start">
                                            <div className="p-2 rounded-full bg-white/5 group-hover:scale-110 transition-transform">
                                                {getWeatherIcon(day.code, 28)}
                                            </div>
                                            <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors">{day.condition}</span>
                                        </div>
                                        
                                        <div className="flex gap-6 text-xl font-mono">
                                            <span className="text-white font-bold w-12 text-right">{Math.round(day.temp_max)}°</span>
                                            <span className="text-white/30 w-12 text-right">{Math.round(day.temp_min)}°</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
