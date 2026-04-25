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
    current: { temp: number; condition: string; code: number; is_day: number; windspeed: number; humidity: number; };
    hourly: Array<{ time: string; temp: number; code: number; }>;
    daily: Array<{ date: string; temp_max: number; temp_min: number; condition: string; code: number; }>;
}

export default function WeatherApp() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);

    const fetchWeather = async () => {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=43.6532&longitude=-79.3832&current=temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`);
        const data = await res.json();
        setWeather({
            current: { temp: data.current.temperature_2m, condition: getWeatherDesc(data.current.weather_code), code: data.current.weather_code, is_day: data.current.is_day, windspeed: data.current.wind_speed_10m, humidity: data.current.relative_humidity_2m },
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

    if (!weather) return <div className="h-screen flex items-center justify-center font-bold">LOADING...</div>;

    const currentCode = selectedDayIndex === 0 ? weather.current.code : weather.daily[selectedDayIndex].code;
    const isDay = selectedDayIndex === 0 ? weather.current.is_day === 1 : true;

    return (
        <main className="min-h-screen text-slate-950 p-6 md:p-12">
            <RealisticBackground code={currentCode} isDay={isDay} />
            
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-16 text-stroke">
                    <div className="flex items-center gap-2 font-black uppercase text-xs"><MapPin size={16} /> Toronto</div>
                    <button onClick={fetchWeather}><RefreshCw size={16} /></button>
                </header>

                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div key={selectedDayIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                        {getWeatherIcon(currentCode, 200)}
                        <h1 className="text-9xl font-black mt-6 text-stroke">
                            {selectedDayIndex === 0 ? Math.round(weather.current.temp) : Math.round(weather.daily[selectedDayIndex].temp_max)}°
                        </h1>
                        <p className="text-3xl font-bold uppercase mt-2 text-stroke">{weather.daily[selectedDayIndex].condition}</p>
                    </motion.div>

                    <div className="space-y-12">
                        <div className="grid grid-cols-2 gap-8 text-stroke">
                            <div><p className="text-xs uppercase font-black opacity-50">Wind</p><p className="text-2xl font-black">{weather.current.windspeed} km/h</p></div>
                            <div><p className="text-xs uppercase font-black opacity-50">Humidity</p><p className="text-2xl font-black">{weather.current.humidity}%</p></div>
                        </div>

                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide text-stroke">
                            {weather.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((h, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                                    <span className="text-[10px] font-bold opacity-50">{new Date(h.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</span>
                                    {getWeatherIcon(h.code, 40)}
                                    <span className="font-black text-xl">{Math.round(h.temp)}°</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid gap-4 text-stroke">
                            {weather.daily.map((d, i) => (
                                <div key={i} onClick={() => setSelectedDayIndex(i)} className={`flex items-center justify-between cursor-pointer p-4 rounded-xl ${selectedDayIndex === i ? 'bg-white/30' : 'bg-transparent'}`}>
                                    <span className="font-bold">{i === 0 ? "Today" : new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    {getWeatherIcon(d.code, 32)}
                                    <span className="font-black text-lg">{Math.round(d.temp_max)}° / {Math.round(d.temp_min)}°</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
