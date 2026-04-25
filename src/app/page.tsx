"use client";

import { useState, useEffect } from "react";
import RealisticBackground from "../components/RealisticBackground";
import Lottie from "lottie-react";
import clearDayAnim from "../../public/animations/clear-day.json";
import cloudyAnim from "../../public/animations/cloudy.json";
import partlyCloudyAnim from "../../public/animations/partly-cloudy-day.json";
import rainAnim from "../../public/animations/rain.json";
import snowAnim from "../../public/animations/snow.json";
import thunderAnim from "../../public/animations/thunder.json";
import { RefreshCw, MapPin, Wind, Sun, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WeatherData {
    current: { 
        temp: number; 
        condition: string; 
        code: number; 
        is_day: number; 
        windspeed: number; 
        humidity: number; 
        visibility: number; 
        pressure: number; 
    };
    hourly: Array<{ time: string; temp: number; code: number; }>;
    daily: Array<{ date: string; temp_max: number; temp_min: number; condition: string; code: number; }>;
}

export default function WeatherApp() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    const fetchWeather = async () => {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&current=temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m,visibility,surface_pressure&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`);
            const data = await res.json();
            setWeather({
                current: { 
                    temp: data.current.temperature_2m, 
                    condition: getWeatherDesc(data.current.weather_code), 
                    code: data.current.weather_code, 
                    is_day: data.current.is_day,
                    windspeed: data.current.wind_speed_10m,
                    humidity: data.current.relative_humidity_2m,
                    visibility: data.current.visibility / 1000,
                    pressure: data.current.surface_pressure
                },
                hourly: data.hourly.time.map((time: string, i: number) => ({ time, temp: data.hourly.temperature_2m[i], code: data.hourly.weather_code[i] })),
                daily: data.daily.time.map((date: string, i: number) => ({ 
                    date, 
                    temp_max: data.daily.temperature_2m_max[i], 
                    temp_min: data.daily.temperature_2m_min[i], 
                    condition: getWeatherDesc(data.daily.weather_code[i]), 
                    code: data.daily.weather_code[i] 
                })).slice(0, 7),
            });
        } catch (e) {
            console.error("Fetch failed", e);
        }
    };

    useEffect(() => { fetchWeather(); }, []);

    function getWeatherIcon(code: number, size: number = 64) {
        let anim = clearDayAnim as any;
        if (code > 0 && code <= 2) anim = partlyCloudyAnim;
        else if (code <= 48) anim = cloudyAnim;
        else if (code <= 67 || (code >= 80 && code <= 82)) anim = rainAnim;
        else if (code <= 77 || (code >= 85 && code <= 86)) anim = snowAnim;
        else anim = thunderAnim;
        return <Lottie animationData={anim} style={{ width: size, height: size }} loop={true} />;
    }

    function getWeatherDesc(code: number): string {
        if (code === 0) return "Clear Sky";
        if (code <= 3) return "Cloudy";
        if (code <= 48) return "Foggy";
        if (code <= 65) return "Rainy";
        if (code <= 77) return "Snowy";
        return "Stormy";
    }

    function formatTime(timeStr: string): string {
        return new Date(timeStr).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    }

    if (!weather) return <div className="h-screen flex items-center justify-center font-black tracking-widest text-slate-400 uppercase">Syncing Atmosphere...</div>;

    const currentCode = selectedDayIndex === 0 ? weather.current.code : weather.daily[selectedDayIndex].code;
    const isDay = selectedDayIndex === 0 ? weather.current.is_day === 1 : true;
    
    // Forced High-Contrast Logic
    const isLightBackground = isDay && (currentCode === 0 || currentCode <= 3);
    const textColor = isLightBackground ? 'text-slate-950' : 'text-white';
    const subTextColor = isLightBackground ? 'text-slate-900/70' : 'text-white/60';
    const iconFilter = isLightBackground ? 'invert-[0.9] brightness-[0.1]' : 'brightness-100'; 
    const shadowClass = isLightBackground 
        ? 'drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]' 
        : 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]';


    return (
        <main className={`min-h-screen p-6 md:p-16 transition-colors duration-1000 ${textColor} selection:bg-blue-500/30`}>
            <RealisticBackground code={currentCode} isDay={isDay} />
            
            <div className="max-w-5xl mx-auto flex flex-col gap-16">
                {/* Header */}
                <header className={`flex justify-between items-center font-black uppercase text-[10px] tracking-[0.3em] ${shadowClass}`}>
                    <div className="flex items-center gap-2"><MapPin size={14} /> Toronto System</div>
                    <button onClick={fetchWeather} className="hover:scale-110 transition-transform"><RefreshCw size={18} /></button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
                    {/* Hero Display */}
                    <motion.div 
                        key={selectedDayIndex} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className={`flex flex-col items-center md:items-start text-center md:text-left ${shadowClass}`}
                    >
                        <div className={`mb-6 transition-all duration-1000 ${iconFilter}`}>{getWeatherIcon(currentCode, 180)}</div>
                        <h1 className="text-[10rem] sm:text-[12rem] font-black leading-[0.8] tracking-tighter">
                            {selectedDayIndex === 0 ? Math.round(weather.current.temp) : Math.round(weather.daily[selectedDayIndex].temp_max)}°
                        </h1>
                        <p className="text-3xl sm:text-4xl font-black uppercase tracking-[0.1em] mt-8 opacity-90">{weather.daily[selectedDayIndex].condition}</p>
                        <div className={`mt-6 flex gap-6 text-sm font-bold uppercase tracking-widest ${subTextColor}`}>
                            <span>High {Math.round(weather.daily[selectedDayIndex].temp_max)}°</span>
                            <span>Low {Math.round(weather.daily[selectedDayIndex].temp_min)}°</span>
                        </div>
                    </motion.div>

                    {/* Dashboard Detail Panel */}
                    <div className="flex flex-col gap-12 sm:gap-16">
                        {/* Essential Metrics */}
                        <div className={`grid grid-cols-3 gap-8 ${shadowClass}`}>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subTextColor}`}>Wind</span>
                                <p className="text-2xl font-black flex items-baseline gap-1">{Math.round(weather.current.windspeed)}<span className="text-xs opacity-40 uppercase">km/h</span></p>
                            </div>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subTextColor}`}>UV Index</span>
                                <p className="text-2xl font-black flex items-baseline gap-1">4.2<span className="text-xs opacity-40 uppercase">mod</span></p>
                            </div>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subTextColor}`}>Humidity</span>
                                <p className="text-2xl font-black flex items-baseline gap-1">{weather.current.humidity}<span className="text-xs opacity-40 uppercase">%</span></p>
                            </div>
                        </div>

                        {/* Chronological Flow (Hourly) */}
                        <div className={`flex flex-col gap-6 ${shadowClass}`}>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subTextColor}`}>Timeline / 24H</span>
                            <div className="flex gap-8 overflow-x-auto pb-4 scrollbar-hide border-b border-current/10">
                                {weather.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((h, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                                        <span className={`text-[10px] font-bold ${subTextColor}`}>{formatTime(h.time)}</span>
                                        <div className={`transition-all duration-1000 ${iconFilter}`}>
                                            {getWeatherIcon(h.code, 36)}
                                        </div>
                                        <span className="font-black text-lg">{Math.round(h.temp)}°</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Outlook (Daily) */}
                        <div className={`flex flex-col gap-6 ${shadowClass}`}>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subTextColor}`}>7-Day Outlook</span>
                            <div className="grid gap-3">
                                {weather.daily.map((d, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedDayIndex(i)} 
                                        className={`flex items-center justify-between cursor-pointer py-3 px-4 rounded-2xl transition-all duration-300 ${selectedDayIndex === i ? 'bg-black/10 font-black' : 'hover:opacity-100 opacity-40'}`}
                                    >
                                        <span className="font-bold w-16 text-sm">{i === 0 ? "Today" : new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                        <div className={`flex-1 flex justify-center transition-all duration-1000 ${iconFilter}`}>{getWeatherIcon(d.code, 28)}</div>
                                        <div className="font-black text-right w-20 flex gap-3 justify-end text-sm">
                                            <span>{Math.round(d.temp_max)}°</span>
                                            <span className="opacity-30">{Math.round(d.temp_min)}°</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
