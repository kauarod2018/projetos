import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import React, { useEffect } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import "./fontes";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Aponta a câmera para o centro da arena (o padrão do three.js olha reto para frente). */
const MirarCamera: React.FC<{ alvo: [number, number, number] }> = ({ alvo }) => {
  const camera = useThree((estado) => estado.camera);
  useEffect(() => {
    camera.lookAt(...alvo);
    camera.updateProjectionMatrix();
  }, [camera, alvo]);
  return null;
};

const ALVO: [number, number, number] = [0, 1, 0];

/** Demo 3D: a mesma arena em three.js, com a câmera girando em volta (tudo guiado pelo frame). */
export const Arena3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const giro = interpolate(frame, [0, durationInFrames], [-0.6, 0.9], { easing: Easing.inOut(Easing.cubic) });
  const pulo = Math.max(0, Math.sin(frame / 6)) * 0.35;
  const brilho = 1.5 + Math.sin(frame / 4) * 0.6;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #11142A, #3B1624)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 5, 8.3], fov: 52 }}>
        <MirarCamera alvo={ALVO} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 6]} intensity={1.6} />
        <pointLight position={[1.8, 2.2, 1]} intensity={brilho * 8} color="#FF7A1A" distance={10} />

        <group rotation={[0, giro, 0]}>
          {/* chão da arena */}
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[9.5, 9.9, 0.5, 64]} />
            <meshStandardMaterial color="#6B4428" />
          </mesh>
          {/* pilares em volta */}
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 9, 1, Math.sin(a) * 9]}>
                <boxGeometry args={[0.8, 2.4, 0.8]} />
                <meshStandardMaterial color="#2A2F55" />
              </mesh>
            );
          })}
          {/* você */}
          <mesh position={[-1.8, 1.1 + pulo * 0.3, 0]}>
            <capsuleGeometry args={[0.7, 1, 8, 24]} />
            <meshStandardMaterial color="#3A86FF" />
          </mesh>
          {/* lutador de fogo */}
          <mesh position={[1.8, 1.1 + pulo, 0]}>
            <capsuleGeometry args={[0.7, 1, 8, 24]} />
            <meshStandardMaterial color="#FF6B1A" emissive="#FF3D00" emissiveIntensity={brilho * 0.4} />
          </mesh>
        </group>
      </ThreeCanvas>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 180 }}>
        <div
          style={{
            fontFamily: "Anton, Impact, sans-serif",
            fontSize: 110,
            color: "white",
            WebkitTextStroke: "12px #0B0D17",
            paintOrder: "stroke fill",
            opacity: interpolate(frame, [0, 15], [0, 1], CLAMP),
          }}
        >
          A ARENA EM 3D
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
