import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function NeuralNodes() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { positions, connections } = useMemo(() => {
    const nodeCount = 60;
    const pos: THREE.Vector3[] = [];
    for (let i = 0; i < nodeCount; i++) {
      pos.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        )
      );
    }

    const conns: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (pos[i].distanceTo(pos[j]) < 2.5) {
          conns.push(
            pos[i].x, pos[i].y, pos[i].z,
            pos[j].x, pos[j].y, pos[j].z
          );
        }
      }
    }

    return { positions: pos, connections: new Float32Array(conns) };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.1;
    }
  });

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(connections, 3));
    return geo;
  }, [connections]);

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04 + Math.random() * 0.03, 16, 16]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.6 + Math.random() * 0.4} />
        </mesh>
      ))}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#00e5ff" transparent opacity={0.12} />
      </lineSegments>
    </group>
  );
}

function GlowingSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshBasicMaterial color="#00e5ff" transparent opacity={0.03} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.06} />
      </mesh>
    </Float>
  );
}

export default function NeuralNetwork3D() {
  return (
    <div className="absolute inset-0 opacity-70">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <NeuralNodes />
        <GlowingSphere />
        <Sparkles count={80} scale={10} size={1.5} speed={0.3} color="#00e5ff" opacity={0.3} />
      </Canvas>
    </div>
  );
}
