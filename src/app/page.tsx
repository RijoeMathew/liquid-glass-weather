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

interface BigDataCloudReverseResponse {
    city?: string;
    locality?: string;
    localityName?: string;
    countryName?: string;
    principalSubdivision?: string;
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

function buildResolvedLocation(
    latitude: number,
    longitude: number,
    details: {
        name?: string;
        admin1?: string;
        country?: string;
    }
): LocationOption {
    const resolvedName = details.name?.trim();
    const resolvedAdmin1 = details.admin1?.trim();
    const resolvedCountry = details.country?.trim();

    return {
        id: `current-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
        name: resolvedName || resolvedAdmin1 || resolvedCountry || "Current Location",
        latitude,
        longitude,
        admin1: resolvedAdmin1,
        country: resolvedCountry,
    };
}

function buildCurrentLocationPlaceholder(latitude: number, longitude: number): LocationOption {
    return {
        id: `current-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
        name: "Locating...",
        latitude,
        longitude,
    };
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
            const bigDataCloudRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (bigDataCloudRes.ok) {
                const data: BigDataCloudReverseResponse = await bigDataCloudRes.json();
                const resolvedLocation = buildResolvedLocation(latitude, longitude, {
                    name: data.city ?? data.locality ?? data.localityName,
                    admin1: data.principalSubdivision,
                    country: data.countryName,
                });

                if (resolvedLocation.name !== "Current Location") {
                    return resolvedLocation;
                }
            }
        } catch (error) {
            console.error("BigDataCloud reverse geocoding failed", error);
        }

        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=en`
            );
            const data: ReverseGeocodeResponse = await res.json();
            const address = data.address;
            return buildResolvedLocation(latitude, longitude, {
                name: address?.city ?? address?.town ?? address?.village ?? address?.municipality ?? address?.county,
                admin1: address?.state,
                country: address?.country,
            });
        } catch (error) {
            console.error("Reverse geocoding failed", error);
            return buildResolvedLocation(latitude, longitude, {});
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
            const pendingLocation = buildCurrentLocationPlaceholder(latitude, longitude);

            setSelectedDayIndex(0);
            setLocationSource("current");
            setSelectedLocation(pendingLocation);
            setLocationQuery(pendingLocation.name);
            setIsLocationMenuOpen(false);

            resolveCurrentLocation(latitude, longitude)
                .then((resolvedLocation) => {
                    setSelectedLocation((currentLocation) =>
                        currentLocation.id === pendingLocation.id ? resolvedLocation : currentLocation
                    );
                    setLocationQuery((currentQuery) =>
                        currentQuery === pendingLocation.name ? resolvedLocation.name : currentQuery
                    );
                })
                .catch((error) => {
                    console.error("Deferred current location resolution failed", error);
                });
        } catch (error) {
            console.error("Current location failed", error);
        } finally {
            setIsLocatingCurrent(false);
        }
    };

    useEffect(() => {
        if (isInitializingLocation) {
            return;
        }

        fetchWeather(selectedLocation);
    }, [selectedLocation.id, isInitializingLocation]);

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
                const pendingLocation = buildCurrentLocationPlaceholder(latitude, longitude);

                if (!isMounted) {
                    return;
                }

                setSelectedDayIndex(0);
                setLocationSource("current");
                setSelectedLocation(pendingLocation);
                setLocationQuery(pendingLocation.name);
                setIsInitializingLocation(false);

                resolveCurrentLocation(latitude, longitude)
                    .then((resolvedLocation) => {
                        if (!isMounted) {
                            return;
                        }

                        setSelectedLocation((currentLocation) =>
                            currentLocation.id === pendingLocation.id ? resolvedLocation : currentLocation
                        );
                        setLocationQuery((currentQuery) =>
                            currentQuery === pendingLocation.name ? resolvedLocation.name : currentQuery
                        );
                    })
                    .catch((error) => {
                        console.error("Deferred initial location resolution failed", error);
                    });
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

    const currentCode = weather
        ? (selectedDayIndex === 0 ? weather.current.code : weather.daily[selectedDayIndex]?.code ?? weather.current.code)
        : 0;
    const isDay = weather ? (selectedDayIndex === 0 ? weather.current.is_day === 1 : true) : true;

    useEffect(() => {
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
    }, [currentCode, isDay]);

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

    if (isInitializingLocation || !weather) {
        return (
            <main className="weather-shell relative isolate overflow-hidden text-white selection:bg-blue-500/30">
                <RealisticBackground code={2} isDay />

                <div className="weather-frame relative z-10 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 overflow-hidden"
                    >
                        <motion.div
                            animate={{ x: ["-14%", "10%", "-14%"], y: [0, -12, 0] }}
                            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute left-[-10%] top-[16%] h-36 w-72 rounded-full bg-white/20 blur-[42px]"
                        />
                        <motion.div
                            animate={{ x: ["12%", "-10%", "12%"], y: [0, 14, 0] }}
                            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                            className="absolute right-[-12%] top-[28%] h-40 w-80 rounded-full bg-white/16 blur-[48px]"
                        />
                        <motion.div
                            animate={{ x: ["-8%", "8%", "-8%"], y: [0, -10, 0] }}
                            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                            className="absolute left-[18%] bottom-[18%] h-28 w-60 rounded-full bg-sky-100/18 blur-[40px]"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="relative flex max-w-sm flex-col items-center px-8 text-center"
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0], scale: [1, 1.03, 1] }}
                            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                            className="mb-6"
                        >
                            {getWeatherIcon(2, 180, "", true)}
                        </motion.div>
                        <p className="text-[0.72rem] font-black uppercase tracking-[0.34em] text-white/78">
                            Syncing Atmosphere
                        </p>
                        <p className="mt-3 max-w-[18rem] text-sm font-bold tracking-[0.08em] text-white/92">
                            Pulling live conditions, forecast, and local sky details.
                        </p>
                    </motion.div>
                </div>
            </main>
        );
    }

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
    const currentHourOfDay = getHourFromTime(weather.current.time);
    const showSunscreen = (weather.current.uvIndex ?? 0) >= 3;
    const showWindbreaker = weather.current.windspeed >= 20;
    const locationEyebrow = locationSource === "current" ? "Current Location" : "Location";

    return (
        <main className={`weather-shell relative isolate overflow-hidden transition-colors duration-700 ease-out ${textColor} selection:bg-blue-500/30`}>
            <RealisticBackground code={currentCode} isDay={isDay} />

            <div className="weather-frame relative z-10 mx-auto flex max-w-[1600px] flex-col gap-2 sm:gap-4 lg:gap-4">
                <header className="grid gap-2 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <MapPin size={18} className="mt-4 shrink-0 sm:mt-6" />
                        <div className="min-w-0">
                            <div className={`text-[10px] font-black uppercase tracking-[0.32em] ${subTextColor}`}>{locationEyebrow}</div>
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
                        className="flex flex-col items-center justify-start gap-1 pt-0 pb-5 text-center sm:gap-2 sm:pb-5 lg:col-span-5 lg:self-start lg:pt-2 lg:pb-0"
                    >
                        <div className={`${themeTransitionClass} scale-[0.96] sm:scale-[1.18] lg:scale-[1.28]`}>
                            {getWeatherIcon(currentCode, 150, "", isDay)}
                        </div>
                        <div>
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
                        </div>
                    </motion.section>

                    <section className="flex flex-col gap-6 lg:col-span-7">
                        <div className={`mx-auto grid w-full max-w-[560px] grid-cols-3 gap-4 border-b pb-5 text-center lg:mx-0 lg:max-w-none ${borderClass}`}>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>Wind</span>
                                <div className="flex items-center justify-center gap-2">
                                    <p className="text-2xl font-black sm:text-3xl">
                                        {Math.round(weather.current.windspeed)}
                                        <span className="ml-1 text-xs opacity-40 uppercase">km/h</span>
                                    </p>
                                    {showWindbreaker && <Shield size={16} className="opacity-80" aria-label="Windbreaker recommended" />}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${subTextColor}`}>UV Index</span>
                                <div className="flex items-center justify-center gap-2">
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
                            <div ref={timelineScrollRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                <div aria-hidden="true" className="shrink-0" style={{ width: timelineSidePadding }} />
                                {timelineItems.map((hour, index) => {
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
