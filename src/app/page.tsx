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
    
    // Hard force contrast: White text on night, Black on day clear
    const isLight = isDay && (currentCode === 0 || currentCode <= 3);
    const textColor = isLight ? 'text-slate-950' : 'text-white';

    return (
        <main className={`min-h-screen p-8 transition-colors duration-1000 ${textColor}`}>
            <RealisticBackground code={currentCode} isDay={isDay} />
            
            <div className="max-w-2xl mx-auto flex flex-col items-center pt-10">
                <div className="w-full flex justify-between items-center mb-16 font-bold uppercase tracking-[0.2em] text-[10px] opacity-60">
                    <div className="flex items-center gap-2"><MapPin size={16} /> Toronto</div>
                    <button onClick={fetchWeather}><RefreshCw size={16} /></button>
                </div>

                <div className="text-center mb-16">
                    {getWeatherIcon(currentCode, 160)}
                    <h1 className="text-9xl font-black mt-6">
                        {selectedDayIndex === 0 ? Math.round(weather.current.temp) : Math.round(weather.daily[selectedDayIndex].temp_max)}°
                    </h1>
                    <p className="text-2xl font-bold uppercase tracking-[0.2em] opacity-60 mt-4">{weather.daily[selectedDayIndex].condition}</p>
                </div>

                <div className="w-full flex justify-between gap-8 mb-16">
                    {[
                        { label: 'Wind', value: `${weather.current.windspeed} km/h` },
                        { label: 'UV Index', value: '4 (Low)' },
                        { label: 'AQI', value: '32 (Good)' }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{item.label}</span>
                            <span className="text-xl font-bold">{item.value}</span>
                        </div>
                    ))}
                </div>

                <div className="w-full flex gap-8 overflow-x-auto scrollbar-hide pb-10 border-b border-current/10 mb-10">
                    {weather.hourly.slice(selectedDayIndex * 24, (selectedDayIndex + 1) * 24).map((h, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 shrink-0">
                            <span className="text-[10px] font-bold opacity-40">{new Date(h.time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</span>
                            {getWeatherIcon(h.code, 32)}
                            <span className="font-bold">{Math.round(h.temp)}°</span>
                        </div>
                    ))}
                </div>

                <div className="w-full grid gap-6">
                    {weather.daily.map((d, i) => (
                        <div key={i} onClick={() => setSelectedDayIndex(i)} className={`flex items-center justify-between cursor-pointer py-3 transition-opacity ${selectedDayIndex === i ? 'opacity-100' : 'opacity-40'}`}>
                            <span className="font-bold w-20">{i === 0 ? "Today" : new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            {getWeatherIcon(d.code, 24)}
                            <span className="font-bold">{Math.round(d.temp_max)}° / {Math.round(d.temp_min)}°</span>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
