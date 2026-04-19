import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, Float } from "@react-three/drei";
import * as random from "maath/random";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Props {
  code?: number;
}

function ParticleSystem({ code }: Props) {
  const points = useRef<THREE.Points>(null!);
  const { mouse, viewport } = useThree();

  const isRain = code && (code >= 51 && code <= 67 || code >= 80 && code <= 82);
  const isSnow = code && (code >= 71 && code <= 77 || code >= 85 && code <= 86);
  const isCloudy = code && (code >= 1 && code <= 3 || code >= 45 && code <= 48);

  const sphere = useMemo(() => {
    const count = isRain ? 2000 : isSnow ? 1500 : isCloudy ? 800 : 400;
    return random.inSphere(new Float32Array(count * 3), { radius: 1.5 });
  }, [code]);

  useFrame((state) => {
    // Interactive mouse movement
    points.current.rotation.x = THREE.MathUtils.lerp(points.current.rotation.x, mouse.y * 0.2, 0.1);
    points.current.rotation.y = THREE.MathUtils.lerp(points.current.rotation.y, mouse.x * 0.2, 0.1);
  });

  return (
    <Points ref={points} positions={sphere as Float32Array} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        opacity={0.3}
        color={isRain ? "#60a5fa" : isSnow ? "#f8fafc" : isCloudy ? "#94a3b8" : "#fbbf24"}
        size={isRain ? 0.015 : 0.02}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
}

export default function VibrantBackground({ code }: Props) {
  return (
    <div className="fixed inset-0 -z-10 bg-slate-950">
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-slate-950/80" />
      
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
          <ParticleSystem code={code} />
        </Float>
      </Canvas>
    </div>
  );
}
