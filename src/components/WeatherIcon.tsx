import Lottie from "lottie-react";
import clearDayAnim from "../../public/animations/clear-day.json";
import cloudyAnim from "../../public/animations/cloudy.json";
import rainAnim from "../../public/animations/rain.json";
import snowAnim from "../../public/animations/snow.json";
import thunderAnim from "../../public/animations/thunder.json";

export function getWeatherIcon(code: number, size: number = 24, className: string = "", time?: string) {
    const animation = (code === 0) ? clearDayAnim :
                      (code >= 1 && code <= 3 || code >= 45 && code <= 48) ? cloudyAnim :
                      ((code >= 51 && code <= 55) || (code >= 56 && code <= 57) || (code >= 61 && code <= 65) || (code >= 66 && code <= 67) || (code >= 80 && code <= 82)) ? rainAnim :
                      (code >= 71 && code <= 77 || (code >= 85 && code <= 86)) ? snowAnim :
                      (code >= 95 && code <= 99) ? thunderAnim : cloudyAnim;

    return (
        <div style={{ width: size, height: size }} className={className}>
            <Lottie animationData={animation} loop={true} />
        </div>
    );
}
