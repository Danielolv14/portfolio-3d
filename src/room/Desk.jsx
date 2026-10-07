// Parede da mesa: painel de madeira, TV com light bar, mesa com gaveteiro, gabinete camuflado com RGB,
// monitor no braço com webcam, periféricos e a cadeira ergonômica. Tudo como nas fotos do setup.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import {
    calculatorTexture,
    camoTexture,
    caseBadgeTexture,
    caseStickersTexture,
    chromeEnvTexture,
    clockTexture,
    monitorScreenTexture,
    oakTexture,
    tvScreenTexture,
    walnutTexture
} from '../textures';
import { Chair } from './Chair';
import { Keyboard } from './Keyboard';
import { Mouse } from './Mouse';
import { Cable, chamferShape, Chrome, FacedBox, fittedShapeGeometry, ring, roundedRectShape, turned, useChrome } from './parts';
import { Box, C, Cyl, dayNight, Hotspot, lerp, MONITOR_POS, Rounded } from './shared';

const SILVER = { color: '#f2f3f5', roughness: 0.3, metalness: 0.55 };


// Extrusões com a borda levemente arredondada (moldura do gabinete e do relógio)
const BEZEL_EXTRUDE = { depth: 0.05, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2 };
const CLOCK_EXTRUDE = { depth: 0.05, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2 };

function Drawers({ walnut, chrome }) {
    const ys = [0.22, 0.6, 0.98, 1.36];
    return (
        <group>
            <Box size={[2.11, 1.56, 1.1]} position={[-3.805, 0.78, -1.0]} map={walnut} color="#ffffff" roughness={0.32} />
            {ys.map((y) => (
                <group key={y}>
                    <Box size={[0.03, 0.34, 1.02]} position={[-2.74, y, -1.0]} map={walnut} color="#f2e6dc" roughness={0.3} />
                    <Chrome material={chrome} args={[0.018, 0.018, 0.52, 12]} position={[-2.68, y + 0.05, -1.0]} rotation-x={Math.PI / 2} />
                    <Chrome material={chrome} size={[0.06, 0.03, 0.03]} position={[-2.71, y + 0.05, -1.22]} />
                    <Chrome material={chrome} size={[0.06, 0.03, 0.03]} position={[-2.71, y + 0.05, -0.78]} />
                </group>
            ))}
        </group>
    );
}

// Gabinete: moldura preta de cantos chanfrados, tela camuflada perfurada, fita de LED magenta no topo,
// emblemas prateados na frente e adesivos na lateral virada para a porta
function PC() {
    const camo = useMemo(() => camoTexture(), []);
    const logo = useMemo(() => caseBadgeTexture('logo'), []);
    const wings = useMemo(() => caseBadgeTexture('wings'), []);
    const stickers = useMemo(() => caseStickersTexture(), []);
    const shapes = useMemo(
        () => ({
            bezel: ring(chamferShape(0.62, 1.76, 0.1, 0.06), chamferShape(0.52, 1.58, 0.075, 0.045, 0.08)),
            panel: fittedShapeGeometry(chamferShape(0.53, 1.5, 0.07, 0.045, 0.075)),
            strip: new THREE.ShapeGeometry(
                new THREE.Shape([[-0.235, 1.588], [0.235, 1.588], [0.2, 1.624], [-0.2, 1.624]].map(([x, y]) => new THREE.Vector2(x, y)))
            )
        }),
        []
    );
    const strip = useRef();
    useFrame(() => {
        strip.current.emissiveIntensity = lerp(2.2, 5, dayNight.mix);
    });
    return (
        <group position={[-3.95, 1.56, -1.0]}>
            <Rounded size={[1.28, 1.76, 0.6]} radius={0.02} position={[-0.04, 0.88, 0]} color={C.black} roughness={0.5} />
            {/* grade de ventilação em cima */}
            <Box size={[1.1, 0.012, 0.46]} position={[-0.1, 1.762, 0]} color="#0f1012" roughness={0.85} />
            {/* frente (o eixo z deste grupo aponta para +x, para fora do gabinete) */}
            <group position={[0.6, 0.012, 0]} rotation-y={Math.PI / 2}>
                <mesh castShadow receiveShadow>
                    <extrudeGeometry args={[shapes.bezel, BEZEL_EXTRUDE]} />
                    <meshStandardMaterial color={C.black} roughness={0.45} />
                </mesh>
                <mesh geometry={shapes.panel} position-z={0.022} receiveShadow>
                    <meshStandardMaterial map={camo} roughness={0.55} metalness={0.05} />
                </mesh>
                <mesh geometry={shapes.strip} position-z={0.024}>
                    <meshStandardMaterial ref={strip} color="#2a0a24" emissive={C.magenta} emissiveIntensity={2.2} toneMapped={false} />
                </mesh>
                <mesh position={[-0.04, 1.33, 0.024]}>
                    <planeGeometry args={[0.13, 0.13]} />
                    <meshStandardMaterial map={logo} alphaTest={0.5} {...SILVER} />
                </mesh>
                <mesh position={[0, 0.33, 0.024]}>
                    <planeGeometry args={[0.38, 0.095]} />
                    <meshStandardMaterial map={wings} alphaTest={0.5} {...SILVER} />
                </mesh>
            </group>
            <mesh position={[0.36, 1.42, 0.303]}>
                <planeGeometry args={[0.44, 0.44]} />
                <meshStandardMaterial map={stickers} alphaTest={0.5} roughness={0.45} />
            </mesh>
        </group>
    );
}

// Monitor = Projetos. A tela tem nome (`screen-projects`): a câmera e a camada HTML
// (src/screens) acham a malha por ele para parar de frente e cobrir a tela certinho.
function Monitor({ t, onSelect, showLabels, active }) {
    const screenTex = useMemo(() => monitorScreenTexture(), []);
    const screen = useRef();
    useFrame(() => {
        screen.current.color.setScalar(lerp(0.85, 1.25, dayNight.mix));
    });
    // Desenha a janela no idioma atual. As fontes do site (Google Fonts) podem chegar
    // depois do primeiro desenho; quando chegam, desenha de novo com elas.
    useEffect(() => {
        let current = true;
        const redraw = () => current && screenTex.userData.redraw(t);
        redraw();
        document.fonts?.ready.then(redraw);
        return () => {
            current = false;
        };
    }, [screenTex, t]);
    return (
        <Hotspot
            id="projects"
            label={t.ui.nav.projects}
            onSelect={onSelect}
            showLabel={showLabels}
            active={active}
            labelPosition={[0.8, -0.85, 0.7]}
            position={MONITOR_POS}
            hit={{ size: [0.4, 1.5, 2.5], position: [0.1, 0, 0] }}
        >
            <Rounded size={[0.07, 1.32, 2.32]} radius={0.025} color={C.black} roughness={0.4} />
            <mesh name="screen-projects" position={[0.037, 0.02, 0]} rotation-y={Math.PI / 2}>
                <planeGeometry args={[2.22, 1.22]} />
                <meshBasicMaterial ref={screen} map={screenTex} toneMapped={false} />
            </mesh>
            {/* webcam */}
            <Rounded size={[0.12, 0.1, 0.28]} radius={0.03} position={[0.02, 0.71, 0]} color={C.black} roughness={0.4} />
            <Cyl args={[0.025, 0.025, 0.02, 16]} position={[0.085, 0.71, 0]} rotation-z={Math.PI / 2} color="#0d0e12" roughness={0.1} />
            {/* braço articulado preso na mesa */}
            <Cyl args={[0.04, 0.04, 0.81, 12]} position={[-0.38, -0.505, 0]} color={C.black} roughness={0.4} />
            <Cyl args={[0.035, 0.035, 0.36, 12]} position={[-0.2, -0.1, 0]} rotation-z={Math.PI / 2} color={C.black} roughness={0.4} />
            <Box size={[0.16, 0.08, 0.18]} position={[-0.38, -0.87, 0]} color={C.black} roughness={0.4} />
        </Hotspot>
    );
}

function TV({ t, onSelect, showLabels, active }) {
    const tex = useMemo(() => tvScreenTexture(), []);
    const screen = useRef();
    const bar = useRef();
    useFrame(() => {
        const m = dayNight.mix;
        screen.current.color.setScalar(lerp(0.7, 1.1, m));
        bar.current.emissiveIntensity = lerp(0, 3.5, m);
    });
    return (
        <Hotspot
            id="experience"
            label={t.ui.nav.experience}
            onSelect={onSelect}
            showLabel={showLabels}
            active={active}
            labelPosition={[0.3, 1.05, 0]}
            position={[-4.8, 4.14, -2.8]}
        >
            {/* um pouco menor, para deixar o vão entre a TV e o monitor como na foto */}
            <group scale={0.92}>
                <Rounded size={[0.09, 1.5, 2.6]} radius={0.02} color={C.black} roughness={0.35} />
                <mesh name="screen-experience" position={[0.047, 0.02, 0]} rotation-y={Math.PI / 2}>
                    <planeGeometry args={[2.5, 1.4]} />
                    <meshBasicMaterial ref={screen} map={tex} toneMapped={false} />
                </mesh>
                {/* light bar com o LED virado para baixo, presa no topo da TV pela presilha do meio */}
                <Box size={[0.17, 0.12, 0.14]} position={[0.025, 0.77, 0]} color={C.black} roughness={0.45} />
                <Rounded size={[0.16, 0.07, 1.9]} radius={0.03} position={[0.12, 0.8, 0]} color={C.black} roughness={0.4} />
                <mesh position={[0.17, 0.765, 0]} rotation-x={Math.PI / 2} rotation-z={Math.PI / 2}>
                    <planeGeometry args={[1.8, 0.05]} />
                    <meshStandardMaterial ref={bar} color="#ffffff" emissive="#f4f7ff" emissiveIntensity={0} toneMapped={false} />
                </mesh>
            </group>
        </Hotspot>
    );
}

// Relógio digital: moldura preta com a parte de baixo mais alta e o visor transparente.
// Mostra a hora, o dia da semana e a data de verdade.
function Clock() {
    const tex = useMemo(() => clockTexture(), []);
    const frame = useMemo(() => ring(roundedRectShape(0.48, 0.27, 0.014, 0, 0.135), roundedRectShape(0.41, 0.125, 0.004, 0, 0.1725)), []);
    useEffect(() => {
        const id = setInterval(() => tex.userData.redraw(), 20000);
        return () => clearInterval(id);
    }, [tex]);
    return (
        <group position={[-4.57, 1.586, -4.15]} rotation-z={0.1}>
            <group rotation-y={Math.PI / 2}>
                <mesh castShadow receiveShadow>
                    <extrudeGeometry args={[frame, CLOCK_EXTRUDE]} />
                    <meshStandardMaterial color="#1a1b1e" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.1725, 0.03]}>
                    <planeGeometry args={[0.41, 0.125]} />
                    <meshStandardMaterial map={tex} transparent depthWrite={false} roughness={0.15} />
                </mesh>
            </group>
        </group>
    );
}

// Fones intra-auriculares transparentes largados no caderninho, com o fio subindo até o topo do gabinete
const EARPHONE_WIRES = [
    [[-3.68, 1.648, -2.0], [-3.63, 1.63, -1.93], [-3.57, 1.572, -1.78], [-3.5, 1.567, -1.62]],
    [[-3.7, 1.648, -1.77], [-3.62, 1.625, -1.72], [-3.55, 1.567, -1.66], [-3.5, 1.567, -1.62]],
    [[-3.5, 1.567, -1.62], [-3.4, 1.567, -1.45], [-3.33, 1.6, -1.36], [-3.32, 2.4, -1.345], [-3.33, 3.3, -1.34], [-3.42, 3.345, -1.2]]
];

// Cabos pretos saindo de trás do monitor e indo para o gabinete
const MONITOR_CABLES = [
    [[-4.44, 2.2, -2.6], [-4.62, 1.8, -2.4], [-4.74, 1.575, -2.05], [-4.72, 1.575, -1.6], [-4.55, 1.7, -1.33]],
    [[-4.44, 2.05, -2.75], [-4.66, 1.7, -2.5], [-4.78, 1.575, -2.1], [-4.79, 1.575, -1.55], [-4.68, 1.8, -1.33]]
];

// Os 2 cabos da TV: saem de baixo dela e descem rentes ao painel até a mesa, por trás do monitor
const TV_CABLES = [
    [[-4.85, 3.45, -2.15], [-4.848, 3.26, -2.16], [-4.848, 3.05, -2.26], [-4.848, 2.75, -2.4], [-4.848, 2.2, -2.45], [-4.848, 1.6, -2.4]],
    [[-4.85, 3.45, -3.22], [-4.848, 3.24, -3.22], [-4.848, 3.0, -3.18], [-4.848, 2.6, -3.1], [-4.848, 2.1, -3.06], [-4.848, 1.6, -3.0]]
];

function Earphones() {
    return (
        <group>
            {[[-3.68, 1.648, -2.0, 0.5], [-3.7, 1.648, -1.77, -0.4]].map(([x, y, z, r]) => (
                <group key={z} position={[x, y, z]} rotation-y={r}>
                    <mesh scale={[0.05, 0.028, 0.038]} castShadow>
                        <sphereGeometry args={[1, 18, 12]} />
                        <meshStandardMaterial color="#e9eef0" roughness={0.12} transparent opacity={0.75} />
                    </mesh>
                    <Cyl args={[0.012, 0.014, 0.05, 10]} position={[0.035, 0, 0]} rotation-z={Math.PI / 2} color="#cfd6d8" roughness={0.2} />
                </group>
            ))}
            {EARPHONE_WIRES.map((points, i) => (
                <Cable key={i} points={points} radius={0.006} color="#e6e3dd" roughness={0.3} />
            ))}
        </group>
    );
}

function Peripherals() {
    const calc = useMemo(() => turned(calculatorTexture()), []);
    return (
        <group>
            {/* mousepad azul-marinho */}
            <Rounded size={[1.25, 0.02, 2.15]} radius={0.01} position={[-4.075, 1.57, -3.275]} color={C.navy} roughness={0.95} />
            <Keyboard />
            <Mouse />
            <Clock />
            {/* caderninho com a calculadora em cima */}
            <Rounded size={[0.64, 0.06, 0.46]} radius={0.02} position={[-3.95, 1.59, -1.85]} rotation-y={0.05} color={C.black} roughness={0.6} />
            <FacedBox size={[0.42, 0.03, 0.24]} position={[-3.95, 1.635, -1.84]} rotation-y={-0.08} faceIndex={2} faceMap={calc} color="#2c2e33" roughness={0.5} />
            <Earphones />
            {[...MONITOR_CABLES, ...TV_CABLES].map((points, i) => (
                <Cable key={i} points={points} />
            ))}
        </group>
    );
}

export default function DeskWall({ t, onSelect, showLabels, focus, screen, reducedMotion }) {
    const oak = useMemo(() => oakTexture(), []);
    const walnut = useMemo(() => walnutTexture(), []);
    const walnutTop = useMemo(() => turned(walnutTexture()), []);
    const chrome = useChrome();
    return (
        <group>
            {/* painel de madeira clara */}
            <Box size={[0.14, 4.9, 4.1]} position={[-4.93, 2.5, -2.8]} map={oak} color="#ffffff" roughness={0.6} />

            {/* tampo (o veio de cima segue o comprimento da mesa), lateral e gaveteiro */}
            <FacedBox size={[1.51, 0.1, 3.1]} position={[-4.105, 1.51, -3.0]} faceIndex={2} faceMap={walnutTop} map={walnut} color="#ffffff" roughness={0.3} />
            <Box size={[1.46, 1.46, 0.08]} position={[-4.13, 0.73, -4.51]} map={walnut} color="#ffffff" roughness={0.35} />
            <Drawers walnut={walnut} chrome={chrome} />

            <PC />
            <Monitor t={t} onSelect={onSelect} showLabels={showLabels} active={focus === 'projects'} />
            <TV t={t} onSelect={onSelect} showLabels={showLabels} active={focus === 'experience'} />
            <Peripherals />
            <Chair chrome={chrome} away={screen === 'projects'} instant={reducedMotion} />
        </group>
    );
}
