import { Canvas } from "@react-three/fiber";
import { Points, PointMaterial, Float } from "@react-three/drei";
import * as random from "maath/random";
import { useMemo } from "react";

interface Props {
  code?: number;
}

export default function VibrantBackground({ code }: Props) {
  const isRain = code && (code >= 51 && code <= 67 || code >= 80 && code <= 82);
  const isSnow = code && (code >= 71 && code <= 77 || code >= 85 && code <= 86);
  const isCloudy = code && (code >= 1 && code <= 3 || code >= 45 && code <= 48);

  const sphere = useMemo(() => {
    const count = isRain ? 5000 : isSnow ? 3000 : isCloudy ? 1000 : 500;
    return random.inSphere(new Float32Array(count * 3), { radius: 1.5 });
  }, [code]);

  return (
    <div className="fixed inset-0 -z-10 bg-slate-950 transition-colors duration-1000">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
          <Points positions={sphere as Float32Array} stride={3} frustumCulled={false}>
            <PointMaterial
              transparent
              color={isRain ? "#60a5fa" : isSnow ? "#f8fafc" : isCloudy ? "#94a3b8" : "#fbbf24"}
              size={isRain ? 0.02 : 0.03}
              sizeAttenuation={true}
              depthWrite={false}
            />
          </Points>
        </Float>
      </Canvas>
    </div>
  );
}
