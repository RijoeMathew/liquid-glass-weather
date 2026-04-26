"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LoaderCircle, LocateFixed, MapPin, RefreshCw, Search, Shield, Sun } from "lucide-react";
import RealisticBackground from "../components/RealisticBackground";
import { getWeatherIcon } from "../components/WeatherIcon";

interface WeatherData {
    current: {
        time: string;
        temp: number;
        condition: string;
        code: number;
        is_day: number;
        windspeed: number;
        humidity: number;
        visibility: number;
        pressure: number;
        uvIndex: number | null;
    };
    hourly: Array<{ time: string; temp: number; code: number }>;
    daily: Array<{ date: string; temp_max: number; temp_min: number; condition: string; code: number }>;
}

interface LocationOption {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
}

interface GeocodingResponse {
    results?: Array<{
        id?: number;
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        admin1?: string;
    }>;
}

interface ReverseGeocodeResponse {
    address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        county?: string;
        state?: string;
        country?: string;
    };
}

const DEFAULT_LOCATION: LocationOption = {
    id: "toronto-ca-on",
    name: "Toronto",
    latitude: 43.6532,
    longitude: -79.3832,
    country: "Canada",
    admin1: "Ontario",
};

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

function getHourFromTime(timeStr: string): number {
    const timePart = timeStr.split("T")[1] ?? "00:00";
    return Number.parseInt(timePart.slice(0, 2), 10) || 0;
}

function formatTime(timeStr: string): string {
    const hour24 = getHourFromTime(timeStr);
    const suffix = hour24 >= 12 ? "PM" : "AM";
    const hour12 = hour24 % 12 || 12;
    return `${hour12} ${suffix}`;
}

function getTimelineStartIndex(hourly: WeatherData["hourly"], currentTime: string): number {
    const currentHourKey = currentTime.slice(0, 13);
    const currentIndex = hourly.findIndex((item) => item.time.slice(0, 13) === currentHourKey);
    if (currentIndex <= 0) {
        return 0;
    }
    return Math.max(0, currentIndex - 2);
}

function getLocationLabel(location: LocationOption): string {
    return [location.name, location.admin1, location.country].filter(Boolean).join(", ");
}

export default function WeatherApp() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [selectedLocation, setSelectedLocation] = useState<LocationOption>(DEFAULT_LOCATION);
    const [locationSource, setLocationSource] = useState<"current" | "manual">("manual");
    const [locationQuery, setLocationQuery] = useState(DEFAULT_LOCATION.name);
    const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
    const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
    const [isSearchingLocations, setIsSearchingLocations] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLocatingCurrent, setIsLocatingCurrent] = useState(false);
    const locationPanelRef = useRef<HTMLDivElement | null>(null);
    const timelineScrollRef = useRef<HTMLDivElement | null>(null);
    const currentTimelineItemRef = useRef<HTMLDivElement | null>(null);

    const fetchWeather = async (location: LocationOption) => {
        setIsRefreshing(true);
        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m,visibility,surface_pressure,uv_index&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
            );
            const data = await res.json();
            setWeather({
                current: {
                    time: data.current.time ?? data.hourly.time[0],
                    temp: data.current.temperature_2m,
                    condition: getWeatherDesc(data.current.weather_code),
                    code: data.current.weather_code,
                    is_day: data.current.is_day,
                    windspeed: data.current.wind_speed_10m,
                    humidity: data.current.relative_humidity_2m,
                    visibility: data.current.visibility / 1000,
                    pressure: data.current.surface_pressure,
                    uvIndex: typeof data.current.uv_index === "number" ? data.current.uv_index : null,
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
        } finally {
            setIsRefreshing(false);
        }
    };

    const resolveCurrentLocation = async (latitude: number, longitude: number): Promise<LocationOption> => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
            );
            const data: ReverseGeocodeResponse = await res.json();
            const address = data.address;
            return {
                id: `current-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
                name: address?.city ?? address?.town ?? address?.village ?? address?.municipality ?? address?.county ?? "Current Location",
                latitude,
                longitude,
                admin1: address?.state,
                country: address?.country,
            };
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            return {
                id: `current-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
                name: "Current Location",
                latitude,
                longitude,
            };
        }
    };

    const useCurrentLocation = async () => {
        if (!navigator.geolocation) {
            return;
        }

        setIsLocatingCurrent(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000,
                });
            });

            const currentLocation = await resolveCurrentLocation(
                position.coords.latitude,
                position.coords.longitude
            );

            setSelectedDayIndex(0);
            setLocationSource("current");
            setSelectedLocation(currentLocation);
            setLocationQuery(currentLocation.name);
            setIsLocationMenuOpen(false);
        } catch (error) {
            console.error("Current location failed", error);
        } finally {
            setIsLocatingCurrent(false);
        }
    };

    useEffect(() => {
        fetchWeather(selectedLocation);
    }, [selectedLocation]);

    useEffect(() => {
        useCurrentLocation();
    }, []);

    useEffect(() => {
        const handlePointerDown = (event: MouseEvent) => {
            if (locationPanelRef.current && !locationPanelRef.current.contains(event.target as Node)) {
                setIsLocationMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, []);

    useEffect(() => {
        if (!isLocationMenuOpen) {
            return;
        }

        const query = locationQuery.trim();
        if (query.length < 2) {
            setLocationOptions([]);
            setIsSearchingLocations(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = window.setTimeout(async () => {
            setIsSearchingLocations(true);
            try {
                const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`,
                    { signal: controller.signal }
                );
                const data: GeocodingResponse = await res.json();
                setLocationOptions(
                    (data.results ?? []).map((result) => ({
                        id: `${result.id ?? `${result.name}-${result.latitude}-${result.longitude}`}`,
                        name: result.name,
                        latitude: result.latitude,
                        longitude: result.longitude,
                        country: result.country,
                        admin1: result.admin1,
                    }))
                );
            } catch (error) {
                if (!(error instanceof DOMException && error.name === "AbortError")) {
                    console.error("Location search failed", error);
                }
            } finally {
                setIsSearchingLocations(false);
            }
        }, 250);

        return () => {
            controller.abort();
            window.clearTimeout(timeoutId);
        };
    }, [isLocationMenuOpen, locationQuery]);

    useEffect(() => {
        if (selectedDayIndex !== 0 || !timelineScrollRef.current || !currentTimelineItemRef.current) {
            return;
        }

        const container = timelineScrollRef.current;
        const currentItem = currentTimelineItemRef.current;
        const targetLeft = currentItem.offsetLeft - (container.clientWidth / 2) + (currentItem.clientWidth / 2);
        container.scrollTo({
            left: Math.max(0, targetLeft),
            behavior: "smooth",
        });
    }, [selectedDayIndex, weather?.current.time, selectedLocation.id]);

    if (!weather) {
        return <div className="h-screen flex items-center justify-center font-black tracking-widest text-slate-400 uppercase">Syncing Atmosphere...</div>;
    }

    const currentCode = selectedDayIndex === 0 ? weather.current.code : weather.daily[selectedDayIndex].code;
    const isDay = selectedDayIndex === 0 ? weather.current.is_day === 1 : true;
    const isLightBackground = isDay && (currentCode <= 3 || (currentCode >= 45 && currentCode <= 48));
    const textColor = isLightBackground ? "text-slate-950" : "text-white";
    const subTextColor = isLightBackground ? "text-slate-900/65" : "text-white/60";
    const borderClass = isLightBackground ? "border-black/10" : "border-white/12";
    const mutedPanelClass = isLightBackground ? "bg-white/20" : "bg-white/[0.05]";
    const menuClass = isLightBackground ? "bg-white/50 border-black/10" : "bg-slate-900/80 border-white/10";
    const inputClass = isLightBackground ? "bg-white/60 border-black/10 placeholder:text-slate-900/40" : "bg-black/20 border-white/10 placeholder:text-white/35";
    const hoverRowClass = isLightBackground ? "hover:bg-white/20" : "hover:bg-white/[0.05]";
    const themeTransitionClass = "transition-[background-color,border-color,color,opacity,transform] duration-700 ease-out";
    const timelineStartIndex = selectedDayIndex * 24;
    const timelineItems = weather.hourly.slice(timelineStartIndex, timelineStartIndex + 24);
    const showSunscreen = (weather.current.uvIndex ?? 0) >= 3;
    const showWindbreaker = weather.current.windspeed >= 20;
    const locationEyebrow = locationSource === "current" ? "Current Location" : "Location";

    return (
        <main className={`min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-6 transition-colors duration-700 ease-out ${textColor} selection:bg-blue-500/30`}>
            <RealisticBackground code={currentCode} isDay={isDay} />

            <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-[1600px] flex-col gap-3 sm:gap-4 lg:min-h-[calc(100dvh-3rem)] lg:gap-4">
                <header className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <MapPin size={18} className="mt-6 shrink-0 sm:mt-6" />
                        <div className="min-w-0">
                            <div className={`text-[10px] font-black uppercase tracking-[0.32em] ${subTextColor}`}>{locationEyebrow}</div>
                            <h1 className="mt-2 truncate text-[clamp(1.55rem,3vw,3.2rem)] font-black uppercase tracking-[0.08em] leading-none">
                                {selectedLocation.name}
                            </h1>
                            <p className={`mt-2 text-[11px] font-bold uppercase tracking-[0.18em] sm:text-xs ${subTextColor}`}>
                                {selectedLocation.admin1 ?? selectedLocation.country ?? ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 lg:justify-end">
                        <div ref={locationPanelRef} className="relative min-w-0 flex-1 sm:w-[320px] sm:flex-none">
                            <button
                                onClick={() => setIsLocationMenuOpen((open) => !open)}
                                className={`flex h-14 w-full items-center justify-between rounded-2xl border px-4 text-left backdrop-blur-md ${menuClass} ${themeTransitionClass}`}
                            >
                                <div className="min-w-0">
                                    <div className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>Choose Location</div>
                                    <div className="mt-1 truncate text-base font-black uppercase tracking-[0.08em]">
                                        {selectedLocation.name}
                                    </div>
                                </div>
                                <ChevronDown size={18} className={`shrink-0 transition-transform ${isLocationMenuOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isLocationMenuOpen && (
                                <div className={`absolute right-0 top-[calc(100%+0.75rem)] z-20 w-full rounded-[1.5rem] border p-3 backdrop-blur-xl ${menuClass}`}>
                                    <button
                                        onClick={useCurrentLocation}
                                        className={`mb-3 flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-left ${inputClass} ${themeTransitionClass}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isLocatingCurrent ? <LoaderCircle size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                                            <span className="text-xs font-black uppercase tracking-[0.16em]">Use Current Location</span>
                                        </div>
                                    </button>

                                    <div className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${inputClass} ${themeTransitionClass}`}>
                                        <Search size={16} className="shrink-0 opacity-60" />
                                        <input
                                            value={locationQuery}
                                            onChange={(event) => setLocationQuery(event.target.value)}
                                            placeholder="Search city, state, or country"
                                            className="w-full bg-transparent text-sm font-bold uppercase tracking-[0.12em] outline-none"
                                        />
                                        {isSearchingLocations && <LoaderCircle size={16} className="animate-spin shrink-0 opacity-60" />}
                                    </div>

                                    <div className="mt-3 max-h-72 overflow-y-auto scrollbar-hide">
                                        {locationOptions.length > 0 ? (
                                            <div className="space-y-2">
                                                {locationOptions.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => {
                                                            setSelectedDayIndex(0);
                                                            setLocationSource("manual");
                                                            setSelectedLocation(option);
                                                            setLocationQuery(option.name);
                                                            setIsLocationMenuOpen(false);
                                                        }}
                                                        className={`block w-full rounded-2xl border px-4 py-3 text-left ${inputClass} ${themeTransitionClass}`}
                                                    >
                                                        <div className="text-sm font-black uppercase tracking-[0.12em]">{option.name}</div>
                                                        <div className={`mt-1 text-[11px] font-bold uppercase tracking-[0.16em] ${subTextColor}`}>
                                                            {getLocationLabel(option)}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={`px-2 py-3 text-xs font-bold uppercase tracking-[0.16em] ${subTextColor}`}>
                                                {locationQuery.trim().length < 2 ? "Type at least 2 letters" : "No locations found"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => fetchWeather(selectedLocation)}
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-md ${menuClass} ${themeTransitionClass}`}
                            aria-label="Refresh weather"
                        >
                            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </header>

                <div className="grid flex-1 grid-cols-1 gap-3 pt-4 sm:pt-0 sm:gap-4 lg:grid-cols-12 lg:gap-8">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-col items-center justify-start gap-2 pt-0 pb-5 text-center sm:pb-5 lg:col-span-5 lg:self-start lg:pt-2 lg:pb-0"
                    >
                        <div className={`${themeTransitionClass} scale-110 sm:scale-[1.18] lg:scale-[1.28]`}>
                            {getWeatherIcon(currentCode, 150, "", isDay)}
                        </div>
                        <div>
                            <div className="text-[clamp(5.5rem,14vw,11rem)] font-black leading-[0.8] tracking-[-0.08em]">
                                {selectedDayIndex === 0 ? Math.round(weather.current.temp) : Math.round(weather.daily[selectedDayIndex].temp_max)}&deg;
                            </div>
                            <p className="text-[clamp(1.2rem,2.3vw,2.1rem)] font-black uppercase tracking-[0.12em] opacity-90">
                                {selectedDayIndex === 0 ? weather.current.condition : weather.daily[selectedDayIndex].condition}
                            </p>
                            <div className={`mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm font-bold uppercase tracking-[0.16em] sm:text-base ${subTextColor}`}>
                                <span>High {Math.round(weather.daily[selectedDayIndex].temp_max)}&deg;</span>
                                <span>Low {Math.round(weather.daily[selectedDayIndex].temp_min)}&deg;</span>
                            </div>
                        </div>
                    </motion.section>

                    <section className="flex flex-col gap-6 lg:col-span-7">
                        <div className={`grid grid-cols-3 gap-4 border-b pb-5 ${borderClass}`}>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>Wind</span>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-black sm:text-3xl">
                                        {Math.round(weather.current.windspeed)}
                                        <span className="ml-1 text-xs opacity-40 uppercase">km/h</span>
                                    </p>
                                    {showWindbreaker && <Shield size={16} className="opacity-80" aria-label="Windbreaker recommended" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>UV Index</span>
                                <div className="flex items-center gap-2">
                                    <p className="text-2xl font-black sm:text-3xl">
                                        {weather.current.uvIndex !== null ? weather.current.uvIndex.toFixed(1) : "--"}
                                    </p>
                                    {showSunscreen && <Sun size={16} className="opacity-80" aria-label="Sunscreen recommended" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>Humidity</span>
                                <p className="text-2xl font-black sm:text-3xl">{weather.current.humidity}<span className="ml-1 text-xs opacity-40 uppercase">%</span></p>
                            </div>
                        </div>

                        <div className={`border-b pb-6 ${borderClass}`}>
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>
                                    {selectedDayIndex === 0 ? "Timeline / Next 24H" : "Timeline / Day"}
                                </span>
                            </div>
                            <div ref={timelineScrollRef} className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {timelineItems.map((hour, index) => {
                                    const isCurrentHour = selectedDayIndex === 0 && hour.time.slice(0, 13) === weather.current.time.slice(0, 13);

                                    return (
                                        <div
                                            key={`${hour.time}-${index}`}
                                            ref={isCurrentHour ? currentTimelineItemRef : undefined}
                                            className={`flex min-w-[92px] shrink-0 flex-col items-center gap-3 rounded-[1.35rem] border px-3 py-4 ${themeTransitionClass} ${
                                                isCurrentHour
                                                    ? `border-current ${mutedPanelClass}`
                                                    : `${borderClass} ${mutedPanelClass}`
                                            }`}
                                        >
                                            {isCurrentHour && (
                                                <span className="rounded-full border border-current px-2 py-1 text-[9px] font-black uppercase tracking-[0.22em]">
                                                    Now
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${isCurrentHour ? "opacity-100" : subTextColor}`}>
                                                {formatTime(hour.time)}
                                            </span>
                                            {getWeatherIcon(hour.code, 44, "", getHourFromTime(hour.time) >= 6 && getHourFromTime(hour.time) < 18)}
                                            <span className="text-xl font-black sm:text-2xl">{Math.round(hour.temp)}&deg;</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <span className={`mb-4 block text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>7-Day Outlook</span>
                            <div className="grid gap-2">
                                {weather.daily.map((day, index) => (
                                    <button
                                        key={day.date}
                                        onClick={() => setSelectedDayIndex(index)}
                                        className={`flex items-center gap-3 rounded-[1.35rem] border px-4 py-3 text-left ${themeTransitionClass} ${
                                            selectedDayIndex === index
                                                ? `border-current ${mutedPanelClass}`
                                                : `${borderClass} bg-transparent ${hoverRowClass}`
                                        }`}
                                    >
                                        <span className="w-16 shrink-0 text-sm font-black uppercase tracking-[0.12em] sm:w-20 sm:text-base">
                                            {index === 0 ? "Today" : new Date(`${day.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
                                        </span>
                                        <div className="flex flex-1 items-center justify-center">
                                            {getWeatherIcon(day.code, 38, "", true)}
                                        </div>
                                        <div className="ml-auto flex shrink-0 gap-3 text-sm font-black sm:text-base">
                                            <span>{Math.round(day.temp_max)}&deg;</span>
                                            <span className="opacity-35">{Math.round(day.temp_min)}&deg;</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
