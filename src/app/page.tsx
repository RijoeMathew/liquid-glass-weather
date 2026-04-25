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

    return (
        <main className="min-h-screen py-16 px-8 max-w-2xl mx-auto flex flex-col items-center">
            <RealisticBackground code={currentCode} isDay={isDay} />
            
            <div className="flex justify-between w-full mb-16 opacity-40">
                <div className="flex items-center gap-2 font-black uppercase tracking-widest text-xs"><MapPin size={16} /> Toronto</div>
                <button onClick={fetchWeather}><RefreshCw size={16} /></button>
            </div>

            <motion.div key={selectedDayIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-16">
                {getWeatherIcon(currentCode, 120)}
                <h1 className="text-9xl font-black my-4">
                    {selectedDayIndex === 0 ? Math.round(weather.current.temp) : Math.round(weather.daily[selectedDayIndex].temp_max)}°
                </h1>
                <p className="text-xl font-bold uppercase tracking-[0.2em] opacity-60">{weather.daily[selectedDayIndex].condition}</p>
            </motion.div>

            <div className="w-full flex justify-between gap-8 mb-16">
                <div className="flex flex-col gap-1">
                    <span className="label">Wind</span>
                    <span className="value">{weather.current.windspeed} km/h</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="label">UV Index</span>
                    <span className="value">4 (Low)</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="label">Air Quality</span>
                    <span className="value">32 AQI</span>
                </div>
            </div>

            <div className="w-full overflow-x-auto flex gap-10 pb-8 scrollbar-hide border-b border-slate-200 mb-8">
                {weather.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                        <span className="text-[10px] font-bold opacity-40">{new Date(h.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</span>
                        {getWeatherIcon(h.code, 32)}
                        <span className="font-black">{Math.round(h.temp)}°</span>
                    </div>
                ))}
            </div>

            <div className="w-full grid gap-4">
                {weather.daily.map((d, i) => (
                    <div key={i} onClick={() => setSelectedDayIndex(i)} className={`flex items-center justify-between cursor-pointer py-2 ${selectedDayIndex === i ? 'opacity-100' : 'opacity-40'}`}>
                        <span className="font-bold w-16">{i === 0 ? "Today" : new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        {getWeatherIcon(d.code, 24)}
                        <span className="font-black">{Math.round(d.temp_max)}°</span>
                    </div>
                ))}
            </div>
        </main>
    );
}
