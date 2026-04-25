"use client";

import { useState, useEffect, useRef } from "react";
import RealisticBackground from "../components/RealisticBackground";
import Lottie from "lottie-react";
import clearDayAnim from "../../public/animations/clear-day.json";
import cloudyAnim from "../../public/animations/cloudy.json";
import partlyCloudyAnim from "../../public/animations/partly-cloudy-day.json";
import rainAnim from "../../public/animations/rain.json";
import snowAnim from "../../public/animations/snow.json";
import thunderAnim from "../../public/animations/thunder.json";
import {
    Wind, Thermometer, MapPin, Loader2,
    Droplets, Navigation, Calendar, RefreshCw, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface WeatherData {
    current: {
        temp: number;
        condition: string;
        windspeed: number;
        humidity: number;
        code: number;
        is_day: number;
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
                } catch {
                    latitude = 43.6532;
                    longitude = -79.3832;
                    setUsingDefault(true);
                }
            }

            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto`
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
                    is_day: data.current.is_day,
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
        } catch {
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
        if (code <= 3) return "Cloudy";
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
        let animation;
        if (code === 0) animation = clearDayAnim;
        else if (code <= 2) animation = partlyCloudyAnim;
        else if (code <= 48) animation = cloudyAnim;
        else if (code <= 67 || (code >= 80 && code <= 82)) animation = rainAnim;
        else if (code <= 77 || (code >= 85 && code <= 86)) animation = snowAnim;
        else animation = thunderAnim;

        return (
            <div style={{ width: size, height: size }} className={className}>
                <Lottie animationData={animation} loop={true} />
            </div>
        );
    }

    function formatDayName(dateStr: string): string {
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: Variants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 gap-6 text-center p-6">
                <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
                </motion.div>
                <div className="space-y-1">
                    <p className="text-white text-xl font-semibold tracking-tight">Gathering Atmosphere</p>
                    <p className="text-blue-400/60 text-xs font-bold uppercase tracking-widest">Live Syncing</p>
                </div>
            </div>
        );
    }

    const currentCode = selectedDayIndex === 0 ? weather?.current.code : weather?.daily[selectedDayIndex].code;
    const isDay = selectedDayIndex === 0 ? weather?.current.is_day === 1 : true;

    return (
        <>
        <RealisticBackground code={currentCode} isDay={isDay} />
        <main className="min-h-dvh p-4 sm:p-8 md:p-12 flex flex-col items-center relative z-10">
            <AnimatePresence>
                {weather && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-4xl space-y-6">
                        {/* Header/Location */}
                        <motion.div variants={itemVariants} className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-2">
                             <MapPin className="text-white/60" size={20} />
                             <h2 className="text-xl font-bold text-white tracking-tight">
                                {usingDefault ? "Toronto, ON" : "Current Location"}
                             </h2>
                           </div>
                           <button onClick={() => fetchWeather()} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                             <RefreshCw size={20} />
                           </button>
                        </motion.div>

                        {/* Hero Section */}
                        <motion.div variants={itemVariants} className="material-card p-8 sm:p-12 text-center space-y-8">
                            <div className="flex flex-col items-center gap-4">
                                <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                                    {getWeatherIcon(weather.current.code, 120, "sm:w-[160px] sm:h-[160px]")}
                                </motion.div>
                                <div className="space-y-1">
                                    <h1 className="text-8xl sm:text-9xl font-black text-white tracking-tighter leading-none">
                                        {Math.round(weather.current.temp)}°
                                    </h1>
                                    <p className="text-2xl sm:text-3xl font-medium text-white/80">
                                        {weather.current.condition}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
                                <div className="space-y-1">
                                    <Wind className="w-6 h-6 text-blue-300 mx-auto" />
                                    <p className="text-label">Wind</p>
                                    <p className="text-lg font-bold">{weather.current.windspeed} <span className="text-xs opacity-50">km/h</span></p>
                                </div>
                                <div className="space-y-1 border-x border-white/5">
                                    <Droplets className="w-6 h-6 text-cyan-300 mx-auto" />
                                    <p className="text-label">Humidity</p>
                                    <p className="text-lg font-bold">{weather.current.humidity}%</p>
                                </div>
                                <div className="space-y-1">
                                    <Thermometer className="w-6 h-6 text-red-300 mx-auto" />
                                    <p className="text-label">Feels Like</p>
                                    <p className="text-lg font-bold">{Math.round(weather.current.temp)}°</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Hourly Section */}
                        <motion.div variants={itemVariants} className="material-card p-6 sm:p-8 space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Navigation className="rotate-45 text-blue-400" size={22} />
                                Hourly Forecast
                            </h3>
                            <div ref={hourlyScrollRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                {weather.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((hour, idx) => (
                                    <div key={idx} className="flex flex-col items-center min-w-[70px] p-4 rounded-2xl bg-white/5 border border-white/5">
                                        <span className="text-[10px] font-bold text-white/40 mb-3 uppercase tracking-wider">
                                            {new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}
                                        </span>
                                        {getWeatherIcon(hour.code, 32, "mb-3")}
                                        <span className="text-xl font-bold">{Math.round(hour.temp)}°</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* 7-Day Section */}
                        <motion.div variants={itemVariants} className="material-card p-6 sm:p-8 space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="text-blue-400" size={22} />
                                7-Day Forecast
                            </h3>
                            <div className="grid gap-3">
                                {weather.daily.map((day, idx) => (
                                    <motion.div
                                        key={idx}
                                        onClick={() => setSelectedDayIndex(idx)}
                                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${selectedDayIndex === idx ? 'bg-white/20 border-white/30 shadow-lg scale-[1.02]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                    >
                                        <div className="w-20">
                                            <p className={`text-lg font-bold ${selectedDayIndex === idx ? 'text-white' : 'text-white/60'}`}>
                                                {idx === 0 ? "Today" : formatDayName(day.date)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 flex-1 justify-center">
                                            {getWeatherIcon(day.code, 28)}
                                            <span className="text-sm font-medium text-white/60 hidden sm:inline">{day.condition}</span>
                                        </div>
                                        <div className="flex gap-4 w-20 justify-end font-bold text-lg">
                                            <span>{Math.round(day.temp_max)}°</span>
                                            <span className="opacity-30">{Math.round(day.temp_min)}°</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
        </>
    );
}
