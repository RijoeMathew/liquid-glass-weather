import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float } from "@react-three/drei";
import { useRef } from "react";

interface Props {
  code?: number;
}

const getColors = (code?: number) => {
  if (code === 0) return { color: "#3b82f6", speed: 2, distort: 0.4 }; // Clear: Blue
  if (code && code <= 3) return { color: "#94a3b8", speed: 1, distort: 0.3 }; // Cloudy: Gray
  if (code && code <= 55) return { color: "#1e3a8a", speed: 4, distort: 0.6 }; // Rain: Dark Blue
  if (code && code <= 77) return { color: "#e0f2fe", speed: 0.5, distort: 0.2 }; // Snow: Light Blue/White
  if (code && code <= 99) return { color: "#7c3aed", speed: 6, distort: 0.8 }; // Thunder: Purple
  return { color: "#3b82f6", speed: 2, distort: 0.4 };
};

export default function VibrantBackground({ code }: Props) {
  const config = getColors(code);

  return (
    <div className="fixed inset-0 -z-10 bg-slate-950 transition-colors duration-1000">
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
          <Sphere args={[1, 64, 64]} scale={2}>
            <MeshDistortMaterial
              color={config.color}
              attach="material"
              distort={config.distort}
              speed={config.speed}
              roughness={0.2}
            />
          </Sphere>
        </Float>
      </Canvas>
    </div>
  );
}
