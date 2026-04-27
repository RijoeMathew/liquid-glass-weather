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

interface ReverseGeocodingResponse {
    address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        hamlet?: string;
        suburb?: string;
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

const CURRENT_LOCATION_CACHE_KEY = "weather-current-location-cache";

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

function getThemeChromeColor(code: number, isDay: boolean): string {
    if (!isDay) {
        return "#1e293b";
    }

    if (code === 0) return "#38bdf8";
    if (code >= 1 && code <= 3) return "#94a3b8";
    if (code >= 45 && code <= 48) return "#cbd5e1";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "#475569";
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "#f8fafc";
    if (code >= 95) return "#334155";

    return "#38bdf8";
}

function getThemeChromeBackground(code: number, isDay: boolean): string {
    if (!isDay) {
        return "linear-gradient(180deg, #1e293b 0%, #020617 100%)";
    }

    if (code === 0) return "linear-gradient(180deg, #38bdf8 0%, #bae6fd 100%)";
    if (code >= 1 && code <= 3) return "linear-gradient(180deg, #94a3b8 0%, #cbd5e1 100%)";
    if (code >= 45 && code <= 48) return "linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%)";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        return "linear-gradient(180deg, #475569 0%, #94a3b8 100%)";
    }
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
        return "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)";
    }
    if (code >= 95) return "linear-gradient(180deg, #334155 0%, #475569 100%)";

    return "linear-gradient(180deg, #38bdf8 0%, #bae6fd 100%)";
}

function buildCurrentLocation(
    latitude: number,
    longitude: number,
    fallbackLocation: LocationOption = DEFAULT_LOCATION
): LocationOption {
    return {
        id: `current-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
        name: fallbackLocation.name,
        latitude,
        longitude,
        country: fallbackLocation.country,
        admin1: fallbackLocation.admin1,
    };
}

function getReverseLocationName(address?: ReverseGeocodingResponse["address"]): string | null {
    if (!address) {
        return null;
    }

    return (
        address.city ??
        address.town ??
        address.village ??
        address.municipality ??
        address.hamlet ??
        address.suburb ??
        address.county ??
        null
    );
}

function LoadingBlock({ className }: { className: string }) {
    return (
        <motion.div
            animate={{ opacity: [0.28, 0.58, 0.28] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className={`rounded-full bg-current/15 ${className}`}
        />
    );
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
    const [isInitializingLocation, setIsInitializingLocation] = useState(true);
    const [timelineSidePadding, setTimelineSidePadding] = useState(0);
    const locationPanelRef = useRef<HTMLDivElement | null>(null);
    const timelineScrollRef = useRef<HTMLDivElement | null>(null);
    const currentTimelineItemRef = useRef<HTMLDivElement | null>(null);
    const selectedTimelineItemRef = useRef<HTMLDivElement | null>(null);
    const hasCenteredTimelineRef = useRef(false);
    const weatherRequestRef = useRef(0);
    const hasWeatherLoadedRef = useRef(false);
    const selectedLocationRef = useRef(selectedLocation);
    const locationSourceRef = useRef(locationSource);
    const currentLocationLookupRef = useRef(0);
    const [currentLocationFallback, setCurrentLocationFallback] = useState<LocationOption>(DEFAULT_LOCATION);

    useEffect(() => {
        selectedLocationRef.current = selectedLocation;
    }, [selectedLocation]);

    useEffect(() => {
        locationSourceRef.current = locationSource;
    }, [locationSource]);

    useEffect(() => {
        try {
            const cachedValue = window.localStorage.getItem(CURRENT_LOCATION_CACHE_KEY);
            if (!cachedValue) {
                return;
            }

            const parsed = JSON.parse(cachedValue) as Partial<LocationOption>;
            if (
                typeof parsed.name === "string" &&
                typeof parsed.latitude === "number" &&
                typeof parsed.longitude === "number"
            ) {
                setCurrentLocationFallback({
                    id: typeof parsed.id === "string" ? parsed.id : "current-cached",
                    name: parsed.name,
                    latitude: parsed.latitude,
                    longitude: parsed.longitude,
                    country: parsed.country,
                    admin1: parsed.admin1,
                });
            }
        } catch (error) {
            console.error("Current location cache read failed", error);
        }
    }, []);

    const hydrateCurrentLocationDetails = async (location: LocationOption) => {
        const lookupId = currentLocationLookupRef.current + 1;
        currentLocationLookupRef.current = lookupId;

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 2500);

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=10&lat=${location.latitude}&lon=${location.longitude}`,
                {
                    signal: controller.signal,
                    headers: {
                        "Accept-Language": "en",
                    },
                }
            );

            if (!res.ok) {
                return;
            }

            const data = (await res.json()) as ReverseGeocodingResponse;
            const resolvedName = getReverseLocationName(data.address);
            if (!resolvedName) {
                return;
            }

            const resolvedLocation: LocationOption = {
                id: location.id,
                name: resolvedName,
                latitude: location.latitude,
                longitude: location.longitude,
                admin1: data.address?.state ?? location.admin1,
                country: data.address?.country ?? location.country,
            };

            if (lookupId !== currentLocationLookupRef.current) {
                return;
            }

            setCurrentLocationFallback(resolvedLocation);
            try {
                window.localStorage.setItem(CURRENT_LOCATION_CACHE_KEY, JSON.stringify(resolvedLocation));
            } catch (error) {
                console.error("Current location cache write failed", error);
            }

            if (
                selectedLocationRef.current.id === location.id &&
                locationSourceRef.current === "current"
            ) {
                setSelectedLocation(resolvedLocation);
                setLocationQuery(resolvedLocation.name);
            }
        } catch (error) {
            if (!(error instanceof DOMException && error.name === "AbortError")) {
                console.error("Current location reverse lookup failed", error);
            }
        } finally {
            window.clearTimeout(timeoutId);
        }
    };

    const fetchWeather = async (
        location: LocationOption,
        source: "current" | "manual",
        options?: { allowFallbackApply?: boolean }
    ) => {
        const requestId = weatherRequestRef.current + 1;
        weatherRequestRef.current = requestId;
        setIsRefreshing(true);
        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m,visibility,surface_pressure,uv_index&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
            );
            const data = await res.json();
            const isLatestRequest = requestId === weatherRequestRef.current;
            const canApplyDefaultFallback = options?.allowFallbackApply && !hasWeatherLoadedRef.current;

            if (!isLatestRequest && !canApplyDefaultFallback) {
                return;
            }

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
            hasWeatherLoadedRef.current = true;
            setSelectedDayIndex(0);
            setSelectedLocation(location);
            setLocationSource(source);
            setLocationQuery(location.name);
            if (source === "current") {
                void hydrateCurrentLocationDetails(location);
            }
        } catch (e) {
            console.error("Fetch failed", e);
        } finally {
            if (requestId === weatherRequestRef.current) {
                setIsRefreshing(false);
            }
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
                    timeout: 8000,
                    maximumAge: 300000,
                });
            });

            const { latitude, longitude } = position.coords;
            const currentLocation = buildCurrentLocation(latitude, longitude, currentLocationFallback);

            setIsLocationMenuOpen(false);
            void fetchWeather(currentLocation, "current");
        } catch (error) {
            console.error("Current location failed", error);
        } finally {
            setIsLocatingCurrent(false);
        }
    };

    useEffect(() => {
        void fetchWeather(DEFAULT_LOCATION, "manual", { allowFallbackApply: true });
    }, []);

    useEffect(() => {
        let isMounted = true;

        const initialiseLocation = async () => {
            if (!navigator.geolocation) {
                if (isMounted) {
                    setIsInitializingLocation(false);
                }
                return;
            }

            setIsLocatingCurrent(true);
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 8000,
                        maximumAge: 300000,
                    });
                });

                const { latitude, longitude } = position.coords;
                const currentLocation = buildCurrentLocation(latitude, longitude, currentLocationFallback);

                if (!isMounted) {
                    return;
                }

                void fetchWeather(currentLocation, "current");
                setIsInitializingLocation(false);
            } catch (error) {
                console.error("Initial current location failed", error);
            } finally {
                if (isMounted) {
                    setIsLocatingCurrent(false);
                    setIsInitializingLocation((initialising) => initialising ? false : initialising);
                }
            }
        };

        initialiseLocation();

        return () => {
            isMounted = false;
        };
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
        hasCenteredTimelineRef.current = false;
    }, [selectedLocation.id]);

    const fallbackHour = new Date().getHours();
    const fallbackIsDay = fallbackHour >= 6 && fallbackHour < 18;
    const currentCode = weather
        ? (selectedDayIndex === 0 ? weather.current.code : weather.daily[selectedDayIndex]?.code ?? weather.current.code)
        : fallbackIsDay ? 2 : 1;
    const isDay = weather ? (selectedDayIndex === 0 ? weather.current.is_day === 1 : true) : fallbackIsDay;
    const isContentLoading = !weather;
    const showSectionLoading = isRefreshing && !isContentLoading;

    useEffect(() => {
        if (!weather) {
            return;
        }

        const chromeColor = getThemeChromeColor(currentCode, isDay);
        const chromeBackground = getThemeChromeBackground(currentCode, isDay);

        document.documentElement.style.setProperty("--weather-chrome-color", chromeColor);
        document.documentElement.style.setProperty("--weather-chrome-background", chromeBackground);
        document.body.style.setProperty("--weather-chrome-color", chromeColor);
        document.body.style.setProperty("--weather-chrome-background", chromeBackground);
        document.documentElement.style.background = chromeBackground;
        document.documentElement.style.backgroundColor = chromeColor;
        document.body.style.background = chromeBackground;
        document.body.style.backgroundColor = chromeColor;

        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement("meta");
            themeColorMeta.setAttribute("name", "theme-color");
            document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.setAttribute("content", chromeColor);
    }, [weather, currentCode, isDay]);

    useEffect(() => {
        if (!timelineScrollRef.current) {
            return;
        }

        const container = timelineScrollRef.current;
        const updateSidePadding = () => {
            const sampleItem =
                currentTimelineItemRef.current ??
                container.querySelector<HTMLElement>("[data-timeline-card='true']");

            if (!sampleItem) {
                return;
            }

            setTimelineSidePadding(Math.max(0, (container.clientWidth - sampleItem.clientWidth) / 2));
        };

        updateSidePadding();

        const resizeObserver = new ResizeObserver(updateSidePadding);
        resizeObserver.observe(container);

        const sampleItem =
            currentTimelineItemRef.current ??
            container.querySelector<HTMLElement>("[data-timeline-card='true']");
        if (sampleItem) {
            resizeObserver.observe(sampleItem);
        }

        window.addEventListener("resize", updateSidePadding);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateSidePadding);
        };
    }, [selectedDayIndex, weather?.current.time, weather?.hourly.length]);

    useEffect(() => {
        if (!timelineScrollRef.current) {
            return;
        }

        const targetItem = selectedDayIndex === 0 ? currentTimelineItemRef.current : selectedTimelineItemRef.current;
        if (!targetItem) {
            return;
        }

        const centerTimeline = () => {
            targetItem.scrollIntoView({
                block: "nearest",
                inline: "center",
                behavior: selectedDayIndex === 0 && hasCenteredTimelineRef.current ? "smooth" : "auto",
            });
            if (selectedDayIndex === 0) {
                hasCenteredTimelineRef.current = true;
            }
        };

        const frameId = window.requestAnimationFrame(centerTimeline);
        return () => window.cancelAnimationFrame(frameId);
    }, [selectedDayIndex, weather?.current.time, selectedLocation.id, timelineSidePadding]);

    const isLightBackground = isDay && (currentCode <= 3 || (currentCode >= 45 && currentCode <= 48));
    const textColor = isLightBackground ? "text-slate-950" : "text-white";
    const subTextColor = isLightBackground ? "text-slate-900/65" : "text-white/60";
    const borderClass = isLightBackground ? "border-black/10" : "border-white/12";
    const mutedPanelClass = isLightBackground ? "bg-white/20" : "bg-white/[0.05]";
    const menuClass = isLightBackground ? "bg-white/50 border-black/10" : "bg-slate-900/80 border-white/10";
    const inputClass = isLightBackground ? "bg-white/60 border-black/10 placeholder:text-slate-900/40" : "bg-black/20 border-white/10 placeholder:text-white/35";
    const hoverRowClass = isLightBackground ? "hover:bg-white/20" : "hover:bg-white/[0.05]";
    const themeTransitionClass = "transition-[background-color,border-color,color,opacity,transform] duration-700 ease-out";
    const timelineStartIndex = weather ? selectedDayIndex * 24 : 0;
    const timelineItems = weather ? weather.hourly.slice(timelineStartIndex, timelineStartIndex + 24) : [];
    const currentHourOfDay = weather ? getHourFromTime(weather.current.time) : 12;
    const showSunscreen = weather ? (weather.current.uvIndex ?? 0) >= 3 : false;
    const showWindbreaker = weather ? weather.current.windspeed >= 20 : false;
    const locationEyebrow = "Location";
    const timelineSkeletonItems = Array.from({ length: 6 }, (_, index) => index);
    const dailySkeletonItems = Array.from({ length: 7 }, (_, index) => index);

    return (
        <main className={`weather-shell relative isolate overflow-hidden transition-colors duration-700 ease-out ${textColor} selection:bg-blue-500/30`}>
            <RealisticBackground code={currentCode} isDay={isDay} />

            <div className="weather-frame relative z-10 mx-auto flex max-w-[1600px] flex-col gap-2 sm:gap-4 lg:gap-4">
                <header className="grid gap-2 pt-[calc(var(--safe-top)+0.35rem)] sm:gap-4 sm:pt-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <MapPin size={18} className="mt-4 shrink-0 sm:mt-6" />
                        <div className="min-w-0">
                            <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] ${subTextColor}`}>
                                <span>{locationEyebrow}</span>
                                {(isInitializingLocation || isLocatingCurrent) && (
                                    <LoaderCircle size={12} className="animate-spin opacity-70" aria-label="Finding current location" />
                                )}
                            </div>
                            <h1 className="mt-1 truncate text-[clamp(1.55rem,3vw,3.2rem)] font-black uppercase tracking-[0.08em] leading-none">
                                {selectedLocation.name}
                            </h1>
                            <p className={`mt-1 text-[11px] font-bold uppercase tracking-[0.18em] sm:mt-2 sm:text-xs ${subTextColor}`}>
                                {selectedLocation.admin1 ?? selectedLocation.country ?? ""}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 lg:justify-end">
                        <div ref={locationPanelRef} className="relative min-w-0 flex-1 sm:w-[320px] sm:flex-none">
                            <button
                                onClick={() => setIsLocationMenuOpen((open) => !open)}
                                className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-left backdrop-blur-md sm:h-14 ${menuClass} ${themeTransitionClass}`}
                            >
                                <div className="min-w-0">
                                    <div className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>Choose Location</div>
                                    <div className="truncate text-base font-black uppercase tracking-[0.08em] sm:mt-1">
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
                                                            setLocationQuery(option.name);
                                                            setIsLocationMenuOpen(false);
                                                            void fetchWeather(option, "manual");
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
                            onClick={() => void fetchWeather(selectedLocation, locationSource)}
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-md sm:h-14 sm:w-14 ${menuClass} ${themeTransitionClass}`}
                            aria-label="Refresh weather"
                        >
                            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                        </button>
                    </div>
                </header>

                <div className="grid flex-1 grid-cols-1 gap-3 pt-1 sm:pt-0 sm:gap-4 lg:grid-cols-12 lg:gap-8">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex flex-col items-center justify-start gap-1 pt-0 pb-5 text-center sm:gap-2 sm:pb-5 lg:col-span-5 lg:self-start lg:pt-2 lg:pb-0 ${showSectionLoading ? "animate-pulse" : ""}`}
                    >
                        {isContentLoading ? (
                            <LoadingBlock className="h-[118px] w-[118px] rounded-[2rem] sm:h-[150px] sm:w-[150px]" />
                        ) : (
                            <div className={`${themeTransitionClass} scale-[0.96] sm:scale-[1.18] lg:scale-[1.28]`}>
                                {getWeatherIcon(currentCode, 150, "", isDay)}
                            </div>
                        )}
                        <div>
                            {isContentLoading ? (
                                <div className="flex flex-col items-center">
                                    <LoadingBlock className="h-24 w-48 sm:h-28 sm:w-56" />
                                    <LoadingBlock className="mt-4 h-8 w-44" />
                                    <div className="mt-4 flex gap-4">
                                        <LoadingBlock className="h-5 w-24" />
                                        <LoadingBlock className="h-5 w-24" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="text-[clamp(4.75rem,13vw,11rem)] font-black leading-[0.78] tracking-[-0.08em] sm:text-[clamp(5.5rem,14vw,11rem)]">
                                        {selectedDayIndex === 0 ? Math.round(weather.current.temp) : Math.round(weather.daily[selectedDayIndex].temp_max)}&deg;
                                    </div>
                                    <p className="text-[clamp(1.2rem,2.3vw,2.1rem)] font-black uppercase tracking-[0.12em] opacity-90">
                                        {selectedDayIndex === 0 ? weather.current.condition : weather.daily[selectedDayIndex].condition}
                                    </p>
                                    <div className={`mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm font-bold uppercase tracking-[0.16em] sm:mt-3 sm:gap-y-2 sm:text-base ${subTextColor}`}>
                                        <span>High {Math.round(weather.daily[selectedDayIndex].temp_max)}&deg;</span>
                                        <span>Low {Math.round(weather.daily[selectedDayIndex].temp_min)}&deg;</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.section>

                    <section className="flex flex-col gap-6 lg:col-span-7">
                        <div className={`mx-auto grid w-full max-w-[560px] grid-cols-3 gap-4 border-b pb-5 text-center lg:mx-0 lg:max-w-none ${borderClass} ${showSectionLoading ? "animate-pulse" : ""}`}>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>Wind</span>
                                <div className="flex items-center justify-center gap-2">
                                    {isContentLoading ? (
                                        <LoadingBlock className="h-10 w-24" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-black sm:text-3xl">
                                                {Math.round(weather.current.windspeed)}
                                                <span className="ml-1 text-xs opacity-40 uppercase">km/h</span>
                                            </p>
                                            {showWindbreaker && <Shield size={16} className="opacity-80" aria-label="Windbreaker recommended" />}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>UV Index</span>
                                <div className="flex items-center justify-center gap-2">
                                    {isContentLoading ? (
                                        <LoadingBlock className="h-10 w-20" />
                                    ) : (
                                        <>
                                            <p className="text-2xl font-black sm:text-3xl">
                                                {weather.current.uvIndex !== null ? weather.current.uvIndex.toFixed(1) : "--"}
                                            </p>
                                            {showSunscreen && <Sun size={16} className="opacity-80" aria-label="Sunscreen recommended" />}
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>Humidity</span>
                                {isContentLoading ? (
                                    <div className="flex justify-center">
                                        <LoadingBlock className="h-10 w-20" />
                                    </div>
                                ) : (
                                    <p className="text-2xl font-black sm:text-3xl">{weather.current.humidity}<span className="ml-1 text-xs opacity-40 uppercase">%</span></p>
                                )}
                            </div>
                        </div>

                        <div className={`border-b pb-6 ${borderClass} ${showSectionLoading ? "animate-pulse" : ""}`}>
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>
                                    {selectedDayIndex === 0 ? "Timeline / Next 24H" : "Timeline / Day"}
                                </span>
                            </div>
                            <div ref={timelineScrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                <div aria-hidden="true" className="shrink-0" style={{ width: timelineSidePadding }} />
                                {isContentLoading
                                    ? timelineSkeletonItems.map((index) => (
                                        <div
                                            key={`timeline-loading-${index}`}
                                            data-timeline-card="true"
                                            className={`flex min-w-[92px] shrink-0 snap-center flex-col items-center gap-3 rounded-[1.35rem] border px-3 py-4 ${borderClass} ${mutedPanelClass}`}
                                        >
                                            <span className="h-[26px]" aria-hidden="true" />
                                            <LoadingBlock className="h-4 w-12" />
                                            <LoadingBlock className="h-10 w-10 rounded-[1rem]" />
                                            <LoadingBlock className="h-7 w-12" />
                                        </div>
                                    ))
                                    : timelineItems.map((hour, index) => {
                                        const isCurrentHour = selectedDayIndex === 0 && hour.time.slice(0, 13) === weather.current.time.slice(0, 13);
                                        const isSelectedDayHour = selectedDayIndex !== 0 && getHourFromTime(hour.time) === currentHourOfDay;

                                        return (
                                            <div
                                                key={`${hour.time}-${index}`}
                                                ref={
                                                    isCurrentHour
                                                        ? currentTimelineItemRef
                                                        : isSelectedDayHour
                                                            ? selectedTimelineItemRef
                                                            : undefined
                                                }
                                                data-timeline-card="true"
                                                className={`flex min-w-[92px] shrink-0 snap-center flex-col items-center gap-3 rounded-[1.35rem] border px-3 py-4 ${themeTransitionClass} ${
                                                    isCurrentHour
                                                        ? `border-current ${mutedPanelClass}`
                                                        : `${borderClass} ${mutedPanelClass}`
                                                }`}
                                            >
                                                <span
                                                    className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.22em] ${
                                                        isCurrentHour
                                                            ? "border-current opacity-100"
                                                            : "border-transparent opacity-0"
                                                    }`}
                                                >
                                                    Now
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${isCurrentHour ? "opacity-100" : subTextColor}`}>
                                                    {formatTime(hour.time)}
                                                </span>
                                                {getWeatherIcon(hour.code, 44, "", getHourFromTime(hour.time) >= 6 && getHourFromTime(hour.time) < 18)}
                                                <span className="text-xl font-black sm:text-2xl">{Math.round(hour.temp)}&deg;</span>
                                            </div>
                                        );
                                    })}
                                <div aria-hidden="true" className="shrink-0" style={{ width: timelineSidePadding }} />
                            </div>
                        </div>

                        <div>
                            <span className={`mb-4 block text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>7-Day Outlook</span>
                            <div className="grid gap-2">
                                {isContentLoading
                                    ? dailySkeletonItems.map((index) => (
                                        <div
                                            key={`day-loading-${index}`}
                                            className={`flex items-center gap-3 rounded-[1.35rem] border px-4 py-3 ${borderClass} ${mutedPanelClass}`}
                                        >
                                            <LoadingBlock className="h-5 w-16 sm:w-20" />
                                            <div className="flex flex-1 justify-center">
                                                <LoadingBlock className="h-9 w-9 rounded-[1rem]" />
                                            </div>
                                            <div className="ml-auto flex gap-3">
                                                <LoadingBlock className="h-5 w-10" />
                                                <LoadingBlock className="h-5 w-10" />
                                            </div>
                                        </div>
                                    ))
                                    : weather.daily.map((day, index) => (
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
