// Estrutura do quarto: piso de porcelanato, paredes bege-pêssego com rodapé de granito,
// janela de correr com veneziana, porta de madeira envernizada e o pôster do CS.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { posterTexture, tilesTexture } from '../textures';
import { Box, C, Cyl, dayNight, Rounded, WALL_H } from './shared';
import { doorWoodTexture, graniteTexture } from './wallTextures';

// Tinta das paredes, o bege-pêssego quente das fotos da cama
const WALL = '#dfc4a3';
const WALL_T = 0.3;

// Vão da janela na parede B (plano z = -5)
const WIN = { x0: -2.5, x1: 0.3, y0: 2.0, y1: 4.3 };
const WIN_CX = (WIN.x0 + WIN.x1) / 2;
const WIN_CY = (WIN.y0 + WIN.y1) / 2;
const WIN_W = WIN.x1 - WIN.x0;
const WIN_H = WIN.y1 - WIN.y0;

// Folha da porta na parede A (plano x = -5) e a largura do alizar
const DOOR = { z0: 0.0, z1: 1.75, top: 4.4 };
const CASING = 0.17;

// Alumínio anodizado fosco da janela e o cromado da maçaneta
const ALU = { color: '#c3c6ca', roughness: 0.4, metalness: 0.35 };
const CHROME = { color: '#eceef2', roughness: 0.22, metalness: 0.65 };

// Parede numa peça só, com o vão recortado (sem emendas que vazam luz à noite).
// O contorno é desenhado no plano da parede: x ao longo dela, y na altura.
function useWallGeometry(points, hole) {
    return useMemo(() => {
        const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
        if (hole) shape.holes.push(new THREE.Path(hole.map(([x, y]) => new THREE.Vector2(x, y))));
        return new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false });
    }, [points, hole]);
}

const BACK_OUTLINE = [
    [-5.3, 0],
    [5.3, 0],
    [5.3, WALL_H],
    [-5.3, WALL_H]
];
const WINDOW_HOLE = [
    [WIN.x0, WIN.y0],
    [WIN.x1, WIN.y0],
    [WIN.x1, WIN.y1],
    [WIN.x0, WIN.y1]
];
// Parede A com o recorte da porta saindo do chão (x aqui é o z do mundo)
const SIDE_OUTLINE = [
    [-5.3, 0],
    [DOOR.z0, 0],
    [DOOR.z0, DOOR.top],
    [DOOR.z1, DOOR.top],
    [DOOR.z1, 0],
    [5.3, 0],
    [5.3, WALL_H],
    [-5.3, WALL_H]
];

function Walls() {
    const back = useWallGeometry(BACK_OUTLINE, WINDOW_HOLE);
    const side = useWallGeometry(SIDE_OUTLINE);
    return (
        <group>
            <mesh geometry={back} position={[0, 0, -5 - WALL_T]} castShadow receiveShadow>
                <meshStandardMaterial color={WALL} roughness={0.95} />
            </mesh>
            <mesh geometry={side} position={[-5, 0, 0]} rotation-y={-Math.PI / 2} castShadow receiveShadow>
                <meshStandardMaterial color={WALL} roughness={0.95} />
            </mesh>
        </group>
    );
}

// Rodapé de granito: faixa baixa e fina encostada na parede
function Baseboard({ length, along, at }) {
    const map = useMemo(() => graniteTexture(length), [length]);
    const size = along === 'x' ? [length, 0.2, 0.04] : [0.04, 0.2, length];
    const position = along === 'x' ? [at, 0.1, -4.98] : [-4.98, 0.1, at];
    return <Box size={size} position={position} map={map} color="#ffffff" roughness={0.35} />;
}

function Window() {
    const sky = useRef();
    const disc = useRef();
    const stars = useRef();
    const glass = useRef();
    const colors = useMemo(
        () => ({
            skyDay: new THREE.Color('#a9d6f2'),
            skyNight: new THREE.Color('#121a35'),
            sun: new THREE.Color('#fff1b8'),
            moon: new THREE.Color('#eef2ff')
        }),
        []
    );
    const starPositions = useMemo(() => {
        const arr = [];
        // só na metade do vidro; a veneziana cobre o resto
        for (let i = 0; i < 18; i++) arr.push(WIN.x0 + Math.random() * WIN_W * 0.5, 3.0 + Math.random() * 1.3, -5.53);
        return new Float32Array(arr);
    }, []);
    const granite = useMemo(() => graniteTexture(WIN_W + 0.3), []);

    useFrame(() => {
        const m = dayNight.mix;
        sky.current.color.lerpColors(colors.skyDay, colors.skyNight, m);
        disc.current.color.lerpColors(colors.sun, colors.moon, m);
        stars.current.opacity = m;
        glass.current.opacity = THREE.MathUtils.lerp(0.14, 0.06, m);
    });

    // Folha de vidro à esquerda (trilho de trás) e de veneziana à direita (trilho da frente)
    const sashY0 = WIN.y0 + 0.11;
    const sashY1 = WIN.y1 - 0.07;
    const sashH = sashY1 - sashY0;
    const sashCY = (sashY0 + sashY1) / 2;
    const leftX = [WIN.x0 + 0.07, WIN_CX + 0.04];
    const rightX = [WIN_CX - 0.04, WIN.x1 - 0.07];
    const slats = [];
    for (let y = sashY1 - 0.12; y > sashY0 + 0.08; y -= 0.095) slats.push(y);

    const sash = ([a, b], z) => {
        const w = b - a;
        const cx = (a + b) / 2;
        return (
            <group>
                <Box size={[w, 0.06, 0.05]} position={[cx, sashY1 - 0.03, z]} {...ALU} />
                <Box size={[w, 0.06, 0.05]} position={[cx, sashY0 + 0.03, z]} {...ALU} />
                <Box size={[0.06, sashH, 0.05]} position={[a + 0.03, sashCY, z]} {...ALU} />
                <Box size={[0.06, sashH, 0.05]} position={[b - 0.03, sashCY, z]} {...ALU} />
            </group>
        );
    };

    return (
        <group>
            {/* Lá fora: céu, sol/lua, estrelas e a casa do vizinho, vistos só pelo vão */}
            <mesh position={[WIN_CX, WIN_CY, -5.55]}>
                <planeGeometry args={[WIN_W + 1.4, WIN_H + 1.6]} />
                <meshBasicMaterial ref={sky} toneMapped={false} />
            </mesh>
            <mesh position={[WIN.x0 + 0.62, 3.9, -5.53]}>
                <circleGeometry args={[0.2, 32]} />
                <meshBasicMaterial ref={disc} toneMapped={false} />
            </mesh>
            <points>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
                </bufferGeometry>
                <pointsMaterial ref={stars} size={0.035} color="#ffffff" transparent opacity={0} />
            </points>
            <mesh position={[WIN_CX, 2.25, -5.5]}>
                <planeGeometry args={[WIN_W + 1, 0.7]} />
                <meshStandardMaterial color="#a39a8e" roughness={1} />
            </mesh>
            <mesh position={[WIN_CX - 0.3, 2.68, -5.46]} rotation-x={-0.6}>
                <planeGeometry args={[WIN_W, 0.3]} />
                <meshStandardMaterial color="#a8553c" roughness={0.9} />
            </mesh>

            {/* Guarnição de alumínio rente à parede */}
            <Box size={[WIN_W + 0.14, 0.07, 0.03]} position={[WIN_CX, WIN.y1 + 0.035, -4.985]} {...ALU} />
            <Box size={[0.07, WIN_H + 0.07, 0.03]} position={[WIN.x0 - 0.035, WIN_CY + 0.035, -4.985]} {...ALU} />
            <Box size={[0.07, WIN_H + 0.07, 0.03]} position={[WIN.x1 + 0.035, WIN_CY + 0.035, -4.985]} {...ALU} />

            {/* Marco recuado dentro do vão */}
            <Box size={[WIN_W, 0.07, 0.16]} position={[WIN_CX, WIN.y1 - 0.035, -5.15]} {...ALU} />
            <Box size={[WIN_W, 0.06, 0.16]} position={[WIN_CX, WIN.y0 + 0.06, -5.15]} {...ALU} />
            <Box size={[0.07, WIN_H, 0.16]} position={[WIN.x0 + 0.035, WIN_CY, -5.15]} {...ALU} />
            <Box size={[0.07, WIN_H, 0.16]} position={[WIN.x1 - 0.035, WIN_CY, -5.15]} {...ALU} />

            {/* Folha de vidro */}
            {sash(leftX, -5.19)}
            <mesh position={[(leftX[0] + leftX[1]) / 2, sashCY, -5.19]}>
                <planeGeometry args={[leftX[1] - leftX[0] - 0.1, sashH - 0.1]} />
                <meshStandardMaterial ref={glass} color="#d8ecff" transparent opacity={0.14} roughness={0.5} metalness={0.1} />
            </mesh>

            {/* Folha de veneziana, fechada e com as lâminas entreabertas como na foto */}
            {sash(rightX, -5.11)}
            {slats.map((y) => (
                <Box
                    key={y}
                    size={[rightX[1] - rightX[0] - 0.1, 0.085, 0.022]}
                    position={[(rightX[0] + rightX[1]) / 2, y, -5.11]}
                    rotation-x={0.4}
                    color="#90959b"
                    roughness={0.45}
                    metalness={0.45}
                />
            ))}
            <Box size={[0.025, 0.32, 0.03]} position={[rightX[0] + 0.03, WIN_CY, -5.07]} color={C.graphite} roughness={0.4} />

            {/* Peitoril de granito */}
            <Box size={[WIN_W + 0.3, 0.08, 0.36]} position={[WIN_CX, WIN.y0 - 0.01, -5.06]} map={granite} color="#ffffff" roughness={0.3} />
        </group>
    );
}

// Madeira âmbar com verniz brilhante, como a porta das fotos
function Varnished({ size, map, tint = '#ffffff', ...props }) {
    return (
        <mesh castShadow receiveShadow {...props}>
            <boxGeometry args={size} />
            <meshPhysicalMaterial map={map} color={tint} roughness={0.45} clearcoat={0.5} clearcoatRoughness={0.32} />
        </mesh>
    );
}

function Door() {
    const wood = useMemo(() => doorWoodTexture(), []);
    const width = DOOR.z1 - DOOR.z0;
    const cz = (DOOR.z0 + DOOR.z1) / 2;
    const handleZ = DOOR.z1 - 0.2;
    return (
        <group>
            {/* Folha um pouco recuada no vão */}
            <Varnished size={[0.07, DOOR.top - 0.02, width]} position={[-5.065, DOOR.top / 2 + 0.01, cz]} map={wood} />

            {/* Alizares (batentes) da mesma madeira, um tom mais escuros para destacar a folha */}
            {[DOOR.z0 - CASING / 2, DOOR.z1 + CASING / 2].map((z) => (
                <Varnished key={z} size={[0.075, DOOR.top + CASING, CASING]} position={[-4.9925, (DOOR.top + CASING) / 2, z]} map={wood} tint="#f0dcc4" />
            ))}
            <Varnished size={[0.075, CASING, width + CASING * 2]} position={[-4.9925, DOOR.top + CASING / 2, cz]} map={wood} tint="#f0dcc4" />

            {/* Dobradiças do lado do gabinete */}
            {[0.7, 2.2, 3.7].map((y) => (
                <Cyl key={y} args={[0.024, 0.024, 0.22, 12]} position={[-5.02, y, DOOR.z0 + 0.012]} color="#b48a52" roughness={0.3} metalness={0.85} />
            ))}

            {/* Maçaneta de alavanca cromada com espelho redondo */}
            <Cyl args={[0.065, 0.065, 0.025, 24]} position={[-5.02, 2.15, handleZ]} rotation-z={Math.PI / 2} {...CHROME} />
            <Cyl args={[0.022, 0.022, 0.1, 12]} position={[-4.98, 2.15, handleZ]} rotation-z={Math.PI / 2} {...CHROME} />
            <Rounded size={[0.035, 0.04, 0.3]} radius={0.015} position={[-4.94, 2.15, handleZ - 0.12]} {...CHROME} />
            {/* Tambor da chave logo abaixo */}
            <Cyl args={[0.045, 0.045, 0.025, 20]} position={[-5.02, 1.88, handleZ]} rotation-z={Math.PI / 2} {...CHROME} />
            <Box size={[0.01, 0.045, 0.012]} position={[-5.005, 1.88, handleZ]} color={C.black} shadow={false} />
        </group>
    );
}

function Poster({ kind, position, rotation, size = [1, 1.36] }) {
    const tex = useMemo(() => posterTexture(kind), [kind]);
    return (
        <group position={position} rotation={rotation}>
            <Box size={[size[0] + 0.08, size[1] + 0.08, 0.04]} color={C.black} roughness={0.5} />
            <mesh position={[0, 0, 0.022]}>
                <planeGeometry args={size} />
                <meshStandardMaterial map={tex} roughness={0.55} />
            </mesh>
        </group>
    );
}

export { Poster };

export default function Shell() {
    const tiles = useMemo(() => tilesTexture(), []);
    return (
        <group>
            {/* Piso */}
            <Box size={[10.6, 0.4, 10.6]} position={[0, -0.2, 0]} color={C.slab} roughness={0.9} />
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]} receiveShadow>
                <planeGeometry args={[10.6, 10.6]} />
                <meshStandardMaterial map={tiles} roughness={0.32} />
            </mesh>

            <Walls />

            {/* Rodapé de granito: parede B inteira; na parede A, fora da porta e do nicho */}
            <Baseboard along="x" length={10.3} at={0.15} />
            <Baseboard along="z" length={DOOR.z0 - CASING + 4.96} at={(-4.96 + DOOR.z0 - CASING) / 2} />
            <Baseboard along="z" length={2.3 - DOOR.z1 - CASING} at={(DOOR.z1 + CASING + 2.3) / 2} />
            <Baseboard along="z" length={0.35} at={5.125} />

            <Window />
            <Door />

            {/* Pôster minimalista do de_dust2, entre a janela e os pôsteres de filmes */}
            <Poster kind="dust" position={[0.95, 3.4, -4.975]} size={[0.72, 1.0]} />
        </group>
    );
}
