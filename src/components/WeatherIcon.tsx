import Lottie from "lottie-react";
import { Cloud, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, MoonStar } from "lucide-react";
import clearDayAnim from "../../public/animations/clear-day.json";
import cloudyAnim from "../../public/animations/cloudy.json";
import partlyCloudyAnim from "../../public/animations/partly-cloudy-day.json";
import rainAnim from "../../public/animations/rain.json";
import snowAnim from "../../public/animations/snow.json";
import thunderAnim from "../../public/animations/thunder.json";

type WeatherCategory = "clear" | "partly-cloudy" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

function getWeatherCategory(code: number): WeatherCategory {
    if (code === 0) return "clear";
    if (code === 1 || code === 2) return "partly-cloudy";
    if (code === 3) return "cloudy";
    if (code === 45 || code === 48) return "fog";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if (code >= 95 && code <= 99) return "thunder";
    return "cloudy";
}

export function getWeatherIcon(code: number, size: number = 24, className: string = "", isDay: boolean = true) {
    const category = getWeatherCategory(code);
    const iconProps = { size, strokeWidth: 1.75 };

    if (!isDay) {
        const nightIcon =
            category === "clear" ? (
                <MoonStar {...iconProps} />
            ) : category === "partly-cloudy" ? (
                <CloudMoon {...iconProps} />
            ) : category === "cloudy" ? (
                <Cloud {...iconProps} />
            ) : category === "fog" ? (
                <CloudFog {...iconProps} />
            ) : category === "rain" ? (
                <CloudRain {...iconProps} />
            ) : category === "snow" ? (
                <CloudSnow {...iconProps} />
            ) : (
                <CloudLightning {...iconProps} />
            );

        return (
            <div style={{ width: size, height: size }} className={`flex items-center justify-center ${className}`}>
                {nightIcon}
            </div>
        );
    }

    const animation =
        category === "clear"
            ? clearDayAnim
            : category === "partly-cloudy"
              ? partlyCloudyAnim
              : category === "cloudy" || category === "fog"
                ? cloudyAnim
                : category === "rain"
                  ? rainAnim
                  : category === "snow"
                    ? snowAnim
                    : thunderAnim;

    return (
        <div style={{ width: size, height: size }} className={className}>
            <Lottie animationData={animation} loop />
        </div>
    );
}
