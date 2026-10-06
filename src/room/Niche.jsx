// O nicho branco ao lado da porta (como o do armário do Daniel), de cima para baixo:
// garrafinha, patinho e moto; luminária "&", JBL e robô de cerâmica; troféu, chaves,
// porta-retrato com a foto dele e o Stormtrooper; e as pelúcias amontoadas na base.
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import fontJson from 'three/examples/fonts/helvetiker_bold.typeface.json';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

import foto from '../assets/foto.jpg';
import { camoTexture } from '../textures';
import { Box, C, Cyl, dayNight, Hotspot, lerp, Rounded } from './shared';
import { stripesTexture, trooperFaceTexture, trophyPrintTexture } from './wallTextures';

// Caixa do nicho: x da parede até a frente, z de uma lateral à outra
const X0 = -5.0;
const X1 = -4.24;
const Z0 = 2.3;
const Z1 = 4.95;
const SIDE = 0.06;
const BOARD = 0.11;
// Superfície de cada nível: base e as três prateleiras; o tampo fica em cima
const LEVELS = [0.25, 1.6, 2.85, 4.1];
const TAMPO = 4.75;
const BACK = '#f6dfc4';
// Fita de borda de madeira clara na frente das tábuas, como no móvel das fotos
const EDGE = { color: '#b8936c', roughness: 0.6 };
const EDGE_T = 0.012;
const EDGE_H = 0.02;
// Raio das quinas das tábuas: pequeno, para a fita encostar rente
const EDGE_R = 0.015;

const CHROME = { color: C.chrome, roughness: 0.2, metalness: 0.9 };

// Objeto virado para o quarto (+x), com um leve giro para a câmera da visão geral
function Item({ turn = 0.3, children, ...props }) {
    return (
        <group rotation-y={Math.PI / 2 - turn} {...props}>
            {children}
        </group>
    );
}

// Bolinha de pelúcia (ou de plástico, com roughness menor)
function Blob({ r, color, roughness = 0.95, ...props }) {
    return (
        <mesh castShadow receiveShadow {...props}>
            <sphereGeometry args={[r, 20, 16]} />
            <meshStandardMaterial color={color} roughness={roughness} />
        </mesh>
    );
}

// Olho de pelúcia: branco com a pupila preta (de frente para +z)
function Eye({ r = 0.05, ...props }) {
    return (
        <group {...props}>
            <Blob r={r} scale={[1, 1, 0.6]} color="#ffffff" roughness={0.6} />
            <Blob r={r * 0.45} position={[0, -r * 0.1, r * 0.5]} color="#111" roughness={0.4} />
        </group>
    );
}

// Filete de fita de borda na frente de uma peça: `front` é o x da face da frente; ele entra
// um pouco na peça (`back`) para cobrir a quina arredondada
function Edge({ front, back = EDGE_R, height, length, y, z }) {
    const d = EDGE_T + back;
    return <Box size={[d, height, length]} position={[front + EDGE_T - d / 2, y, z]} shadow={false} {...EDGE} />;
}

// Tábua grossa: um filete em cima e outro embaixo da frente, com o branco no meio
function BoardEdges({ front, top, length, z }) {
    return [top - EDGE_H / 2, top - BOARD + EDGE_H / 2].map((y) => <Edge key={y} front={front} height={EDGE_H} length={length} y={y} z={z} />);
}

function Frame() {
    const depth = X1 - X0;
    const cx = (X0 + X1) / 2;
    const cz = (Z0 + Z1) / 2;
    const inner = Z1 - Z0 - SIDE * 2;
    const sideH = TAMPO - BOARD / 2;
    const plinth = LEVELS[0] - BOARD;
    return (
        <group>
            {/* fundo pintado em tom claro; sem receber sombra, para ficar claro como na foto */}
            <mesh position={[X0 + 0.01, sideH / 2, cz]}>
                <boxGeometry args={[0.02, sideH, Z1 - Z0]} />
                <meshStandardMaterial color={BACK} roughness={0.95} />
            </mesh>
            {/* laterais, base recuada, prateleiras grossas e o tampo: brancos, com fita de borda de madeira na frente */}
            {[Z0 + SIDE / 2, Z1 - SIDE / 2].map((z) => (
                <group key={z}>
                    <Rounded size={[depth, sideH, SIDE]} radius={0.02} position={[cx, sideH / 2, z]} color={C.shelf} roughness={0.6} />
                    <Edge front={X1} back={0.02} height={sideH} length={SIDE} y={sideH / 2} z={z} />
                </group>
            ))}
            <Box size={[depth - 0.08, plinth, inner]} position={[cx - 0.04, plinth / 2, cz]} color="#e2dcd2" roughness={0.7} />
            {LEVELS.map((y) => (
                <group key={y}>
                    <Rounded size={[depth, BOARD, inner]} radius={EDGE_R} position={[cx, y - BOARD / 2, cz]} color={C.shelf} roughness={0.55} />
                    <BoardEdges front={X1} top={y} length={inner} z={cz} />
                </group>
            ))}
            <Rounded size={[depth + 0.04, BOARD, Z1 - Z0 + 0.04]} radius={EDGE_R} position={[cx + 0.02, TAMPO, cz]} color={C.shelf} roughness={0.55} />
            <BoardEdges front={X1 + 0.04} top={TAMPO + BOARD / 2} length={Z1 - Z0 + 0.04} z={cz} />
        </group>
    );
}

// Ponto dentro de um polígono (raio cruzando as arestas)
function inside(p, poly) {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const a = poly[i];
        const b = poly[j];
        if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
    }
    return hit;
}

const AMP_SIZE = 0.82;
const AMP_DEPTH = 0.16;

// Geometria do "&" e a posição das lâmpadas: umas doze, pequenas e bem espaçadas ao longo do traço
function useAmpersand() {
    return useMemo(() => {
        const font = new FontLoader().parse(fontJson);
        const geometry = new TextGeometry('&', {
            font,
            size: AMP_SIZE,
            depth: AMP_DEPTH,
            curveSegments: 10,
            bevelEnabled: true,
            bevelThickness: 0.015,
            bevelSize: 0.012,
            bevelSegments: 3
        });
        geometry.computeBoundingBox();
        const bb = geometry.boundingBox;
        const dx = -(bb.min.x + bb.max.x) / 2;
        const dy = -bb.min.y;
        geometry.translate(dx, dy, -AMP_DEPTH / 2);

        // Aro creme na borda da frente, como nas letras de letreiro da foto
        const rim = new TextGeometry('&', {
            font,
            size: AMP_SIZE,
            depth: 0.01,
            curveSegments: 10,
            bevelEnabled: true,
            bevelThickness: 0.01,
            bevelSize: 0.034,
            bevelSegments: 2
        });
        rim.translate(dx, dy, AMP_DEPTH / 2 - 0.009);

        const shape = font.generateShapes('&', AMP_SIZE)[0];
        const outer = shape.getSpacedPoints(180);
        const holes = shape.holes.map((h) => h.getSpacedPoints(90));
        const isIn = (p) => inside(p, outer) && !holes.some((h) => inside(p, h));
        const half = AMP_SIZE * 0.06;
        const bulbs = [];
        for (let i = 0; i < outer.length; i += 3) {
            const prev = outer[(i - 1 + outer.length) % outer.length];
            const next = outer[(i + 1) % outer.length];
            const n = new THREE.Vector2(-(next.y - prev.y), next.x - prev.x).normalize();
            let q = outer[i].clone().addScaledVector(n, half);
            if (!isIn(q)) q = outer[i].clone().addScaledVector(n, -half);
            if (!isIn(q)) continue;
            if (bulbs.some((b) => b.distanceTo(q) < AMP_SIZE * 0.23)) continue;
            bulbs.push(q);
        }
        return {
            geometry,
            rim,
            bulbs: bulbs.map((b) => [b.x + dx, b.y + dy, AMP_DEPTH / 2 + 0.03])
        };
    }, []);
}

function AmpersandLamp({ t, night, onSelect, showLabels, compact }) {
    const { geometry, rim, bulbs } = useAmpersand();
    // Um material só para todas as lâmpadas: acendem juntas
    const bulbMat = useMemo(
        () => new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffc46b', emissiveIntensity: 0.15, toneMapped: false }),
        []
    );
    useFrame(() => {
        bulbMat.emissiveIntensity = lerp(0.15, 5, dayNight.mix);
    });
    return (
        <Hotspot
            id="lamp"
            label={night ? t.ui.toDay : t.ui.toNight}
            onSelect={onSelect}
            showLabel={showLabels && !compact}
            labelPosition={[0.3, 2.25, -0.25]}
            position={[-4.64, LEVELS[2], 4.36]}
            hit={{ size: [0.5, 1.0, 0.95], position: [0, 0.45, 0] }}
        >
            <Item>
                <mesh geometry={geometry} castShadow receiveShadow>
                    <meshStandardMaterial color="#151517" roughness={0.3} />
                </mesh>
                <mesh geometry={rim}>
                    <meshStandardMaterial color="#efe6d2" roughness={0.5} />
                </mesh>
                {bulbs.map((p, i) => (
                    <mesh key={i} position={p} material={bulbMat}>
                        <sphereGeometry args={[0.024, 12, 10]} />
                    </mesh>
                ))}
            </Item>
        </Hotspot>
    );
}

// Caixinha de som deitada ao longo da prateleira, com tecido camuflado militar verde-oliva e marrom
function JBL(props) {
    const camo = useMemo(() => {
        // padrão "woodland": fundo marrom, manchas verde-oliva, preto e areia
        const tex = camoTexture(['#5b3f27', '#676843', '#2b2a20', '#968e6d'], 12, false);
        // gira o desenho para as manchas compridas seguirem o comprimento da caixinha, como na foto
        tex.center.set(0.5, 0.5);
        tex.rotation = Math.PI / 2;
        return tex;
    }, []);
    return (
        <group {...props}>
            <Cyl args={[0.12, 0.12, 0.5, 32]} rotation-x={Math.PI / 2} map={camo} color="#ffffff" roughness={0.9} />
            {[-1, 1].map((s) => (
                <group key={s}>
                    <Cyl args={[0.126, 0.126, 0.05, 32]} position={[0, 0, s * 0.27]} rotation-x={Math.PI / 2} color={C.black} roughness={0.6} />
                    <Cyl args={[0.085, 0.085, 0.012, 32]} position={[0, 0, s * 0.297]} rotation-x={Math.PI / 2} color="#3a3b3f" roughness={0.35} metalness={0.4} />
                </group>
            ))}
            <Rounded size={[0.1, 0.03, 0.42]} radius={0.012} position={[0, -0.115, 0]} color={C.black} />
            {[-0.09, -0.03, 0.03, 0.09].map((z) => (
                <Rounded key={z} size={[0.035, 0.02, 0.035]} radius={0.008} position={[0, 0.118, z]} color="#26272a" roughness={0.5} />
            ))}
        </group>
    );
}

// Robô de cerâmica preta e brilhante
function Robot(props) {
    const glaze = { color: '#111113', roughness: 0.16, metalness: 0.1 };
    const relief = { color: '#2c2d32', roughness: 0.2 };
    return (
        <group {...props}>
            {[-0.065, 0.065].map((x) => (
                <group key={x}>
                    <Rounded size={[0.09, 0.2, 0.1]} radius={0.025} position={[x, 0.12, 0]} {...glaze} />
                    <Rounded size={[0.11, 0.05, 0.14]} radius={0.02} position={[x, 0.025, 0.02]} {...glaze} />
                </group>
            ))}
            <Rounded size={[0.28, 0.3, 0.2]} radius={0.04} position={[0, 0.37, 0]} {...glaze} />
            {[
                [-0.06, 0.43],
                [0.06, 0.43],
                [0, 0.33]
            ].map(([x, y]) => (
                <Box key={`${x}${y}`} size={[0.06, 0.05, 0.02]} position={[x, y, 0.105]} {...relief} />
            ))}
            {[-0.18, 0.18].map((x) => (
                <Rounded key={x} size={[0.07, 0.24, 0.09]} radius={0.03} position={[x, 0.36, 0]} {...glaze} />
            ))}
            <Cyl args={[0.05, 0.05, 0.05, 16]} position={[0, 0.54, 0]} {...glaze} />
            <Rounded size={[0.26, 0.2, 0.2]} radius={0.04} position={[0, 0.66, 0]} {...glaze} />
            {[-0.06, 0.06].map((x) => (
                <Cyl key={x} args={[0.03, 0.03, 0.02, 16]} position={[x, 0.68, 0.105]} rotation-x={Math.PI / 2} {...relief} />
            ))}
            <Box size={[0.1, 0.02, 0.02]} position={[0, 0.61, 0.105]} {...relief} />
            {[-0.145, 0.145].map((x) => (
                <Cyl key={x} args={[0.035, 0.035, 0.04, 16]} position={[x, 0.66, 0]} rotation-z={Math.PI / 2} {...glaze} />
            ))}
            <Cyl args={[0.01, 0.01, 0.08, 8]} position={[0, 0.8, 0]} {...glaze} />
            <Blob r={0.022} position={[0, 0.85, 0]} color="#111113" roughness={0.16} />
        </group>
    );
}

// Garrafinha vermelha de refrigerante, sem marca
function Bottle(props) {
    const geometry = useMemo(() => {
        const profile = [
            [0, 0],
            [0.042, 0],
            [0.047, 0.012],
            [0.047, 0.06],
            [0.04, 0.1],
            [0.044, 0.14],
            [0.048, 0.18],
            [0.042, 0.23],
            [0.026, 0.28],
            [0.018, 0.31],
            [0.018, 0.33],
            [0, 0.33]
        ];
        return new THREE.LatheGeometry(
            profile.map(([r, y]) => new THREE.Vector2(r, y)),
            28
        );
    }, []);
    return (
        <group {...props}>
            <mesh geometry={geometry} castShadow>
                <meshStandardMaterial color="#c8151d" roughness={0.28} metalness={0.25} />
            </mesh>
            <Cyl args={[0.0435, 0.0435, 0.025, 28]} position={[0, 0.12, 0]} color="#f4f1ea" roughness={0.4} />
            <Cyl args={[0.021, 0.021, 0.03, 16]} position={[0, 0.345, 0]} {...CHROME} />
        </group>
    );
}

function RubberDuck(props) {
    const yellow = '#f6cf2b';
    return (
        <group {...props}>
            <Blob r={0.075} position={[0, 0.06, 0]} scale={[1, 0.8, 1.25]} color={yellow} roughness={0.4} />
            <Blob r={0.045} position={[0, 0.1, -0.08]} color={yellow} roughness={0.4} />
            <Blob r={0.052} position={[0, 0.145, 0.045]} color={yellow} roughness={0.4} />
            <Blob r={0.03} position={[0, 0.13, 0.095]} scale={[1.1, 0.45, 1]} color="#f08a24" roughness={0.4} />
            {[-0.022, 0.022].map((x) => (
                <Blob key={x} r={0.009} position={[x, 0.16, 0.088]} color="#111" roughness={0.3} />
            ))}
        </group>
    );
}

// Moto em miniatura, de perfil para o quarto
function Motorbike(props) {
    const paint = { color: '#2a2a2e', roughness: 0.3, metalness: 0.5 };
    return (
        <group {...props}>
            {[-0.13, 0.13].map((x) => (
                <group key={x} position={[x, 0.065, 0]}>
                    <mesh castShadow>
                        <torusGeometry args={[0.05, 0.018, 10, 24]} />
                        <meshStandardMaterial color="#141416" roughness={0.7} />
                    </mesh>
                    <Cyl args={[0.025, 0.025, 0.03, 12]} rotation-x={Math.PI / 2} {...CHROME} />
                </group>
            ))}
            <Box size={[0.12, 0.07, 0.06]} position={[0, 0.1, 0]} color="#6d6f75" roughness={0.3} metalness={0.7} />
            <Rounded size={[0.11, 0.06, 0.075]} radius={0.025} position={[0.03, 0.16, 0]} {...paint} />
            <Rounded size={[0.11, 0.03, 0.06]} radius={0.012} position={[-0.07, 0.155, 0]} color="#151517" roughness={0.6} />
            <Cyl args={[0.009, 0.009, 0.16, 8]} position={[0.115, 0.13, 0]} rotation-z={0.35} {...CHROME} />
            <Cyl args={[0.008, 0.008, 0.12, 8]} position={[0.09, 0.21, 0]} rotation-x={Math.PI / 2} {...CHROME} />
            <Cyl args={[0.012, 0.016, 0.16, 10]} position={[-0.08, 0.075, 0.04]} rotation-z={Math.PI / 2 - 0.15} {...CHROME} />
            <Blob r={0.02} position={[0.14, 0.18, 0]} color="#e8e4d8" roughness={0.3} />
        </group>
    );
}

// Troféu de acrílico em base preta, com a impressão amarela e preta
function Trophy(props) {
    const print = useMemo(() => trophyPrintTexture(), []);
    const geometry = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(-0.08, 0);
        s.lineTo(0.08, 0);
        s.lineTo(0.14, 0.56);
        s.lineTo(-0.14, 0.62);
        s.closePath();
        return new THREE.ExtrudeGeometry(s, { depth: 0.024, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
    }, []);
    return (
        <group {...props}>
            <Rounded size={[0.3, 0.05, 0.14]} radius={0.015} position={[0, 0.025, 0]} color={C.black} roughness={0.3} />
            <mesh geometry={geometry} position={[0, 0.05, -0.012]} castShadow>
                <meshStandardMaterial color="#eaf4ff" transparent opacity={0.3} roughness={0.05} />
            </mesh>
            <mesh position={[0, 0.43, 0.02]}>
                <planeGeometry args={[0.2, 0.25]} />
                <meshStandardMaterial map={print} roughness={0.5} />
            </mesh>
        </group>
    );
}

// Chaveiro com duas chaves e o controle do portão
function Keys(props) {
    return (
        <group {...props}>
            <mesh position={[0, 0.006, 0]} rotation-x={Math.PI / 2}>
                <torusGeometry args={[0.035, 0.006, 8, 20]} />
                <meshStandardMaterial {...CHROME} />
            </mesh>
            <Box size={[0.03, 0.01, 0.12]} position={[0.03, 0.006, 0.08]} rotation-y={0.4} color="#d4b25a" roughness={0.3} metalness={0.8} />
            <Box size={[0.03, 0.01, 0.11]} position={[-0.02, 0.006, 0.08]} rotation-y={-0.3} {...CHROME} />
            <Rounded size={[0.07, 0.03, 0.1]} radius={0.012} position={[-0.02, 0.015, -0.08]} color={C.black} roughness={0.5} />
        </group>
    );
}

// Pecinha verde impressa em 3D (um suporte de celular)
function GreenStand(props) {
    const green = { color: '#3cae4c', roughness: 0.6 };
    return (
        <group {...props}>
            <Rounded size={[0.16, 0.04, 0.12]} radius={0.015} position={[0, 0.02, 0]} {...green} />
            <Rounded size={[0.16, 0.14, 0.03]} radius={0.012} position={[0, 0.1, -0.03]} rotation-x={-0.35} {...green} />
        </group>
    );
}

// Cofrinho de Stormtrooper: contorno do capacete com o rosto na frente
function Trooper(props) {
    const face = useMemo(() => trooperFaceTexture(), []);
    const geometry = useMemo(() => {
        // cúpula em cima, têmporas um pouco para dentro e as bochechas abertas embaixo
        const s = new THREE.Shape();
        s.moveTo(0.5, 0.03);
        s.bezierCurveTo(0.66, 0.03, 0.84, 0.05, 0.95, 0.14);
        s.bezierCurveTo(1.0, 0.2, 0.97, 0.32, 0.9, 0.4);
        s.bezierCurveTo(0.87, 0.45, 0.9, 0.55, 0.91, 0.62);
        s.bezierCurveTo(0.93, 0.88, 0.72, 0.99, 0.5, 0.99);
        s.bezierCurveTo(0.28, 0.99, 0.07, 0.88, 0.09, 0.62);
        s.bezierCurveTo(0.1, 0.55, 0.13, 0.45, 0.1, 0.4);
        s.bezierCurveTo(0.03, 0.32, 0.0, 0.2, 0.05, 0.14);
        s.bezierCurveTo(0.16, 0.05, 0.34, 0.03, 0.5, 0.03);
        // a frente (grupo 0) usa x e y do contorno como UV: o rosto cobre o quadrado [0,1]
        const g = new THREE.ExtrudeGeometry(s, {
            depth: 0.24,
            curveSegments: 20,
            bevelEnabled: true,
            bevelThickness: 0.12,
            bevelSize: 0.05,
            bevelSegments: 6
        });
        g.translate(-0.5, 0, -0.12);
        return g;
    }, []);
    return (
        <group {...props}>
            <mesh geometry={geometry} position={[0, 0.02, 0]} scale={[0.46, 0.5, 0.42]} castShadow receiveShadow>
                <meshStandardMaterial attach="material-0" map={face} roughness={0.3} />
                <meshStandardMaterial attach="material-1" color="#f5f5f2" roughness={0.3} />
            </mesh>
        </group>
    );
}

function Portrait({ t, onSelect, showLabels }) {
    const photo = useMemo(() => {
        const tex = new THREE.TextureLoader().load(foto);
        tex.colorSpace = THREE.SRGBColorSpace;
        // a foto é quadrada; o quadro é em pé: corta as laterais
        const aspect = 0.54 / 0.7;
        tex.repeat.set(aspect, 1);
        tex.offset.set((1 - aspect) / 2, 0);
        return tex;
    }, []);
    return (
        <Hotspot
            id="about"
            label={t.ui.nav.about}
            onSelect={onSelect}
            showLabel={showLabels}
            labelPosition={[0.5, 0.9, -1.5]}
            position={[-4.66, LEVELS[1], 3.42]}
            rotation-y={-0.3}
            hit={{ size: [0.4, 1.0, 0.8], position: [0.1, 0.45, 0] }}
        >
            <group position={[0, 0.45, 0]} rotation-z={0.08}>
                <Rounded size={[0.06, 0.88, 0.72]} radius={0.02} color="#1a1a1c" roughness={0.4} />
                <mesh position={[0.031, 0, 0]} rotation-y={Math.PI / 2}>
                    <planeGeometry args={[0.62, 0.78]} />
                    <meshStandardMaterial color="#f4f1ea" roughness={0.8} />
                </mesh>
                <mesh position={[0.032, 0, 0]} rotation-y={Math.PI / 2}>
                    <planeGeometry args={[0.54, 0.7]} />
                    <meshStandardMaterial map={photo} roughness={0.5} />
                </mesh>
            </group>
            {/* pezinho atrás do quadro */}
            <Box size={[0.03, 0.6, 0.12]} position={[-0.13, 0.3, 0]} rotation-z={-0.35} color="#1a1a1c" roughness={0.5} />
        </Hotspot>
    );
}

// Estrela rosa de pelúcia com olhos e sorriso
function Star(props) {
    const geometry = useMemo(() => {
        const s = new THREE.Shape();
        for (let i = 0; i < 10; i++) {
            const r = i % 2 ? 0.17 : 0.4;
            const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
            if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 5 });
        g.center();
        return g;
    }, []);
    return (
        <group {...props}>
            <mesh geometry={geometry} castShadow receiveShadow>
                <meshStandardMaterial color="#f39ac3" roughness={0.95} />
            </mesh>
            {[-0.075, 0.075].map((x) => (
                <Eye key={x} r={0.06} position={[x, 0.08, 0.13]} />
            ))}
            <mesh position={[0, -0.03, 0.135]} rotation-z={Math.PI}>
                <torusGeometry args={[0.05, 0.011, 6, 16, Math.PI]} />
                <meshStandardMaterial color="#5b1d33" roughness={0.8} />
            </mesh>
        </group>
    );
}

// Pelúcia de caveira: cabeça branca e corpo listrado de preto e branco
function SkullPlush(props) {
    const stripes = useMemo(() => stripesTexture(), []);
    const bone = '#f4f2ec';
    return (
        <group {...props}>
            <mesh position={[0, 0.24, 0]} castShadow>
                <capsuleGeometry args={[0.12, 0.16, 8, 16]} />
                <meshStandardMaterial map={stripes} roughness={0.95} />
            </mesh>
            {[-0.07, 0.07].map((x) => (
                <mesh key={`p${x}`} position={[x, 0.06, 0.12]} rotation-x={Math.PI / 2} castShadow>
                    <capsuleGeometry args={[0.05, 0.14, 6, 12]} />
                    <meshStandardMaterial map={stripes} roughness={0.95} />
                </mesh>
            ))}
            {[-1, 1].map((s) => (
                <mesh key={`b${s}`} position={[s * 0.15, 0.27, 0.04]} rotation-z={s * 0.5} castShadow>
                    <capsuleGeometry args={[0.04, 0.14, 6, 12]} />
                    <meshStandardMaterial map={stripes} roughness={0.95} />
                </mesh>
            ))}
            <Blob r={0.17} position={[0, 0.56, 0]} scale={[1, 0.95, 0.9]} color={bone} />
            <Rounded size={[0.2, 0.09, 0.14]} radius={0.04} position={[0, 0.42, 0.06]} color={bone} roughness={0.95} />
            {[-0.065, 0.065].map((x) => (
                <Blob key={x} r={0.05} position={[x, 0.58, 0.13]} scale={[1, 1.15, 0.4]} color="#18181a" />
            ))}
            <mesh position={[0, 0.5, 0.15]} rotation-x={Math.PI}>
                <coneGeometry args={[0.022, 0.04, 3]} />
                <meshStandardMaterial color="#18181a" roughness={0.9} />
            </mesh>
            {[-0.05, 0, 0.05].map((x) => (
                <Box key={x} size={[0.008, 0.05, 0.01]} position={[x, 0.42, 0.13]} color="#18181a" shadow={false} />
            ))}
        </group>
    );
}

// Pato preto de bico e pés laranja, com olhos grandes
function BlackDuck(props) {
    const black = '#1f1f23';
    const orange = '#f08a24';
    return (
        <group {...props}>
            <Blob r={0.19} position={[0, 0.19, 0]} scale={[1, 0.95, 1.05]} color={black} />
            {[-1, 1].map((s) => (
                <Blob key={s} r={0.1} position={[s * 0.17, 0.22, -0.02]} scale={[0.45, 0.9, 1.3]} rotation-x={0.3} color={black} />
            ))}
            <Blob r={0.07} position={[0, 0.26, -0.2]} scale={[0.8, 0.6, 1.2]} rotation-x={-0.6} color={black} />
            <Blob r={0.14} position={[0, 0.48, 0.03]} color={black} />
            {[-0.052, 0.052].map((x) => (
                <Eye key={x} r={0.052} position={[x, 0.53, 0.14]} scale={[0.85, 1.3, 1]} />
            ))}
            {/* bico largo e achatado de pato */}
            <Blob r={0.1} position={[0, 0.44, 0.19]} scale={[1.25, 0.28, 1.5]} color={orange} roughness={0.8} />
            <Blob r={0.09} position={[0, 0.41, 0.18]} scale={[1.1, 0.2, 1.35]} color="#d9731a" roughness={0.8} />
            {[-0.09, 0.09].map((x) => (
                <Blob key={x} r={0.07} position={[x, 0.025, 0.12]} scale={[0.9, 0.3, 1.5]} color={orange} roughness={0.8} />
            ))}
        </group>
    );
}

// Galinho branco de crista vermelha, deitado
function Rooster(props) {
    const white = '#f3f1ec';
    const red = '#d93b33';
    return (
        <group {...props}>
            <Blob r={0.2} position={[0, 0.17, 0]} scale={[0.95, 0.85, 1.3]} color={white} />
            {[-1, 1].map((s) => (
                <Blob key={s} r={0.12} position={[s * 0.17, 0.2, -0.02]} scale={[0.4, 0.8, 1.2]} color={white} />
            ))}
            <Blob r={0.1} position={[0, 0.3, -0.24]} color={white} />
            <Blob r={0.12} position={[0, 0.37, 0.22]} color={white} />
            {[0.15, 0.22, 0.29].map((z, i) => (
                <Blob key={z} r={0.04 + (i === 1 ? 0.01 : 0)} position={[0, 0.5 + (i === 1 ? 0.01 : 0), z]} color={red} />
            ))}
            <mesh position={[0, 0.36, 0.36]} rotation-x={Math.PI / 2}>
                <coneGeometry args={[0.03, 0.07, 10]} />
                <meshStandardMaterial color="#f2b632" roughness={0.8} />
            </mesh>
            <Blob r={0.028} position={[0, 0.3, 0.32]} scale={[0.8, 1.3, 0.8]} color={red} />
            {[-0.06, 0.06].map((x) => (
                <Blob key={x} r={0.018} position={[x, 0.4, 0.32]} color="#111" roughness={0.4} />
            ))}
        </group>
    );
}

// Dinossauro azul de espinhos amarelos, deitado na frente
function Dino(props) {
    const blue = '#7fb0e6';
    const yellow = '#f2d23a';
    return (
        <group {...props}>
            <mesh position={[0, 0.14, 0]} rotation-x={Math.PI / 2} castShadow receiveShadow>
                <capsuleGeometry args={[0.14, 0.42, 8, 16]} />
                <meshStandardMaterial color={blue} roughness={0.95} />
            </mesh>
            <Blob r={0.15} position={[0, 0.2, 0.38]} scale={[1, 0.9, 1.1]} color={blue} />
            <Blob r={0.1} position={[0, 0.15, 0.52]} scale={[1, 0.8, 1]} color={blue} />
            <mesh position={[0, 0.1, -0.44]} rotation-x={-Math.PI / 2} castShadow>
                <coneGeometry args={[0.1, 0.34, 14]} />
                <meshStandardMaterial color={blue} roughness={0.95} />
            </mesh>
            {[-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42].map((z) => (
                <mesh key={z} position={[0, z > 0.3 ? 0.36 : 0.29, z]}>
                    <coneGeometry args={[0.045, 0.1, 8]} />
                    <meshStandardMaterial color={yellow} roughness={0.9} />
                </mesh>
            ))}
            {[
                [-0.1, -0.18],
                [0.1, -0.18],
                [-0.1, 0.2],
                [0.1, 0.2]
            ].map(([x, z]) => (
                <Blob key={`${x}${z}`} r={0.06} position={[x, 0.04, z]} scale={[1, 0.8, 1.2]} color={blue} />
            ))}
            {[-0.08, 0.08].map((x) => (
                <Blob key={x} r={0.022} position={[x, 0.27, 0.48]} color="#111" roughness={0.4} />
            ))}
        </group>
    );
}

// Unicórnio branco com chifre dourado e crina colorida
function Unicorn(props) {
    const white = '#f6f3f2';
    const mane = ['#f49ac1', '#b48ee6', '#7cc8f2', '#f6d860', '#8fdcaa'];
    return (
        <group {...props}>
            <Blob r={0.16} position={[0, 0.16, 0]} scale={[1, 0.95, 0.95]} color={white} />
            {[-0.08, 0.08].map((x) => (
                <Blob key={x} r={0.06} position={[x, 0.05, 0.12]} scale={[1, 0.8, 1.3]} color={white} />
            ))}
            <Blob r={0.15} position={[0, 0.42, 0.03]} color={white} />
            <Blob r={0.08} position={[0, 0.37, 0.15]} scale={[1.2, 0.8, 0.9]} color="#f8dbe6" />
            <mesh position={[0, 0.6, 0.08]} rotation-x={0.35}>
                <coneGeometry args={[0.03, 0.16, 12]} />
                <meshStandardMaterial color="#f2c94c" roughness={0.4} metalness={0.3} />
            </mesh>
            {[-0.08, 0.08].map((x) => (
                <mesh key={x} position={[x, 0.56, 0]} rotation-z={-x * 3}>
                    <coneGeometry args={[0.035, 0.08, 10]} />
                    <meshStandardMaterial color={white} roughness={0.95} />
                </mesh>
            ))}
            {mane.map((color, i) => (
                <Blob key={color} r={0.055} position={[0, 0.56 - i * 0.07, -0.1 - i * 0.02]} color={color} />
            ))}
            {[-0.06, 0.06].map((x) => (
                <Blob key={x} r={0.016} position={[x, 0.45, 0.14]} color="#111" roughness={0.4} />
            ))}
        </group>
    );
}

export default function Niche({ t, night, onSelect, showLabels, compact }) {
    const [base, low, mid, high] = LEVELS;
    return (
        <group>
            <Frame />

            {/* prateleira de cima */}
            <Bottle position={[-4.68, high, 4.66]} />
            <Item position={[-4.55, high, 4.4]} turn={0.6}>
                <RubberDuck />
            </Item>
            <Item position={[-4.62, high, 3.0]} turn={0.25}>
                <Motorbike scale={1.3} />
            </Item>

            {/* luminária "&", JBL e o robô */}
            <AmpersandLamp t={t} night={night} onSelect={onSelect} showLabels={showLabels} compact={compact} />
            <JBL position={[-4.68, mid + 0.13, 3.66]} rotation-y={0.08} />
            <Item position={[-4.64, mid, 2.82]} turn={0.35}>
                <Robot scale={0.85} />
            </Item>

            {/* troféu, chaves, porta-retrato e o Stormtrooper */}
            <Item position={[-4.55, low, 4.74]}>
                <GreenStand />
            </Item>
            <Item position={[-4.72, low, 4.42]} turn={0.35}>
                <Trophy />
            </Item>
            <Keys position={[-4.45, low, 3.98]} rotation-y={0.6} />
            <Portrait t={t} onSelect={onSelect} showLabels={showLabels} />
            <Item position={[-4.68, low, 2.74]} turn={0.35}>
                <Trooper />
            </Item>

            {/* pelúcias amontoadas na base */}
            <Item position={[-4.66, base, 4.68]} turn={0.55}>
                <Unicorn />
            </Item>
            <Item position={[-4.84, base, 3.98]} turn={0.4}>
                <SkullPlush />
            </Item>
            <Item position={[-4.55, base + 0.33, 4.24]} turn={0.3}>
                <Star rotation-x={-0.15} rotation-z={0.12} />
            </Item>
            <Item position={[-4.72, base, 3.5]} turn={0.3}>
                <BlackDuck />
            </Item>
            <Item position={[-4.62, base, 2.82]} turn={-1.0}>
                <Rooster />
            </Item>
            <Dino position={[-4.4, base, 3.72]} rotation-y={Math.PI - 0.25} scale={0.95} />
        </group>
    );
}
