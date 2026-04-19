"use client";

import { useState, useEffect, useRef } from "react";
import LiquidBackground from "../components/LiquidBackground";
import { 
    Cloud, Sun, Moon, CloudRain, Wind, Thermometer, MapPin, Loader2, 
    CloudSnow, CloudLightning, CloudFog, Droplets, Navigation, Calendar, RefreshCw, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

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
        rain_chance: number;
    }>;
    daily: Array<{
        date: string;
        temp_max: number;
        temp_min: number;
        condition: string;
        code: number;
        rain_chance: number;
    }>;
}

export default function WeatherApp() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [usingDefault, setUsingDefault] = useState(false);
    const [showSkip, setShowSkip] = useState(false);
    const hourlyScrollRef = useRef<HTMLDivElement>(null);

    const fetchWeather = async (lat?: number, lon?: number) => {
        try {
            setLoading(true);
            let latitude = lat;
            let longitude = lon;

            if (latitude === undefined || longitude === undefined) {
                try {
                    const pos = await Promise.race([
                        new Promise<GeolocationPosition>((res, rej) => {
                            if (!navigator.geolocation) rej(new Error("Not supported"));
                            navigator.geolocation.getCurrentPosition(res, rej, { 
                                timeout: 5000,
                                enableHighAccuracy: false 
                            });
                        }),
                        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Timeout")), 6000))
                    ]);
                    latitude = pos.coords.latitude;
                    longitude = pos.coords.longitude;
                    setUsingDefault(false);
                } catch (geoErr) {
                    latitude = 43.6532;
                    longitude = -79.3832;
                    setUsingDefault(true);
                }
            }

            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto`
            );

            if (!res.ok) throw new Error("API Connection Failed");
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
                    rain_chance: data.hourly.precipitation_probability[i],
                })),
                daily: data.daily.time.map((date: string, i: number) => ({
                    date,
                    temp_max: data.daily.temperature_2m_max[i],
                    temp_min: data.daily.temperature_2m_min[i],
                    condition: getWeatherDesc(data.daily.weather_code[i]),
                    code: data.daily.weather_code[i],
                    rain_chance: data.daily.precipitation_probability_max[i],
                })).slice(0, 7),
            });
            setError(null);
        } catch (err) {
            setError("Unable to reach weather servers. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
        const skipTimer = setTimeout(() => setShowSkip(true), 6000);
        return () => clearTimeout(skipTimer);
    }, []);

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

    function getWeatherIcon(code: number, size: number = 24, className: string = "", time?: string) {
        const hour = time ? new Date(time).getHours() : new Date().getHours();
        const isNight = hour < 6 || hour >= 18;

        if (code === 0) return isNight ? <Moon size={size} className={`text-slate-300 ${className}`} /> : <Sun size={size} className={`text-yellow-400 ${className}`} />;
        if (code <= 3) return <Cloud size={size} className={`text-slate-400 ${className}`} />;
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

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] gap-6 text-center p-6">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                </motion.div>
                <div className="space-y-2">
                    <p className="text-white text-lg font-medium tracking-tight">Syncing Atmosphere</p>
                    <p className="text-white/40 text-xs tracking-[0.2em] uppercase">Checking Conditions</p>
                </div>

                <AnimatePresence>
                    {showSkip && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-8 space-y-4">
                            <p className="text-white/30 text-xs italic">Taking longer than usual?</p>
                            <button 
                                onClick={() => fetchWeather(51.5074, -0.1278)}
                                className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-full border border-white/10 transition-all active:scale-95"
                            >
                                Skip & Use Default (London)
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-full flex items-center justify-center p-4 text-center bg-[#020617]">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-10 max-w-md space-y-6">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">System Error</h2>
                    <p className="text-red-200/70">{error}</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => window.location.reload()} className="w-full px-8 py-3 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-2xl transition-all border border-blue-600/30 font-bold">
                            Reload App
                        </button>
                        <button onClick={() => fetchWeather(51.5074, -0.1278)} className="w-full px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10">
                            Use Default Location
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const getSelectedDayHourly = () => {
        if (!weather) return [];
        const startIdx = selectedDayIndex * 24;
        return weather.hourly.slice(startIdx, startIdx + 24);
    };

    const selectedDayHourly = getSelectedDayHourly();

    return (
        <main className="min-h-screen p-4 sm:p-8 md:p-12 lg:p-20 flex flex-col items-center relative z-0 overflow-x-hidden">
            <LiquidBackground code={weather?.current.code} time={new Date().toISOString()} />

            <AnimatePresence>
                {weather && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-4xl space-y-6 sm:space-y-8">
                        {usingDefault && (
                            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-amber-500/20 border border-amber-500/30 p-3 rounded-2xl text-amber-200 text-[10px] sm:text-xs flex items-center justify-between gap-4 backdrop-blur-md">
                                <span className="flex items-center gap-2">
                                    <MapPin size={14} /> GPS unavailable. Showing Toronto weather.
                                </span>
                                <button onClick={() => fetchWeather()} className="bg-amber-500/20 hover:bg-amber-500/40 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 font-bold whitespace-nowrap">
                                    <RefreshCw size={12} /> Sync GPS
                                </button>
                            </motion.div>
                        )}

                        {/* Current Weather Card */}
                        <motion.div variants={itemVariants} className="glass-card p-6 sm:p-10 text-center relative overflow-hidden">
                            <motion.div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 5, repeat: Infinity }} />
                            
                            <div className="relative z-10 space-y-4 sm:space-y-6">
                                <motion.div className="flex justify-center" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                                    {getWeatherIcon(weather.current.code, 80, "sm:w-[100px] sm:h-[100px] drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]")}
                                </motion.div>
                                
                                <div className="space-y-1">
                                    <h1 className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white">
                                        {Math.round(weather.current.temp)}°
                                    </h1>
                                    <p className="text-xl sm:text-2xl md:text-3xl text-white/90 font-light tracking-wide">
                                        {weather.current.condition}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 sm:pt-8 border-t border-white/10 mt-6 sm:mt-8">
                                    <div className="flex flex-col items-center gap-1">
                                        <Wind className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                                        <p className="text-[8px] sm:text-[9px] uppercase tracking-tighter opacity-50 font-bold">Wind</p>
                                        <p className="text-xs sm:text-sm font-mono text-white/90">{weather.current.windspeed} <span className="hidden xs:inline text-[10px]">km/h</span></p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 border-x border-white/5 px-1 sm:px-2">
                                        <Droplets className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
                                        <p className="text-[8px] sm:text-[9px] uppercase tracking-tighter opacity-50 font-bold">Humidity</p>
                                        <p className="text-xs sm:text-sm font-mono text-white/90">{weather.current.humidity}%</p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <Thermometer className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                                        <p className="text-[8px] sm:text-[9px] uppercase tracking-tighter opacity-50 font-bold">Feel</p>
                                        <p className="text-xs sm:text-sm font-mono text-white/90">{Math.round(weather.current.temp)}°</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Hourly Forecast */}
                        <motion.div variants={itemVariants} className="glass-card p-5 sm:p-8 space-y-4 sm:space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-xl font-bold flex items-center gap-2 sm:gap-3 text-white">
                                    <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 rotate-45" /> 
                                    Hourly
                                    <span className="text-white/40 font-medium text-[10px] sm:text-xs ml-1 sm:ml-2 px-1.5 py-0.5 rounded-lg bg-white/5 whitespace-nowrap">
                                        {selectedDayIndex === 0 ? "Today" : new Date(new Date(weather.daily[selectedDayIndex].date).getTime() + 86400000).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </h2>
                            </div>
                            
                            <div ref={hourlyScrollRef} className="flex gap-3 sm:gap-6 overflow-x-auto pb-4 sm:pb-6 scrollbar-hide px-1">
                                {selectedDayHourly.map((hour, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.01 }}
                                        className="flex flex-col items-center min-w-[65px] sm:min-w-[80px] p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5"
                                    >
                                        <span className="text-[9px] sm:text-[10px] font-bold text-white/40 mb-2 sm:mb-3 whitespace-nowrap">
                                            {new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                                        </span>
                                        {getWeatherIcon(hour.code, 24, "sm:w-8 sm:h-8 mb-2 sm:mb-3", hour.time)}
                                        <span className="text-base sm:text-lg font-mono font-bold text-white">
                                            {Math.round(hour.temp)}°
                                        </span>
                                        {hour.rain_chance > 0 && (hour.code >= 51 && hour.code <= 67 || hour.code >= 80 && hour.code <= 82 || hour.code >= 95 && hour.code <= 99) && (
                                            <span className="text-[9px] text-blue-400 font-bold mt-1">{hour.rain_chance}%</span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 7-Day Forecast */}
                        <motion.div variants={itemVariants} className="glass-card p-5 sm:p-8 space-y-6 sm:space-y-8">
                            <h2 className="text-base sm:text-xl font-bold flex items-center gap-3 text-white">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> 7-Day Forecast
                            </h2>
                            <div className="grid gap-2">
                                {weather.daily.map((day, idx) => (
                                    <motion.div 
                                        key={idx} 
                                        onClick={() => setSelectedDayIndex(idx)}
                                        whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                                        className={`flex items-center justify-between py-3 px-3 sm:py-4 sm:px-4 rounded-xl sm:rounded-2xl group cursor-pointer transition-all border ${selectedDayIndex === idx ? 'bg-white/10 border-white/20' : 'border-transparent'}`}
                                    >
                                        <div className="w-12 sm:w-24">
                                            <p className={`text-sm sm:text-lg font-bold ${selectedDayIndex === idx ? 'text-blue-400' : 'text-white'}`}>
                                                {idx === 0 ? "Today" : new Date(new Date(day.date).getTime() + 86400000).toLocaleDateString('en-US', { weekday: 'short' })}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 sm:gap-6 flex-1 px-2 sm:px-8 justify-start overflow-hidden">
                                        <div className="p-1.5 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 aspect-square overflow-hidden">
                                                <motion.div whileHover={{ scale: 1.2 }} transition={{ type: "spring", stiffness: 300 }}>
                                                    {getWeatherIcon(day.code, 18, "sm:w-7 sm:h-7")}
                                                </motion.div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] sm:text-xs font-medium text-white/60 group-hover:text-white transition-colors truncate">{day.condition}</span>
                                                {day.rain_chance > 0 && (
                                                    <span className="text-[9px] text-blue-400 font-bold">{day.rain_chance}% rain</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-3 sm:gap-6 text-sm sm:text-xl font-mono flex-shrink-0">
                                            <span className="text-white font-bold w-8 sm:w-10 text-right">{Math.round(day.temp_max)}°</span>
                                            <span className="text-white/30 w-8 sm:w-10 text-right">{Math.round(day.temp_min)}°</span>
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
