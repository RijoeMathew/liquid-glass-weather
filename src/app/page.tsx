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
    Droplets, Navigation, Calendar, RefreshCw, Sun, Eye, Gauge, ArrowDown, Map
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WeatherData {
    current: {
        temp: number;
        condition: string;
        windspeed: number;
        humidity: number;
        code: number;
        is_day: number;
        visibility: number;
        pressure: number;
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
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [usingDefault, setUsingDefault] = useState(false);
    const hourlyScrollRef = useRef<HTMLDivElement>(null);

    const fetchWeather = async (lat?: number, lon?: number) => {
        try {
            setLoading(true);
            let latitude = lat ?? 43.6532;
            let longitude = lon ?? -79.3832;

            if (lat === undefined) {
                try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) => {
                        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
                    });
                    latitude = pos.coords.latitude;
                    longitude = pos.coords.longitude;
                    setUsingDefault(false);
                } catch {
                    setUsingDefault(true);
                }
            }

            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day,visibility,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=auto`
            );

            const data = await res.json();
            setWeather({
                current: {
                    temp: data.current.temperature_2m,
                    condition: getWeatherDesc(data.current.weather_code),
                    windspeed: data.current.wind_speed_10m,
                    humidity: data.current.relative_humidity_2m,
                    code: data.current.weather_code,
                    is_day: data.current.is_day,
                    visibility: data.current.visibility / 1000,
                    pressure: data.current.surface_pressure,
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
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWeather(); }, []);

    function getWeatherDesc(code: number): string {
        if (code === 0) return "Clear Sky";
        if (code <= 3) return "Cloudy";
        if (code <= 48) return "Foggy";
        if (code <= 65) return "Rainy";
        if (code <= 77) return "Snowy";
        if (code >= 95) return "Thunderstorm";
        return "Unknown";
    }

    function getWeatherIcon(code: number, size: number = 24) {
        let animation = clearDayAnim as any;
        if (code > 0 && code <= 2) animation = partlyCloudyAnim;
        else if (code <= 48) animation = cloudyAnim;
        else if (code <= 67 || (code >= 80 && code <= 82)) animation = rainAnim;
        else if (code <= 77 || (code >= 85 && code <= 86)) animation = snowAnim;
        else if (code >= 95) animation = thunderAnim;

        return <Lottie animationData={animation} style={{ width: size, height: size }} loop={true} />;
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] gap-6">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-white/40 text-xs font-black uppercase tracking-[0.3em]">Initializing Panel</p>
            </div>
        );
    }

    const currentCode = selectedDayIndex === 0 ? weather?.current.code : weather?.daily[selectedDayIndex].code;
    const isDay = selectedDayIndex === 0 ? weather?.current.is_day === 1 : true;

    return (
        <>
        <RealisticBackground code={currentCode} isDay={isDay} />
        <main className="min-h-screen flex flex-col items-center py-10 px-4 sm:px-10 relative z-10">
            
            {/* System Header */}
            <div className="w-full max-w-[1300px] flex items-center justify-between mb-10 px-6">
                <div className="flex items-center gap-4 bg-[#0f172a] px-6 py-3 rounded-2xl shadow-lg border border-white/5">
                    <Map size={18} className="text-blue-400" />
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                        {usingDefault ? "Toronto System" : "Active Location"}
                    </h2>
                </div>
                <button onClick={() => fetchWeather()} className="w-12 h-12 flex items-center justify-center bg-[#0f172a] hover:bg-[#1e293b] rounded-2xl shadow-lg border border-white/5 transition-all active:scale-95">
                    <RefreshCw size={20} className="text-white/60" />
                </button>
            </div>

            <div className="bento-container">
                {/* HERO PANEL */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tactile-tile tile-hero justify-between group">
                    <div className="flex justify-between items-start">
                        <div className="space-y-4">
                            <p className="text-label-caps">Meteorological Overview</p>
                            <h1 className="text-huge">{Math.round(weather!.current.temp)}°</h1>
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-xl font-bold text-white/80 uppercase tracking-widest">{weather!.current.condition}</p>
                            </div>
                        </div>
                        <div className="tactile-well w-40 h-40 sm:w-56 sm:h-56">
                            {getWeatherIcon(weather!.current.code, 180)}
                        </div>
                    </div>
                    
                    <div className="flex gap-4 mt-8">
                        <div className="bg-[#020617] px-6 py-3 rounded-2xl shadow-inner border border-white/5">
                            <span className="text-label-caps block mb-1">Low Range</span>
                            <span className="text-lg font-black">{Math.round(weather!.daily[0].temp_min)}°</span>
                        </div>
                        <div className="bg-[#020617] px-6 py-3 rounded-2xl shadow-inner border border-white/5">
                            <span className="text-label-caps block mb-1">High Range</span>
                            <span className="text-lg font-black">{Math.round(weather!.daily[0].temp_max)}°</span>
                        </div>
                    </div>
                </motion.div>

                {/* 7-DAY VERTICAL PANEL */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="tactile-tile tile-tall space-y-8">
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-blue-500" />
                        <p className="text-label-caps">Weekly Outlook</p>
                    </div>
                    <div className="space-y-3">
                        {weather!.daily.map((day, i) => (
                            <div key={i} onClick={() => setSelectedDayIndex(i)} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${selectedDayIndex === i ? 'bg-[#020617] shadow-inner border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}>
                                <span className="text-xs font-black uppercase w-12 text-white/60">{i === 0 ? "NOW" : new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                {getWeatherIcon(day.code, 26)}
                                <div className="flex gap-3 font-black text-sm w-16 justify-end">
                                    <span className="text-white">{Math.round(day.temp_max)}°</span>
                                    <span className="text-white/20">{Math.round(day.temp_min)}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* HOURLY HORIZONTAL PANEL */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tactile-tile tile-wide">
                    <div className="flex items-center gap-3 mb-8">
                        <Navigation size={18} className="rotate-45 text-blue-500" />
                        <p className="text-label-caps">Chronological Flow</p>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {weather!.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((h, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[75px] space-y-4 p-4 rounded-2xl bg-[#020617] shadow-inner border border-white/5">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-tighter">{new Date(h.time).getHours()}:00</span>
                                {getWeatherIcon(h.code, 32)}
                                <span className="text-lg font-black">{Math.round(h.temp)}°</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* SMALL DATA MODULES */}
                <div className="tactile-tile tile-small justify-between">
                    <div className="flex items-center gap-3">
                        <Wind size={16} className="text-blue-500" />
                        <p className="text-label-caps">Wind Vel</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-4xl font-black text-white">{weather!.current.windspeed}</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Kilo / Hour</p>
                    </div>
                    <div className="w-full h-1.5 bg-[#020617] rounded-full shadow-inner overflow-hidden mt-4">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(weather!.current.windspeed * 2.5, 100)}%` }} className="h-full bg-blue-500" />
                    </div>
                </div>

                <div className="tactile-tile tile-small justify-between">
                    <div className="flex items-center gap-3">
                        <Droplets size={16} className="text-blue-500" />
                        <p className="text-label-caps">Moisture</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-4xl font-black text-white">{weather!.current.humidity}%</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Relative Hum</p>
                    </div>
                    <div className="w-full h-1.5 bg-[#020617] rounded-full shadow-inner overflow-hidden mt-4">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${weather!.current.humidity}%` }} className="h-full bg-blue-400" />
                    </div>
                </div>

                <div className="tactile-tile tile-small justify-between">
                    <div className="flex items-center gap-3">
                        <Eye size={16} className="text-blue-500" />
                        <p className="text-label-caps">Optical</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-4xl font-black text-white">{Math.round(weather!.current.visibility)}</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Range / KM</p>
                    </div>
                    <div className="bg-[#020617] py-2 px-3 rounded-lg shadow-inner text-[9px] font-black text-blue-400 uppercase tracking-widest">Nominal</div>
                </div>

                <div className="tactile-tile tile-small justify-between">
                    <div className="flex items-center gap-3">
                        <Gauge size={16} className="text-blue-500" />
                        <p className="text-label-caps">Pressure</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-4xl font-black text-white">{Math.round(weather!.current.pressure)}</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Hectopascal</p>
                    </div>
                    <div className="bg-[#020617] py-2 px-3 rounded-lg shadow-inner text-[9px] font-black text-blue-400 uppercase tracking-widest">Stable</div>
                </div>

                <div className="tactile-tile tile-small justify-between">
                    <div className="flex items-center gap-3">
                        <Thermometer size={16} className="text-blue-500" />
                        <p className="text-label-caps">Perception</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-4xl font-black text-white">{Math.round(weather!.current.temp)}°</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Sensory Temp</p>
                    </div>
                    <div className="w-full h-1.5 bg-[#020617] rounded-full shadow-inner overflow-hidden mt-4">
                        <motion.div initial={{ width: 0 }} animate={{ width: "50%" }} className="h-full bg-blue-600" />
                    </div>
                </div>

                <div className="tactile-tile tile-small justify-between">
                    <div className="flex items-center gap-3">
                        <Sun size={16} className="text-blue-500" />
                        <p className="text-label-caps">Radiation</p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-4xl font-black text-white">4.2</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">UV Index</p>
                    </div>
                    <div className="bg-[#020617] py-2 px-3 rounded-lg shadow-inner text-[9px] font-black text-blue-400 uppercase tracking-widest">Moderate</div>
                </div>
            </div>
        </main>
        </>
    );
}
