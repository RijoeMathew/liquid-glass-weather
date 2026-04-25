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
    Droplets, Navigation, Calendar, RefreshCw, Sun, Eye, Gauge, ArrowDown
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
                    visibility: data.current.visibility / 1000, // km
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
            <div className="h-screen w-full flex items-center justify-center bg-slate-950">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    const currentCode = selectedDayIndex === 0 ? weather?.current.code : weather?.daily[selectedDayIndex].code;
    const isDay = selectedDayIndex === 0 ? weather?.current.is_day === 1 : true;

    return (
        <>
        <RealisticBackground code={currentCode} isDay={isDay} />
        <main className="min-h-screen flex flex-col items-center py-12 px-6 sm:px-12 relative z-10">
            
            <div className="w-full max-w-[1200px] flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-3">
                    <MapPin className="text-white/40" />
                    <h2 className="text-2xl font-bold tracking-tight">
                        {usingDefault ? "Toronto, ON" : "Your Location"}
                    </h2>
                </div>
                <button onClick={() => fetchWeather()} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="bento-container">
                {/* HERO TILE */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bento-tile tile-hero justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-label-caps mb-2">Current Weather</p>
                            <h1 className="text-huge">{Math.round(weather!.current.temp)}°</h1>
                            <p className="text-2xl font-medium text-white/60 mt-2">{weather!.current.condition}</p>
                        </div>
                        <div className="mt-[-20px] mr-[-20px]">
                            {getWeatherIcon(weather!.current.code, 180)}
                        </div>
                    </div>
                    <div className="flex gap-6 mt-8">
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                            <ArrowDown size={14} className="text-blue-400" />
                            <span className="text-sm font-bold">{Math.round(weather!.daily[0].temp_min)}°</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                            <span className="text-sm font-bold">H: {Math.round(weather!.daily[0].temp_max)}°</span>
                        </div>
                    </div>
                </motion.div>

                {/* 7-DAY FORECAST */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bento-tile tile-tall space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={18} className="text-blue-400" />
                        <p className="text-label-caps">7-Day Forecast</p>
                    </div>
                    <div className="space-y-4">
                        {weather!.daily.map((day, i) => (
                            <div key={i} onClick={() => setSelectedDayIndex(i)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${selectedDayIndex === i ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}>
                                <span className="text-sm font-bold w-12">{i === 0 ? "Today" : new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                {getWeatherIcon(day.code, 28)}
                                <div className="flex gap-3 text-sm font-bold w-16 justify-end">
                                    <span>{Math.round(day.temp_max)}°</span>
                                    <span className="opacity-30">{Math.round(day.temp_min)}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* HOURLY FORECAST */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bento-tile tile-wide overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <Navigation size={18} className="rotate-45 text-blue-400" />
                        <p className="text-label-caps">Hourly Forecast</p>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {weather!.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((h, i) => (
                            <div key={i} className="flex flex-col items-center min-w-[60px] space-y-3">
                                <span className="text-[10px] font-bold text-white/30 uppercase">{new Date(h.time).getHours()}:00</span>
                                {getWeatherIcon(h.code, 32)}
                                <span className="text-lg font-black">{Math.round(h.temp)}°</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* SMALL METRICS */}
                <div className="bento-tile tile-small justify-between">
                    <div className="flex items-center gap-2">
                        <Wind size={16} className="text-blue-400" />
                        <p className="text-label-caps">Wind</p>
                    </div>
                    <p className="text-3xl font-black">{weather!.current.windspeed} <span className="text-sm font-medium opacity-40">km/h</span></p>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-blue-400" style={{ width: `${Math.min(weather!.current.windspeed * 2, 100)}%` }} />
                    </div>
                </div>

                <div className="bento-tile tile-small justify-between">
                    <div className="flex items-center gap-2">
                        <Droplets size={16} className="text-cyan-400" />
                        <p className="text-label-caps">Humidity</p>
                    </div>
                    <p className="text-3xl font-black">{weather!.current.humidity}%</p>
                    <p className="text-xs text-white/40 font-medium">Dew point is 14°</p>
                </div>

                <div className="bento-tile tile-small justify-between">
                    <div className="flex items-center gap-2">
                        <Eye size={16} className="text-purple-400" />
                        <p className="text-label-caps">Visibility</p>
                    </div>
                    <p className="text-3xl font-black">{Math.round(weather!.current.visibility)} <span className="text-sm font-medium opacity-40">km</span></p>
                    <p className="text-xs text-white/40 font-medium">Perfectly clear view</p>
                </div>

                <div className="bento-tile tile-small justify-between">
                    <div className="flex items-center gap-2">
                        <Gauge size={16} className="text-amber-400" />
                        <p className="text-label-caps">Pressure</p>
                    </div>
                    <p className="text-3xl font-black">{Math.round(weather!.current.pressure)} <span className="text-sm font-medium opacity-40">hPa</span></p>
                    <p className="text-xs text-white/40 font-medium">Standard atmosphere</p>
                </div>

                <div className="bento-tile tile-small justify-between">
                    <div className="flex items-center gap-2">
                        <Thermometer size={16} className="text-red-400" />
                        <p className="text-label-caps">Feels Like</p>
                    </div>
                    <p className="text-3xl font-black">{Math.round(weather!.current.temp)}°</p>
                    <p className="text-xs text-white/40 font-medium">Similar to actual</p>
                </div>

                <div className="bento-tile tile-small justify-between">
                    <div className="flex items-center gap-2">
                        <Sun size={16} className="text-yellow-400" />
                        <p className="text-label-caps">UV Index</p>
                    </div>
                    <p className="text-3xl font-black">4 <span className="text-sm font-medium opacity-40">Mod</span></p>
                    <p className="text-xs text-white/40 font-medium">Use sun protection</p>
                </div>
            </div>
        </main>
        </>
    );
}
