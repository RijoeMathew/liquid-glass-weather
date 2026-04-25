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
import {
    Wind, Thermometer, MapPin, Loader2,
    Droplets, Navigation, Calendar, RefreshCw, Sun, Eye, Gauge, ArrowDown, Map
} from "lucide-react";

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
    hourly: Array<{ time: string; temp: number; code: number; }>;
    daily: Array<{ date: string; temp_max: number; temp_min: number; condition: string; code: number; }>;
}

export default function WeatherApp() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    const fetchWeather = async () => {
        try {
            setLoading(true);
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day,visibility,surface_pressure&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`);
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
                hourly: data.hourly.time.map((time: string, i: number) => ({ time, temp: data.hourly.temperature_2m[i], code: data.hourly.weather_code[i] })),
                daily: data.daily.time.map((date: string, i: number) => ({ date, temp_max: data.daily.temperature_2m_max[i], temp_min: data.daily.temperature_2m_min[i], condition: getWeatherDesc(data.daily.weather_code[i]), code: data.daily.weather_code[i] })).slice(0, 7),
            });
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchWeather(); }, []);

    function getWeatherDesc(code: number): string {
        if (code === 0) return "Clear Sky";
        if (code <= 3) return "Cloudy";
        if (code <= 48) return "Foggy";
        if (code <= 65) return "Rainy";
        if (code <= 77) return "Snowy";
        return "Stormy";
    }

    function getWeatherIcon(code: number, size: number = 32) {
        let anim = clearDayAnim as any;
        if (code > 0 && code <= 2) anim = partlyCloudyAnim;
        else if (code <= 48) anim = cloudyAnim;
        else if (code <= 67 || (code >= 80 && code <= 82)) anim = rainAnim;
        else if (code <= 77 || (code >= 85 && code <= 86)) anim = snowAnim;
        else anim = thunderAnim;
        return <Lottie animationData={anim} style={{ width: size, height: size }} loop={true} />;
    }

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">Loading...</div>;

    const currentCode = selectedDayIndex === 0 ? weather?.current.code : weather?.daily[selectedDayIndex].code;
    const isDay = selectedDayIndex === 0 ? weather?.current.is_day === 1 : true;

    return (
        <main className="min-h-screen bg-[#f1f5f9] p-4 sm:p-6 pb-12">
            <RealisticBackground code={currentCode} isDay={isDay} />
            
            <div className="flex items-center justify-between max-w-[900px] mx-auto mb-6 px-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                    <Map size={20} /> Weather Dashboard
                </div>
                <button onClick={fetchWeather} className="p-2 bg-white rounded-xl shadow-sm hover:scale-105 transition-transform"><RefreshCw size={18} /></button>
            </div>

            <div className="bento-container">
                <div className="bento-tile tile-hero">
                    <p className="text-label-caps mb-4 text-slate-500">Currently</p>
                    <h1 className="text-huge text-slate-950">{Math.round(weather!.current.temp)}°</h1>
                    <p className="text-xl font-bold text-slate-600">{weather!.current.condition}</p>
                    <div className="mt-auto pt-6 flex gap-4 text-slate-500 text-sm font-bold">
                        <p>H: {Math.round(weather!.daily[0].temp_max)}°</p>
                        <p>L: {Math.round(weather!.daily[0].temp_min)}°</p>
                    </div>
                </div>

                <div className="bento-tile">
                    <p className="text-label-caps text-slate-400 mb-4">Wind</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black">{weather!.current.windspeed}</span>
                        <span className="text-slate-400 font-bold pb-2">km/h</span>
                    </div>
                </div>

                <div className="bento-tile">
                    <p className="text-label-caps text-slate-400 mb-4">Humidity</p>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black">{weather!.current.humidity}</span>
                        <span className="text-slate-400 font-bold pb-2">%</span>
                    </div>
                </div>

                <div className="bento-tile tile-wide">
                    <p className="text-label-caps text-slate-400 mb-6">7-Day Forecast</p>
                    <div className="grid grid-cols-7 gap-2">
                        {weather!.daily.map((day, i) => (
                            <div key={i} onClick={() => setSelectedDayIndex(i)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer ${selectedDayIndex === i ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>
                                <span className="text-[10px] font-bold">{new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                {getWeatherIcon(day.code, 24)}
                                <span className="font-bold">{Math.round(day.temp_max)}°</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
