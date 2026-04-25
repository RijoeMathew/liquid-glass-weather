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
import { RefreshCw, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface WeatherData {
    current: { temp: number; condition: string; code: number; is_day: number; windspeed: number; humidity: number; visibility: number; pressure: number; };
    hourly: Array<{ time: string; temp: number; code: number; }>;
    daily: Array<{ date: string; temp_max: number; temp_min: number; condition: string; code: number; }>;
}

export default function WeatherApp() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    const fetchWeather = async () => {
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
            daily: data.daily.time.map((date: string, i: number) => ({ date, temp_max: data.daily.temperature_2m_max[i], temp_min: data.daily.temperature_2m_min[i], condition: getWeatherDesc(data.daily.weather_code[i]), code: data.daily.weather_code[i] })),
        });
    };

    useEffect(() => { fetchWeather(); }, []);

    function getWeatherIcon(code: number, size: number = 64) {
        let anim = clearDayAnim as any;
        if (code > 0 && code <= 2) anim = partlyCloudyAnim;
        else if (code <= 48) anim = cloudyAnim;
        else if (code <= 67 || (code >= 80 && code <= 82)) anim = rainAnim;
        else if (code <= 77 || (code >= 85 && code <= 86)) anim = snowAnim;
        else if (code >= 95) anim = thunderAnim;
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

    if (!weather) return <div className="h-screen flex items-center justify-center font-black">LOADING...</div>;

    const currentCode = selectedDayIndex === 0 ? weather.current.code : weather.daily[selectedDayIndex].code;
    const isDay = selectedDayIndex === 0 ? weather.current.is_day === 1 : true;

    const isBackgroundLight = (code: number, isDay: boolean) => {
        if (!isDay) return false;
        return code === 0 || code <= 3;
    };

    const isLight = isBackgroundLight(currentCode, isDay);
    const textColor = isLight ? 'text-slate-900' : 'text-white';

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-10 text-slate-950">
            <RealisticBackground code={currentCode} isDay={isDay} />
            
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hero Card */}
                <motion.div key={selectedDayIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 flex flex-col items-center text-center justify-center drop-shadow-2xl">
                    {getWeatherIcon(currentCode, 160)}
                    <h1 className="text-9xl font-black mt-4 drop-shadow-sm">
                        {selectedDayIndex === 0 ? Math.round(weather.current.temp) : Math.round(weather.daily[selectedDayIndex].temp_max)}°
                    </h1>
                    <p className="text-3xl font-medium">{weather.daily[selectedDayIndex].condition}</p>
                </motion.div>

                {/* Forecast Side Panel */}
                <div className="flex flex-col gap-6">
                    {/* Hourly */}
                    <div className="p-6 overflow-x-auto flex gap-6 scrollbar-hide bg-white/40 rounded-3xl border border-white/50 backdrop-blur-sm shadow-sm">
                        {weather.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((h, i) => (
                            <div key={i} className="flex flex-col items-center shrink-0">
                                <span className="text-xs font-bold opacity-60">{formatTime(h.time)}</span>
                                {getWeatherIcon(h.code, 40)}
                                <span className="text-lg font-black">{Math.round(h.temp)}°</span>
                            </div>
                        ))}
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/40 rounded-3xl border border-white/50 backdrop-blur-sm shadow-sm">
                            <p className="text-sm opacity-60 font-bold uppercase tracking-wider">Wind</p>
                            <p className="text-2xl font-black">{weather.current.windspeed} km/h</p>
                        </div>
                        <div className="p-4 bg-white/40 rounded-3xl border border-white/50 backdrop-blur-sm shadow-sm">
                            <p className="text-sm opacity-60 font-bold uppercase tracking-wider">UV Index</p>
                            <p className="text-2xl font-black">4</p>
                        </div>
                        <div className="p-4 col-span-2 bg-white/40 rounded-3xl border border-white/50 backdrop-blur-sm shadow-sm">
                            <p className="text-sm opacity-60 font-bold uppercase tracking-wider">Air Quality</p>
                            <p className="text-2xl font-black">Good (AQI 32)</p>
                        </div>
                    </div>

                    {/* Daily */}
                    <div className="p-6 flex flex-col gap-4 flex-grow bg-white/40 rounded-3xl border border-white/50 backdrop-blur-sm shadow-sm">
                        {weather.daily.map((d, i) => (
                            <div key={i} onClick={() => setSelectedDayIndex(i)} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${selectedDayIndex === i ? 'bg-white/50' : ''}`}>
                                <span className="font-bold w-20">{i === 0 ? "Today" : new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                {getWeatherIcon(d.code, 32)}
                                <div className="flex gap-4 font-black">
                                    <span>{Math.round(d.temp_max)}°</span>
                                    <span className="opacity-40">{Math.round(d.temp_min)}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
