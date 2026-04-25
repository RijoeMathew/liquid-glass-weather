import Lottie from "lottie-react";
import clearDayAnim from "@meteocons/lottie/flat/clear-day.json";
import clearNightAnim from "@meteocons/lottie/flat/clear-night.json";
import fogDayAnim from "@meteocons/lottie/flat/fog-day.json";
import fogNightAnim from "@meteocons/lottie/flat/fog-night.json";
import mostlyClearDayAnim from "@meteocons/lottie/flat/mostly-clear-day.json";
import mostlyClearNightAnim from "@meteocons/lottie/flat/mostly-clear-night.json";
import overcastDayAnim from "@meteocons/lottie/flat/overcast-day.json";
import overcastNightAnim from "@meteocons/lottie/flat/overcast-night.json";
import overcastDayDrizzleAnim from "@meteocons/lottie/flat/overcast-day-drizzle.json";
import overcastNightDrizzleAnim from "@meteocons/lottie/flat/overcast-night-drizzle.json";
import overcastDayRainAnim from "@meteocons/lottie/flat/overcast-day-rain.json";
import overcastNightRainAnim from "@meteocons/lottie/flat/overcast-night-rain.json";
import overcastDaySnowAnim from "@meteocons/lottie/flat/overcast-day-snow.json";
import overcastNightSnowAnim from "@meteocons/lottie/flat/overcast-night-snow.json";
import partlyCloudyDayAnim from "@meteocons/lottie/flat/partly-cloudy-day.json";
import partlyCloudyNightAnim from "@meteocons/lottie/flat/partly-cloudy-night.json";
import thunderstormsOvercastDayAnim from "@meteocons/lottie/flat/thunderstorms-overcast-day.json";
import thunderstormsOvercastNightAnim from "@meteocons/lottie/flat/thunderstorms-overcast-night.json";
import thunderstormsOvercastDayHailAnim from "@meteocons/lottie/flat/thunderstorms-overcast-day-hail.json";
import thunderstormsOvercastNightHailAnim from "@meteocons/lottie/flat/thunderstorms-overcast-night-hail.json";

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

    return (
        <div style={{ width: size, height: size }} className={className}>
            <Lottie animationData={animation} loop />
        </div>
    );
}
