"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, RefreshCw } from "lucide-react";
import RealisticBackground from "../components/RealisticBackground";
import { getWeatherIcon } from "../components/WeatherIcon";

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
    hourly: Array<{ time: string; temp: number; code: number }>;
    daily: Array<{ date: string; temp_max: number; temp_min: number; condition: string; code: number }>;
}

function getWeatherDesc(code: number): string {
    switch (code) {
        case 0:
            return "Clear Sky";
        case 1:
            return "Mainly Clear";
        case 2:
            return "Partly Cloudy";
        case 3:
            return "Overcast";
        case 45:
        case 48:
            return "Fog";
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
            return "Drizzle";
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
        case 80:
        case 81:
        case 82:
            return "Rainy";
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
            return "Snowy";
        case 95:
        case 96:
        case 99:
            return "Thunderstorm";
        default:
            return "Cloudy";
    }
}

export default function WeatherApp() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    const fetchWeather = async () => {
        try {
            const res = await fetch(
                "https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&current=temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m,visibility,surface_pressure&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto"
            );
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
                    pressure: data.current.surface_pressure,
                },
                hourly: data.hourly.time.map((time: string, i: number) => ({
                    time,
                    temp: data.hourly.temperature_2m[i],
                    code: data.hourly.weather_code[i],
                })),
                daily: data.daily.time
                    .map((date: string, i: number) => ({
                        date,
                        temp_max: data.daily.temperature_2m_max[i],
                        temp_min: data.daily.temperature_2m_min[i],
                        condition: getWeatherDesc(data.daily.weather_code[i]),
                        code: data.daily.weather_code[i],
                    }))
                    .slice(0, 7),
            });
        } catch (e) {
            console.error("Fetch failed", e);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    function formatTime(timeStr: string): string {
        return new Date(timeStr).toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
    }

    if (!weather) {
        return <div className="h-screen flex items-center justify-center font-black tracking-widest text-slate-400 uppercase">Syncing Atmosphere...</div>;
    }

    const currentCode = selectedDayIndex === 0 ? weather.current.code : weather.daily[selectedDayIndex].code;

    const getIsDayForTime = (timeStr: string) => {
        const hour = new Date(timeStr).getHours();
        return hour >= 6 && hour < 18;
    };

    const isDay = selectedDayIndex === 0 ? weather.current.is_day === 1 : true;
    const isLightBackground = isDay && (currentCode <= 3 || (currentCode >= 45 && currentCode <= 48));
    const textColor = isLightBackground ? "text-slate-950" : "text-white";
    const subTextColor = isLightBackground ? "text-slate-900/70" : "text-white/60";
    const shadowClass = "";

    return (
        <main className={`min-h-screen p-6 md:p-16 transition-colors duration-1000 ${textColor} selection:bg-blue-500/30`}>
            <RealisticBackground code={currentCode} isDay={isDay} />

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16">
                <header className={`col-span-full flex justify-between items-center font-black uppercase text-[10px] tracking-[0.3em] ${shadowClass}`}>
                    <div className="flex items-center gap-2"><MapPin size={14} /> Toronto System</div>
                    <button onClick={fetchWeather} className="hover:scale-110 transition-transform"><RefreshCw size={18} /></button>
                </header>

                <motion.div
                    key={selectedDayIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left ${shadowClass}`}
                >
                    <div className="mb-6 transition-all duration-1000">{getWeatherIcon(currentCode, 180, "", isDay)}</div>
                    <h1 className="text-[10rem] sm:text-[12rem] font-black leading-[0.8] tracking-tighter">
                        {selectedDayIndex === 0 ? Math.round(weather.current.temp) : Math.round(weather.daily[selectedDayIndex].temp_max)}&deg;
                    </h1>
                    <p className="text-3xl sm:text-4xl font-black uppercase tracking-[0.1em] mt-8 opacity-90">
                        {selectedDayIndex === 0 ? weather.current.condition : weather.daily[selectedDayIndex].condition}
                    </p>
                    <div className={`mt-6 flex gap-6 text-sm font-bold uppercase tracking-widest ${subTextColor}`}>
                        <span>High {Math.round(weather.daily[selectedDayIndex].temp_max)}&deg;</span>
                        <span>Low {Math.round(weather.daily[selectedDayIndex].temp_min)}&deg;</span>
                    </div>
                </motion.div>

                <div className="md:col-span-7 flex flex-col gap-12 sm:gap-16">
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

                    <div className={`flex flex-col gap-6 ${shadowClass}`}>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subTextColor}`}>Timeline / 24H</span>
                        <div className="flex gap-8 overflow-x-auto pb-4 scrollbar-hide border-b border-current/10">
                            {weather.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((h, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                                    <span className={`text-[10px] font-bold ${subTextColor}`}>{formatTime(h.time)}</span>
                                    <div className="transition-all duration-1000">{getWeatherIcon(h.code, 36, "", getIsDayForTime(h.time))}</div>
                                    <span className="font-black text-lg">{Math.round(h.temp)}&deg;</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`flex flex-col gap-6 ${shadowClass}`}>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subTextColor}`}>7-Day Outlook</span>
                        <div className="grid gap-3">
                            {weather.daily.map((d, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedDayIndex(i)}
                                    className={`flex items-center justify-between cursor-pointer py-3 px-4 rounded-2xl transition-all duration-300 ${selectedDayIndex === i ? "bg-black/10 font-black" : "hover:opacity-100 opacity-40"}`}
                                >
                                    <span className="font-bold w-16 text-sm">{i === 0 ? "Today" : new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}</span>
                                    <div className="flex-1 flex justify-center transition-all duration-1000">{getWeatherIcon(d.code, 28, "", true)}</div>
                                    <div className="font-black text-right w-20 flex gap-3 justify-end text-sm">
                                        <span>{Math.round(d.temp_max)}&deg;</span>
                                        <span className="opacity-30">{Math.round(d.temp_min)}&deg;</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
