// O quarto 3D: paredes, móveis, luzes e os objetos clicáveis.
// Tudo é montado com formas simples (caixas, cilindros, esferas), sem modelos externos.
import { Html, RoundedBox, useCursor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import {
    codeScreenTexture,
    corkTexture,
    floorTexture,
    globeTexture,
    neonTexture,
    phoneScreenTexture,
    portraitTexture
} from './textures';

const WALL_H = 5.6;

// Valor de 0 (dia) a 1 (noite), animado aos poucos pelas luzes
const dayNight = { mix: 0 };

const lerp = THREE.MathUtils.lerp;

const COLORS = {
    floorSide: '#8a5a3b',
    wallLeft: '#ece3d4',
    wallBack: '#8fbfae',
    trim: '#f7f3ec',
    deskTop: '#d8b48a',
    metal: '#2b2f36',
    white: '#f1efe9',
    teal: '#2f6f62',
    coral: '#d4674f',
    mustard: '#e3a43a',
    cream: '#f2dfb5',
    wood: '#c08a5a'
};

function Box({ size, color, ...props }) {
    return (
        <mesh castShadow receiveShadow {...props}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
    );
}

function Rounded({ size, radius = 0.05, color, ...props }) {
    return (
        <RoundedBox args={size} radius={radius} smoothness={3} castShadow receiveShadow {...props}>
            <meshStandardMaterial color={color} roughness={0.75} />
        </RoundedBox>
    );
}

function Cyl({ args, color, ...props }) {
    return (
        <mesh castShadow receiveShadow {...props}>
            <cylinderGeometry args={args} />
            <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
    );
}

// Objeto clicável: cresce um pouco no hover e mostra uma etiqueta com o nome da seção
function Hotspot({ id, label, onSelect, showLabel, labelPosition, children, ...props }) {
    const ref = useRef();
    const [hover, setHover] = useState(false);
    useCursor(hover);

    useFrame((_, dt) => {
        const s = THREE.MathUtils.damp(ref.current.scale.x, hover ? 1.05 : 1, 12, dt);
        ref.current.scale.setScalar(s);
    });

    return (
        <group
            ref={ref}
            {...props}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHover(true);
            }}
            onPointerOut={() => setHover(false)}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
            }}
        >
            {children}
            {showLabel && (
                <Html position={labelPosition} center zIndexRange={[20, 0]}>
                    <button
                        type="button"
                        className={`tag${hover ? ' is-hover' : ''}`}
                        onClick={() => onSelect(id)}
                        onPointerEnter={() => setHover(true)}
                        onPointerLeave={() => setHover(false)}
                    >
                        <span className="tag-dot" aria-hidden="true" />
                        {label}
                    </button>
                </Html>
            )}
        </group>
    );
}

function Lights({ night }) {
    const hemi = useRef();
    const sun = useRef();
    const lamp = useRef();
    const screen = useRef();
    const neon = useRef();
    const daySun = useMemo(() => new THREE.Color('#fff1dc'), []);
    const moon = useMemo(() => new THREE.Color('#9db4ff'), []);

    useFrame((_, dt) => {
        dayNight.mix = THREE.MathUtils.damp(dayNight.mix, night ? 1 : 0, 3, dt);
        const m = dayNight.mix;
        hemi.current.intensity = lerp(1.25, 0.35, m);
        sun.current.intensity = lerp(2.6, 0.45, m);
        sun.current.color.lerpColors(daySun, moon, m);
        lamp.current.intensity = lerp(0, 26, m);
        screen.current.intensity = lerp(0, 4, m);
        neon.current.intensity = lerp(0, 3, m);
    });

    return (
        <>
            <hemisphereLight ref={hemi} args={['#fff8ee', '#8a6a52', 1.2]} />
            <directionalLight
                ref={sun}
                position={[7, 12, 8]}
                castShadow
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0005}
                shadow-normalBias={0.02}
                shadow-camera-left={-9}
                shadow-camera-right={9}
                shadow-camera-top={9}
                shadow-camera-bottom={-9}
            />
            <pointLight ref={lamp} position={[4.45, 2.9, -4.3]} color="#ffc070" distance={14} decay={1.6} />
            <pointLight ref={screen} position={[-2.2, 2.7, -3.6]} color="#7fb0ff" distance={6} decay={1.8} />
            <pointLight ref={neon} position={[-2.2, 4.0, -4.5]} color="#5ef2d6" distance={5} decay={1.8} />
        </>
    );
}

// Parede do fundo numa peça só, com o vão da janela recortado.
// (Montada com 4 caixas encostadas, a face escondida na emenda aparecia como uma linha clara à noite.)
function BackWall() {
    const geometry = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-5.15, 0);
        shape.lineTo(5.3, 0);
        shape.lineTo(5.3, WALL_H);
        shape.lineTo(-5.15, WALL_H);
        shape.closePath();
        const hole = new THREE.Path();
        hole.moveTo(1.2, 2);
        hole.lineTo(1.2, 4);
        hole.lineTo(3.6, 4);
        hole.lineTo(3.6, 2);
        hole.closePath();
        shape.holes.push(hole);
        return new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
    }, []);
    return (
        <mesh geometry={geometry} position={[0, 0, -5.3]} castShadow receiveShadow>
            <meshStandardMaterial color={COLORS.wallBack} roughness={0.8} />
        </mesh>
    );
}

function Shell() {
    const planks = useMemo(() => floorTexture(), []);
    return (
        <group>
            <RoundedBox args={[10.6, 0.4, 10.6]} radius={0.06} position={[0, -0.2, 0]} receiveShadow>
                <meshStandardMaterial color={COLORS.floorSide} roughness={0.9} />
            </RoundedBox>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} receiveShadow>
                <planeGeometry args={[10.6, 10.6]} />
                <meshStandardMaterial map={planks} roughness={0.85} />
            </mesh>

            <Box size={[0.3, WALL_H, 10.6]} position={[-5.15, WALL_H / 2, 0]} color={COLORS.wallLeft} />
            <BackWall />

            <Box size={[10.3, 0.18, 0.06]} position={[0.15, 0.09, -4.97]} color={COLORS.trim} />
            <Box size={[0.06, 0.18, 10.3]} position={[-4.97, 0.09, 0.15]} color={COLORS.trim} />
        </group>
    );
}

function Window() {
    const sky = useRef();
    const disc = useRef();
    const stars = useRef();
    const daySky = useMemo(() => new THREE.Color('#9fd3f0'), []);
    const nightSky = useMemo(() => new THREE.Color('#14223f'), []);
    const sunColor = useMemo(() => new THREE.Color('#ffe9a3'), []);
    const moonColor = useMemo(() => new THREE.Color('#eef2ff'), []);
    const starPositions = useMemo(() => {
        const arr = [];
        for (let i = 0; i < 24; i++) {
            arr.push(1.3 + Math.random() * 2.2, 2.15 + Math.random() * 1.7, -5.33);
        }
        return new Float32Array(arr);
    }, []);

    useFrame(() => {
        const m = dayNight.mix;
        sky.current.color.lerpColors(daySky, nightSky, m);
        disc.current.color.lerpColors(sunColor, moonColor, m);
        stars.current.opacity = m;
    });

    const frame = '#f7f3ec';
    // O céu é um plano logo atrás do vão da janela: só aparece através dela
    return (
        <group>
            <mesh position={[2.4, 3, -5.36]}>
                <planeGeometry args={[2.7, 2.3]} />
                <meshBasicMaterial ref={sky} toneMapped={false} />
            </mesh>
            <mesh position={[3.0, 3.45, -5.34]}>
                <circleGeometry args={[0.26, 32]} />
                <meshBasicMaterial ref={disc} toneMapped={false} />
            </mesh>
            <points>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
                </bufferGeometry>
                <pointsMaterial ref={stars} size={0.04} color="#ffffff" transparent opacity={0} />
            </points>

            <Box size={[2.6, 0.12, 0.2]} position={[2.4, 4.0, -4.98]} color={frame} />
            <Box size={[2.6, 0.12, 0.2]} position={[2.4, 2.0, -4.98]} color={frame} />
            <Box size={[0.12, 2.1, 0.2]} position={[1.15, 3.0, -4.98]} color={frame} />
            <Box size={[0.12, 2.1, 0.2]} position={[3.65, 3.0, -4.98]} color={frame} />
            <Box size={[0.07, 2.0, 0.1]} position={[2.4, 3.0, -5.1]} color={frame} />
            <Box size={[2.9, 0.1, 0.4]} position={[2.4, 1.92, -4.86]} color={frame} />
        </group>
    );
}

function Desk({ t, onSelect, showLabels }) {
    const screenTex = useMemo(() => codeScreenTexture(), []);
    const neonTex = useMemo(() => neonTexture(), []);
    const screen = useRef();
    const neon = useRef();

    useFrame(() => {
        const m = dayNight.mix;
        screen.current.color.setScalar(lerp(0.75, 1.1, m));
        neon.current.opacity = lerp(0.35, 1, m);
    });

    return (
        <group>
            <Rounded size={[3.8, 0.12, 1.4]} radius={0.04} position={[-2.0, 1.5, -4.2]} color={COLORS.deskTop} />
            <Box size={[0.08, 1.44, 0.08]} position={[-3.8, 0.72, -4.8]} color={COLORS.metal} />
            <Box size={[0.08, 1.44, 0.08]} position={[-3.8, 0.72, -3.6]} color={COLORS.metal} />
            <Rounded size={[0.9, 1.44, 1.2]} radius={0.03} position={[-0.6, 0.72, -4.2]} color={COLORS.white} />
            <Box size={[0.7, 0.02, 0.02]} position={[-0.6, 1.05, -3.59]} color={COLORS.metal} />
            <Box size={[0.7, 0.02, 0.02]} position={[-0.6, 0.6, -3.59]} color={COLORS.metal} />

            <Cyl args={[0.11, 0.1, 0.24, 20]} position={[-0.95, 1.68, -3.85]} color={COLORS.coral} />
            <Box size={[0.5, 0.09, 0.7]} position={[-3.35, 1.61, -4.5]} color={COLORS.teal} />
            <Box size={[0.45, 0.08, 0.65]} position={[-3.35, 1.7, -4.5]} color={COLORS.mustard} />

            <Hotspot
                id="projects"
                label={t.ui.nav.projects}
                onSelect={onSelect}
                showLabel={showLabels}
                labelPosition={[0, 2.1, 0]}
                position={[-2.2, 1.56, -4.45]}
            >
                <Box size={[0.6, 0.04, 0.35]} position={[0, 0.02, 0]} color={COLORS.metal} />
                <Box size={[0.08, 0.55, 0.06]} position={[0, 0.3, -0.05]} color={COLORS.metal} />
                <Rounded size={[2.1, 1.25, 0.08]} radius={0.03} position={[0, 1.15, 0]} color="#1b1f26" />
                <mesh position={[0, 1.15, 0.045]}>
                    <planeGeometry args={[1.98, 1.13]} />
                    <meshBasicMaterial ref={screen} map={screenTex} toneMapped={false} />
                </mesh>
                <Rounded size={[1.3, 0.05, 0.42]} radius={0.02} position={[0, 0.03, 0.75]} color="#e6e8ec" />
                <Rounded size={[0.14, 0.05, 0.22]} radius={0.02} position={[0.95, 0.03, 0.75]} color="#e6e8ec" />
            </Hotspot>

            <mesh position={[-2.2, 4.15, -4.98]}>
                <planeGeometry args={[1.4, 0.7]} />
                <meshBasicMaterial ref={neon} map={neonTex} transparent toneMapped={false} />
            </mesh>

            <group position={[-2.0, 0, -3.0]} rotation-y={0.25}>
                <Cyl args={[0.45, 0.45, 0.06, 24]} position={[0, 0.08, 0]} color={COLORS.metal} />
                <Cyl args={[0.05, 0.05, 0.7, 12]} position={[0, 0.45, 0]} color={COLORS.metal} />
                <Rounded size={[0.95, 0.16, 0.85]} radius={0.06} position={[0, 0.88, 0]} color={COLORS.teal} />
                <Rounded size={[0.95, 1.05, 0.14]} radius={0.06} position={[0, 1.5, 0.42]} color={COLORS.teal} />
            </group>
        </group>
    );
}

const NOTES = [
    { y: -0.5, z: -1.0, w: 0.45, h: 0.45, color: '#ffe27a', rot: -0.1 },
    { y: -0.55, z: -0.35, w: 0.45, h: 0.45, color: '#ffb3a7', rot: 0.12 },
    { y: -0.5, z: 0.45, w: 0.45, h: 0.45, color: '#9fe0c9', rot: -0.06 },
    { y: -0.45, z: 1.1, w: 0.7, h: 0.45, color: '#ffffff', rot: 0.05 }
];

const POLAROIDS = [
    { y: 0.35, z: -0.95, rot: 0.08, color: '#7cc7ff' },
    { y: 0.42, z: 0.05, rot: -0.05, color: '#f0b44c' },
    { y: 0.3, z: 1.0, rot: 0.06, color: '#5ef2d6' }
];

function LeftWall({ t, onSelect, showLabels, compact }) {
    const cork = useMemo(() => corkTexture(), []);
    const portrait = useMemo(() => portraitTexture(), []);
    const globe = useMemo(() => globeTexture(), []);
    const globeRef = useRef();

    useFrame((_, dt) => {
        globeRef.current.rotation.y += dt * 0.35;
    });

    return (
        <group>
            <Hotspot
                id="experience"
                label={t.ui.nav.experience}
                onSelect={onSelect}
                showLabel={showLabels}
                labelPosition={[0.3, 1.4, 0]}
                position={[-4.96, 3.2, 0.2]}
            >
                <Box size={[0.08, 2.1, 3.1]} color="#7a4f33" />
                <mesh position={[0.03, 0, 0]} receiveShadow>
                    <boxGeometry args={[0.06, 1.9, 2.9]} />
                    <meshStandardMaterial map={cork} roughness={0.95} />
                </mesh>
                {NOTES.map((n, i) => (
                    <Box
                        key={i}
                        size={[0.02, n.h, n.w]}
                        position={[0.075, n.y, n.z]}
                        rotation-x={n.rot}
                        color={n.color}
                    />
                ))}
                {POLAROIDS.map((p, i) => (
                    <group key={i} position={[0.075, p.y, p.z]} rotation-x={p.rot}>
                        <Box size={[0.02, 0.62, 0.52]} color="#ffffff" />
                        <Box size={[0.025, 0.42, 0.42]} position={[0.003, 0.06, 0]} color={p.color} />
                        <mesh position={[0.03, 0.27, 0]}>
                            <sphereGeometry args={[0.035, 12, 12]} />
                            <meshStandardMaterial color={COLORS.coral} />
                        </mesh>
                    </group>
                ))}
            </Hotspot>

            <Hotspot
                id="about"
                label={t.ui.nav.about}
                onSelect={onSelect}
                showLabel={showLabels}
                labelPosition={[0.9, 1.05, -0.4]}
                position={[-4.96, 3.35, 3.4]}
            >
                <Box size={[0.08, 1.5, 1.2]} color={COLORS.metal} />
                <Box size={[0.09, 1.34, 1.04]} color={COLORS.trim} />
                <mesh position={[0.05, 0, 0]} rotation-y={Math.PI / 2}>
                    <planeGeometry args={[0.88, 1.1]} />
                    <meshStandardMaterial map={portrait} roughness={0.6} />
                </mesh>
            </Hotspot>

            <Rounded size={[0.8, 1.4, 2.0]} radius={0.03} position={[-4.58, 0.7, 3.3]} color={COLORS.wood} />
            <Box size={[0.04, 0.5, 0.82]} position={[-4.17, 0.98, 2.82]} color="#7d5634" />
            <Box size={[0.04, 0.5, 0.82]} position={[-4.17, 0.98, 3.78]} color="#7d5634" />
            <Box size={[0.04, 0.5, 0.82]} position={[-4.17, 0.38, 2.82]} color="#7d5634" />
            <Box size={[0.04, 0.5, 0.82]} position={[-4.17, 0.38, 3.78]} color="#7d5634" />
            <Box size={[0.4, 0.55, 0.12]} position={[-4.6, 1.68, 2.55]} color={COLORS.coral} />
            <Box size={[0.4, 0.48, 0.12]} position={[-4.6, 1.64, 2.7]} color={COLORS.teal} />
            <Box size={[0.4, 0.6, 0.12]} position={[-4.6, 1.7, 2.85]} color={COLORS.mustard} />

            <Hotspot
                id="lang"
                label={t.ui.globe}
                onSelect={onSelect}
                showLabel={showLabels && !compact}
                labelPosition={[0, 1.2, 0]}
                position={[-4.55, 1.4, 3.85]}
            >
                <Cyl args={[0.2, 0.22, 0.06, 24]} position={[0, 0.03, 0]} color={COLORS.metal} />
                <Cyl args={[0.025, 0.025, 0.3, 8]} position={[0, 0.2, 0]} color={COLORS.metal} />
                <group position={[0, 0.62, 0]} rotation-z={0.4}>
                    <mesh ref={globeRef} castShadow>
                        <sphereGeometry args={[0.32, 32, 24]} />
                        <meshStandardMaterial map={globe} roughness={0.6} />
                    </mesh>
                </group>
            </Hotspot>
        </group>
    );
}

function Plant() {
    const leaves = [0, 1, 2, 3, 4, 5, 6];
    return (
        <group position={[-4.4, 0, -4.4]}>
            <Cyl args={[0.34, 0.26, 0.62, 20]} position={[0, 0.31, 0]} color={COLORS.coral} />
            {leaves.map((i) => {
                const angle = (i / leaves.length) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        castShadow
                        position={[Math.cos(angle) * 0.18, 1.05 + (i % 3) * 0.12, Math.sin(angle) * 0.18]}
                        rotation={[Math.sin(angle) * 0.5, -angle, Math.cos(angle) * 0.5]}
                        scale={[0.16, 0.62, 0.05]}
                    >
                        <sphereGeometry args={[1, 16, 12]} />
                        <meshStandardMaterial color={i % 2 ? '#3f8f5a' : '#57a96f'} roughness={0.7} />
                    </mesh>
                );
            })}
        </group>
    );
}

function Lamp({ t, night, onSelect, showLabels, compact }) {
    const shade = useRef();
    const bulb = useRef();
    useFrame(() => {
        const m = dayNight.mix;
        shade.current.emissiveIntensity = lerp(0.05, 1.4, m);
        bulb.current.emissiveIntensity = lerp(0.2, 3, m);
    });
    return (
        <Hotspot
            id="lamp"
            label={night ? t.ui.toDay : t.ui.toNight}
            onSelect={onSelect}
            showLabel={showLabels && !compact}
            labelPosition={[0, 3.75, 0]}
            position={[4.45, 0, -4.3]}
        >
            <Cyl args={[0.32, 0.34, 0.06, 24]} position={[0, 0.03, 0]} color={COLORS.metal} />
            <Cyl args={[0.04, 0.04, 3, 10]} position={[0, 1.53, 0]} color={COLORS.metal} />
            <mesh position={[0, 3.12, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.5, 0.56, 28, 1, true]} />
                <meshStandardMaterial
                    ref={shade}
                    color="#f3e3c3"
                    emissive="#ffc070"
                    side={THREE.DoubleSide}
                    roughness={0.6}
                />
            </mesh>
            <mesh position={[0, 2.98, 0]}>
                <sphereGeometry args={[0.11, 16, 12]} />
                <meshStandardMaterial ref={bulb} color="#fff4dd" emissive="#ffd18a" />
            </mesh>
        </Hotspot>
    );
}

function Lounge({ t, onSelect, showLabels }) {
    const phoneTex = useMemo(() => phoneScreenTexture(), []);
    return (
        <group>
            <Cyl args={[2.1, 2.1, 0.03, 48]} position={[1.6, 0.015, 1.4]} color={COLORS.mustard} />
            <Cyl args={[1.6, 1.6, 0.032, 48]} position={[1.6, 0.017, 1.4]} color={COLORS.cream} />
            <Cyl args={[0.9, 0.9, 0.034, 48]} position={[1.6, 0.019, 1.4]} color={COLORS.mustard} />

            <mesh position={[3.5, 0.5, 2.7]} scale={[1, 0.62, 1]} castShadow receiveShadow>
                <sphereGeometry args={[0.85, 32, 24]} />
                <meshStandardMaterial color={COLORS.coral} roughness={0.85} />
            </mesh>

            <Hotspot
                id="contact"
                label={t.ui.nav.contact}
                onSelect={onSelect}
                showLabel={showLabels}
                labelPosition={[0, 2.2, 0]}
                position={[1.4, 0, 1.0]}
            >
                <Cyl args={[0.3, 0.32, 0.04, 24]} position={[0, 0.02, 0]} color={COLORS.metal} />
                <Cyl args={[0.05, 0.05, 0.95, 10]} position={[0, 0.5, 0]} color={COLORS.metal} />
                <Cyl args={[0.56, 0.56, 0.06, 32]} position={[0, 0.98, 0]} color={COLORS.white} />
                <group position={[0, 1.05, 0]} rotation-y={Math.PI / 4}>
                    <Box size={[0.3, 0.05, 0.2]} position={[0, 0.02, 0.05]} color={COLORS.metal} />
                    <group position={[0, 0.42, 0]} rotation-x={-0.22}>
                        <Rounded size={[0.44, 0.84, 0.05]} radius={0.04} color="#22262e" />
                        <mesh position={[0, 0, 0.027]}>
                            <planeGeometry args={[0.39, 0.78]} />
                            <meshBasicMaterial map={phoneTex} toneMapped={false} />
                        </mesh>
                    </group>
                </group>
                {/* Área de clique maior que o celular, para facilitar no touch */}
                <mesh position={[0, 1.2, 0]}>
                    <boxGeometry args={[1.2, 1.2, 1.2]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            </Hotspot>
        </group>
    );
}

export default function Room({ t, night, onSelect, showLabels, compact, onBackgroundClick }) {
    return (
        <group onClick={onBackgroundClick}>
            <Lights night={night} />
            <Shell />
            <Window />
            <Desk t={t} onSelect={onSelect} showLabels={showLabels} />
            <LeftWall t={t} onSelect={onSelect} showLabels={showLabels} compact={compact} />
            <Plant />
            <Lamp t={t} night={night} onSelect={onSelect} showLabels={showLabels} compact={compact} />
            <Lounge t={t} onSelect={onSelect} showLabels={showLabels} />
        </group>
    );
}
