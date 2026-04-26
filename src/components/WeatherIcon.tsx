import Lottie from "lottie-react";
import clearDayAnim from "@meteocons/lottie/fill/clear-day.json";
import clearNightAnim from "@meteocons/lottie/fill/clear-night.json";
import fogDayAnim from "@meteocons/lottie/fill/fog-day.json";
import fogNightAnim from "@meteocons/lottie/fill/fog-night.json";
import mostlyClearDayAnim from "@meteocons/lottie/fill/mostly-clear-day.json";
import mostlyClearNightAnim from "@meteocons/lottie/fill/mostly-clear-night.json";
import overcastDayAnim from "@meteocons/lottie/fill/overcast-day.json";
import overcastNightAnim from "@meteocons/lottie/fill/overcast-night.json";
import overcastDayDrizzleAnim from "@meteocons/lottie/fill/overcast-day-drizzle.json";
import overcastNightDrizzleAnim from "@meteocons/lottie/fill/overcast-night-drizzle.json";
import overcastDayRainAnim from "@meteocons/lottie/fill/overcast-day-rain.json";
import overcastNightRainAnim from "@meteocons/lottie/fill/overcast-night-rain.json";
import overcastDaySnowAnim from "@meteocons/lottie/fill/overcast-day-snow.json";
import overcastNightSnowAnim from "@meteocons/lottie/fill/overcast-night-snow.json";
import partlyCloudyDayAnim from "@meteocons/lottie/fill/partly-cloudy-day.json";
import partlyCloudyNightAnim from "@meteocons/lottie/fill/partly-cloudy-night.json";
import thunderstormsOvercastDayAnim from "@meteocons/lottie/fill/thunderstorms-overcast-day.json";
import thunderstormsOvercastNightAnim from "@meteocons/lottie/fill/thunderstorms-overcast-night.json";
import thunderstormsOvercastDayHailAnim from "@meteocons/lottie/fill/thunderstorms-overcast-day-hail.json";
import thunderstormsOvercastNightHailAnim from "@meteocons/lottie/fill/thunderstorms-overcast-night-hail.json";

type WeatherAnimation = Record<string, unknown>;

function getWeatherAnimation(code: number, isDay: boolean): WeatherAnimation {
    switch (code) {
        case 0:
            return isDay ? clearDayAnim : clearNightAnim;
        case 1:
            return isDay ? mostlyClearDayAnim : mostlyClearNightAnim;
        case 2:
            return isDay ? partlyCloudyDayAnim : partlyCloudyNightAnim;
        case 3:
            return isDay ? overcastDayAnim : overcastNightAnim;
        case 45:
        case 48:
            return isDay ? fogDayAnim : fogNightAnim;
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
            return isDay ? overcastDayDrizzleAnim : overcastNightDrizzleAnim;
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
        case 80:
        case 81:
        case 82:
            return isDay ? overcastDayRainAnim : overcastNightRainAnim;
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
            return isDay ? overcastDaySnowAnim : overcastNightSnowAnim;
        case 96:
        case 99:
            return isDay ? thunderstormsOvercastDayHailAnim : thunderstormsOvercastNightHailAnim;
        case 95:
            return isDay ? thunderstormsOvercastDayAnim : thunderstormsOvercastNightAnim;
        default:
            return isDay ? overcastDayAnim : overcastNightAnim;
    }
}

export function getWeatherIcon(code: number, size: number = 24, className: string = "", isDay: boolean = true) {
    const animation = getWeatherAnimation(code, isDay);
    const inset = Math.max(2, Math.round(size * 0.08));

    return (
        <div style={{ width: size, height: size, overflow: "visible" }} className={className}>
            <div style={{ width: "100%", height: "100%", padding: inset }}>
                <Lottie
                    animationData={animation}
                    loop
                    renderer={"canvas" as any}
                    rendererSettings={{ preserveAspectRatio: "xMidYMid meet", clearCanvas: true } as any}
                    style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
                />
            </div>
        </div>
    );
}
