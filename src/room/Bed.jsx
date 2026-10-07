// Parede da janela: cama com cabeceira de mogno, edredom matelassê, travesseiros, almofada,
// celular (Contato), criado-mudo com a luminária de cobre, pôsteres de filmes, tapete felpudo e a bola.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { ballTexture, phoneScreenTexture } from '../textures';
import {
    creatineTexture,
    cushionTexture,
    lanyardTexture,
    mahoganyTexture,
    pillowTexture,
    quiltTexture,
    rugTextures,
    teakTexture
} from './bedTextures';
import { Box, C, Cyl, dayNight, Hotspot, lerp, Rounded } from './shared';
import { Poster } from './Shell';

const GRAPHITE = '#535962';
const COPPER = '#e0a07a';

// Forma macia (travesseiro, almofada, pacote, mochila): esfera esticada em caixa de cantos redondos.
// O eixo mais fino fica abaulado e afina na borda, como a costura de um travesseiro.
// A uv é uma projeção plana na face maior, então a textura aparece inteira na frente.
export function softGeometry([sx, sy, sz], { round = 0.32, pinch = 0.45 } = {}) {
    const geo = new THREE.SphereGeometry(1, 56, 36);
    const dims = [sx, sy, sz];
    const thin = dims.indexOf(Math.min(...dims));
    const [ua, va] = [0, 1, 2].filter((k) => k !== thin);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        const q = p.map((v, k) => (k === thin ? v : Math.sign(v) * Math.pow(Math.abs(v), round)));
        q[thin] *= 1 - pinch * Math.pow(Math.max(Math.abs(q[ua]), Math.abs(q[va])), 6);
        pos.setXYZ(i, (q[0] * sx) / 2, (q[1] * sy) / 2, (q[2] * sz) / 2);
        uv.setXY(i, q[ua] * 0.5 + 0.5, q[va] * 0.5 + 0.5);
    }
    geo.deleteAttribute('normal');
    const merged = mergeVertices(geo);
    merged.computeVertexNormals();
    return merged;
}

export function Soft({ size, round, pinch, color = '#ffffff', map, bumpMap, bumpScale, roughness = 0.9, ...props }) {
    const key = size.join(',');
    const geometry = useMemo(() => softGeometry(key.split(',').map(Number), { round, pinch }), [key, round, pinch]);
    return (
        <mesh geometry={geometry} castShadow receiveShadow {...props}>
            <meshStandardMaterial color={color} map={map} bumpMap={bumpMap} bumpScale={bumpScale} roughness={roughness} />
        </mesh>
    );
}

// Perfil desenhado no plano (z, y) e extrudado para -x, com as quinas arredondadas
function profileGeometry(draw, depth, bow = 0) {
    const shape = new THREE.Shape();
    draw(shape);
    const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.012,
        bevelSize: 0.012,
        bevelSegments: 3,
        curveSegments: 36
    });
    geo.rotateY(-Math.PI / 2);
    // painel levemente curvo: o meio fica um pouco mais para trás
    if (bow) {
        const pos = geo.attributes.position;
        geo.computeBoundingBox();
        const half = geo.boundingBox.max.z;
        for (let i = 0; i < pos.count; i++) {
            const z = pos.getZ(i) / half;
            pos.setX(i, pos.getX(i) + bow * (1 - z * z));
        }
    }
    return geo;
}

// Cabeceira de mogno: painel com o topo em arco, colunas laterais que alargam para cima
// e duas barras cromadas de cada lado ligando as colunas ao painel
function Headboard() {
    const panelWood = useMemo(() => mahoganyTexture({ repeat: [0.42, 0.42] }), []);
    const columnWood = useMemo(() => mahoganyTexture({ repeat: [0.6, 0.6], vertical: true }), []);
    // A frente da cabeceira fica de costas para o sol e sai quase preta. De dia a própria madeira
    // brilha um pouco (a claridade rebatida da janela, como na foto); à noite isso some.
    const woods = useRef([]);
    useFrame(() => {
        const fill = lerp(0.34, 0, dayNight.mix);
        woods.current.forEach((m) => m && (m.emissiveIntensity = fill));
    });
    const panel = useMemo(
        () =>
            profileGeometry(
                (s) => {
                    s.moveTo(-1.1, 0.3);
                    s.lineTo(1.1, 0.3);
                    s.lineTo(1.1, 2.3);
                    s.quadraticCurveTo(0, 2.02, -1.1, 2.3);
                    s.closePath();
                },
                0.07,
                0.05
            ),
        []
    );
    // `side` = -1 para a coluna do canto da parede, +1 para a do criado-mudo (o lado de fora é mais alto)
    const columns = useMemo(
        () =>
            [-1, 1].map((side) =>
                profileGeometry((s) => {
                    s.moveTo(-0.08, 0);
                    s.lineTo(0.08, 0);
                    s.lineTo(0.125, 2.5 + 0.045 * side);
                    s.lineTo(-0.125, 2.5 - 0.045 * side);
                    s.closePath();
                }, 0.12)
            ),
        []
    );
    return (
        <group>
            <mesh geometry={panel} position={[5.08, 0, -3.5]} castShadow receiveShadow>
                <meshStandardMaterial ref={(m) => (woods.current[0] = m)} map={panelWood} emissive="#ffffff" emissiveMap={panelWood} roughness={0.42} />
            </mesh>
            {columns.map((geo, i) => (
                <mesh key={i} geometry={geo} position={[5.19, 0, i ? -2.15 : -4.85]} castShadow receiveShadow>
                    <meshStandardMaterial
                        ref={(m) => (woods.current[i + 1] = m)}
                        map={columnWood}
                        emissive="#ffffff"
                        emissiveMap={columnWood}
                        roughness={0.42}
                    />
                </mesh>
            ))}
            {[-4.665, -2.335].flatMap((z) =>
                [1.92, 2.12].map((y) => (
                    <Cyl key={`${z}${y}`} args={[0.021, 0.021, 0.2, 14]} position={[5.1, y, z]} rotation-x={Math.PI / 2} color={C.chrome} roughness={0.18} metalness={1} />
                ))
            )}
        </group>
    );
}

// Edredom: grade fina que cobre o colchão e cai pela lateral e pelo pé da cama.
// Os gomos do matelassê são relevo de verdade (zero na costura, estufado no meio do losango).
const QUILT = { x0: -1.0, x1: 4.3, z0: -4.95, z1: -2.1, top: 1.0, r: 0.1, hang: 0.4, cell: 0.6, puff: 0.02 };

function quiltGeometry() {
    const { x0, x1, z0, z1, top, r, hang, cell, puff } = QUILT;
    const bend = (r * Math.PI) / 2;
    const extra = bend + hang;
    const sx = x1 - x0 + extra;
    const sz = z1 - z0 + extra;
    const geo = new THREE.PlaneGeometry(sx, sz, Math.round(sx * 30), Math.round(sz * 30));
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        // ponto do pano ainda esticado (antes de cair pelas bordas)
        const fx = pos.getX(i) + x1 - sx / 2;
        const fz = z0 + sz / 2 - pos.getY(i);
        const dx = Math.max(0, x0 - fx);
        const dz = Math.max(0, fz - z1);
        const len = Math.hypot(dx, dz);
        const d = Math.min(len, extra);
        const dirX = len ? -dx / len : 0;
        const dirZ = len ? dz / len : 0;
        // dobra redonda na quina do colchão, depois cai reto com algumas ondas
        const th = Math.min(d / r, Math.PI / 2);
        const fall = Math.max(0, d - bend);
        const t = fall / hang;
        const along = fx * Math.abs(dirZ) + fz * Math.abs(dirX);
        const out = r * Math.sin(th) + 0.032 * t * Math.sin(along * 6.3 + 1.2);
        // ondulação leve do pano em cima da cama
        const flat = Math.max(0, 1 - d / bend);
        const wrinkle = 0.014 * flat * (Math.sin(fx * 1.35 + 0.4) * Math.cos(fz * 1.8 - 0.3) + 0.5 * Math.sin(fx * 3.1 + fz * 2.2));
        const a = (fx + fz) / cell;
        const b = (fx - fz) / cell;
        const p = puff * Math.pow(Math.abs(Math.sin(Math.PI * a) * Math.sin(Math.PI * b)), 0.7);
        const nh = Math.sin(th);
        const ny = Math.cos(th);
        pos.setXYZ(
            i,
            Math.max(fx, x0) + dirX * (out + nh * p),
            top - (r - r * Math.cos(th)) - fall + ny * p + wrinkle,
            Math.min(fz, z1) + dirZ * (out + nh * p)
        );
        uv.setXY(i, a, b);
    }
    geo.computeVertexNormals();
    return geo;
}

function Bedding() {
    const quiltGeo = useMemo(() => quiltGeometry(), []);
    const quilt = useMemo(() => quiltTexture(), []);
    const back = useMemo(() => pillowTexture('#9e908f', 3), []);
    const front = useMemo(() => pillowTexture('#d2c7ba', 8), []);
    const cushion = useMemo(() => cushionTexture(), []);
    return (
        <group>
            <Rounded size={[5.86, 0.48, 2.85]} radius={0.08} position={[1.92, 0.73, -3.5]} color="#f4f2ee" roughness={0.9} />
            <mesh geometry={quiltGeo} castShadow receiveShadow>
                <meshStandardMaterial map={quilt} roughness={0.95} side={THREE.DoubleSide} />
            </mesh>

            {/* travesseiro em pé encostado na cabeceira e o outro deitado na frente */}
            <Soft size={[0.32, 0.8, 1.95]} round={0.45} pinch={0.6} map={back} position={[4.6, 1.42, -3.28]} rotation={[0, 0.04, -0.55]} />
            <Soft size={[0.92, 0.3, 2.05]} round={0.45} pinch={0.6} map={front} position={[4.0, 1.15, -3.22]} rotation={[0, 0.06, 0.1]} />

            {/* almofada felpuda no canto, encostada na parede e na cabeceira */}
            <group position={[4.5, 1.42, -4.56]} rotation-y={-0.55}>
                <Soft size={[0.9, 0.9, 0.3]} map={cushion} bumpMap={cushion} bumpScale={1.2} roughness={1} rotation-x={-0.18} />
            </group>

            <Cap position={[3.9, 1.3, -2.9]} rotation-y={-2.95} />
            <Lanyard />
        </group>
    );
}

// Boné preto largado em cima do travesseiro
function Cap(props) {
    return (
        <group {...props}>
            <mesh scale={[1, 0.72, 1]} castShadow receiveShadow>
                <sphereGeometry args={[0.19, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#17181b" roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0.15, 0.01, 0]} rotation-z={-0.12} scale={[1, 1, 0.92]} castShadow receiveShadow>
                <cylinderGeometry args={[0.17, 0.17, 0.016, 24, 1, false, 0, Math.PI]} />
                <meshStandardMaterial color="#17181b" roughness={0.85} />
            </mesh>
            <Box size={[0.012, 0.055, 0.085]} position={[0.168, 0.07, 0]} rotation-z={0.75} color="#c9cacd" roughness={0.6} shadow={false} />
            <Cyl args={[0.014, 0.014, 0.012, 10]} position={[0, 0.137, 0]} color="#17181b" roughness={0.85} />
        </group>
    );
}

// Cordão azul pendurado na barra cromada do lado do criado-mudo
function Lanyard() {
    const tex = useMemo(() => lanyardTexture(), []);
    return (
        <group position={[5.06, 2.12, -2.335]} rotation-y={0.35}>
            <mesh position={[-0.02, -0.46, 0.012]} rotation-z={0.05} castShadow>
                <boxGeometry args={[0.06, 0.94, 0.008]} />
                <meshStandardMaterial map={tex} roughness={0.7} />
            </mesh>
            <mesh position={[0.02, -0.4, -0.012]} rotation-z={-0.06} castShadow>
                <boxGeometry args={[0.06, 0.82, 0.008]} />
                <meshStandardMaterial map={tex} roughness={0.7} />
            </mesh>
            <Box size={[0.05, 0.08, 0.03]} position={[0, -0.94, 0]} color={C.black} roughness={0.5} />
        </group>
    );
}

function Phone({ t, onSelect, showLabels, active }) {
    const tex = useMemo(() => phoneScreenTexture(), []);
    const screen = useRef();
    useFrame(() => {
        screen.current.color.setScalar(lerp(0.85, 1.2, dayNight.mix));
    });
    return (
        <Hotspot
            id="contact"
            label={t.ui.nav.contact}
            onSelect={onSelect}
            showLabel={showLabels}
            active={active}
            labelPosition={[0, 0.85, 0]}
            position={[2.55, 1.073, -2.75]}
            rotation-y={0.45}
            hit={{ size: [1.1, 0.5, 1.3], position: [0, 0.2, 0] }}
        >
            {/* tamanho de celular de verdade; a área de clique continua grande */}
            <Rounded size={[0.3, 0.035, 0.62]} radius={0.016} color="#141518" roughness={0.3} />
            <mesh name="screen-contact" position={[0, 0.019, 0]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[0.27, 0.57]} />
                <meshBasicMaterial ref={screen} map={tex} toneMapped={false} />
            </mesh>
        </Hotspot>
    );
}

// Luminária de cobre: base redonda preta, haste fina e a cúpula inclinada. Acende à noite.
function CopperLamp(props) {
    const light = useRef();
    const bulb = useRef();
    const inner = useRef();
    useFrame(() => {
        const m = dayNight.mix;
        light.current.intensity = lerp(0, 4.5, m);
        bulb.current.emissiveIntensity = lerp(0, 7, m);
        inner.current.emissiveIntensity = lerp(0, 1.4, m);
    });
    return (
        <group {...props}>
            <Cyl args={[0.13, 0.14, 0.03, 32]} position={[0, 0.015, 0]} color={C.black} roughness={0.35} metalness={0.4} />
            <Cyl args={[0.012, 0.012, 0.74, 10]} position={[0, 0.4, 0]} color={C.black} roughness={0.35} metalness={0.4} />
            <Cyl args={[0.01, 0.01, 0.12, 8]} position={[-0.06, 0.76, 0]} rotation-z={Math.PI / 2} color={C.black} roughness={0.35} metalness={0.4} />
            <group position={[-0.13, 0.7, 0]} rotation-z={-0.28}>
                <Cyl args={[0.052, 0.052, 0.1, 28]} position={[0, 0.14, 0]} color={COPPER} roughness={0.3} metalness={0.5} />
                <mesh position={[0, 0.09, 0]} rotation-x={-Math.PI / 2}>
                    <ringGeometry args={[0.05, 0.086, 32]} />
                    <meshStandardMaterial color={COPPER} roughness={0.3} metalness={0.5} />
                </mesh>
                <mesh castShadow>
                    <cylinderGeometry args={[0.086, 0.086, 0.18, 32, 1, true]} />
                    <meshStandardMaterial color={COPPER} roughness={0.3} metalness={0.5} />
                </mesh>
                <mesh>
                    <cylinderGeometry args={[0.083, 0.083, 0.178, 32, 1, true]} />
                    <meshStandardMaterial ref={inner} color="#d9a27a" emissive="#ffb066" emissiveIntensity={0} roughness={0.5} side={THREE.BackSide} />
                </mesh>
                <mesh position={[0, -0.03, 0]}>
                    <sphereGeometry args={[0.045, 16, 12]} />
                    <meshStandardMaterial ref={bulb} color="#fff3df" emissive="#ffcf8a" emissiveIntensity={0} roughness={0.3} />
                </mesh>
            </group>
            {/* a luz sai da boca da cúpula, na altura dela, sem estourar o travesseiro e a coluna */}
            <pointLight ref={light} position={[-0.42, 0.6, 0.05]} color="#ffb36b" intensity={0} distance={5.5} decay={1.6} />
        </group>
    );
}

// Difusor de varetas: frasco de vidro, líquido âmbar e as varetas abertas em leque
const REEDS = [
    [0.22, 0.1],
    [0.14, -0.2],
    [-0.05, 0.24],
    [-0.2, -0.06],
    [0.05, -0.27],
    [-0.16, 0.18],
    [0.26, -0.08]
];

function Diffuser(props) {
    return (
        <group {...props}>
            <mesh position={[0, 0.065, 0]}>
                <boxGeometry args={[0.13, 0.13, 0.13]} />
                <meshStandardMaterial color="#e3f0ec" transparent opacity={0.32} roughness={0.05} metalness={0.1} depthWrite={false} />
            </mesh>
            <Box size={[0.112, 0.07, 0.112]} position={[0, 0.038, 0]} color="#8a6a3a" roughness={0.25} shadow={false} />
            <Cyl args={[0.026, 0.03, 0.035, 14]} position={[0, 0.145, 0]} color="#2a2a2c" roughness={0.4} />
            {REEDS.map(([rx, rz], i) => (
                <group key={i} position={[0, 0.15, 0]} rotation={[rx, 0, rz]}>
                    <Cyl args={[0.0055, 0.0055, 0.42, 5]} position={[0, 0.19, 0]} color="#7b4b2a" roughness={0.8} />
                </group>
            ))}
        </group>
    );
}

// Criado-mudo: corpo e tampo grafite, 3 gavetas grafite com filete de teca no topo,
// base de teca (rodapé + pés). A frente fica virada para a cama (-x).
function Nightstand() {
    const teak = useMemo(() => teakTexture(), []);
    const creatine = useMemo(() => creatineTexture(), []);
    const top = 1.3;
    return (
        <group>
            {/* base de teca */}
            {[4.2, 5.16].flatMap((x) =>
                [-1.89, -0.91].map((z) => <Box key={`${x}${z}`} size={[0.1, 0.22, 0.1]} position={[x, 0.11, z]} map={teak} color="#ffffff" roughness={0.5} />)
            )}
            <Box size={[0.07, 0.12, 1.08]} position={[4.185, 0.26, -1.4]} map={teak} color="#ffffff" roughness={0.5} />
            <Box size={[1.06, 0.12, 0.07]} position={[4.69, 0.26, -0.885]} map={teak} color="#ffffff" roughness={0.5} />
            <Box size={[1.06, 0.12, 0.07]} position={[4.69, 0.26, -1.915]} map={teak} color="#ffffff" roughness={0.5} />

            {/* corpo e tampo */}
            <Rounded size={[1.06, 0.98, 1.1]} radius={0.014} position={[4.72, 0.81, -1.4]} color={GRAPHITE} roughness={0.62} />
            <Rounded size={[1.13, 0.05, 1.1]} radius={0.014} position={[4.685, top - 0.025, -1.4]} color={GRAPHITE} roughness={0.55} />

            {/* gavetas */}
            {[0, 1, 2].map((k) => {
                const y = 0.335 + k * 0.305;
                return (
                    <group key={k}>
                        <Rounded size={[0.05, 0.215, 1.04]} radius={0.01} position={[4.155, y + 0.108, -1.4]} color={GRAPHITE} roughness={0.6} />
                        <Box size={[0.04, 0.072, 1.04]} position={[4.165, y + 0.253, -1.4]} map={teak} color="#ffffff" roughness={0.45} />
                    </group>
                );
            })}

            {/* em cima: luminária, difusor, latinha, creatina, controle e estojo */}
            <CopperLamp position={[4.96, top, -1.68]} rotation-y={-0.8} />
            <Diffuser position={[4.92, top, -1.42]} rotation-y={0.3} />
            <Box size={[0.32, 0.016, 0.24]} position={[4.56, top + 0.008, -1.22]} rotation-y={0.2} color="#6e4c30" roughness={0.6} />
            <Cyl args={[0.1, 0.1, 0.05, 32]} position={[4.56, top + 0.041, -1.22]} color="#f2f1ec" roughness={0.35} />
            <Cyl args={[0.102, 0.102, 0.01, 32]} position={[4.56, top + 0.05, -1.22]} color="#d4dde3" roughness={0.3} />
            <group position={[5.0, top - 0.02, -1.08]} rotation-y={-0.6}>
                <Soft size={[0.3, 0.6, 0.14]} round={0.2} pinch={0.85} map={creatine} position={[0, 0.3, 0]} roughness={0.5} />
                <Box size={[0.28, 0.07, 0.016]} position={[0.005, 0.6, 0.012]} rotation={[0.35, 0, 0.05]} color="#1d1f22" roughness={0.6} />
            </group>
            <group position={[4.4, top + 0.016, -1.55]} rotation-y={0.45}>
                <Rounded size={[0.42, 0.032, 0.1]} radius={0.014} color="#141518" roughness={0.45} />
                {[-0.12, -0.06, 0, 0.06].map((x) => (
                    <Cyl key={x} args={[0.012, 0.012, 0.01, 10]} position={[x, 0.018, 0]} color={x < -0.1 ? '#b8322c' : '#55575c'} roughness={0.5} />
                ))}
            </group>
            <Rounded size={[0.32, 0.06, 0.15]} radius={0.028} position={[4.46, top + 0.03, -1.8]} rotation-y={-0.25} color="#202124" roughness={0.7} />
        </group>
    );
}

// Tapete felpudo: base com tufos em relevo e beirada irregular, coberta por camadas de pelo.
// Cada camada mostra só os fios mais altos que ela (textura `pile`) e é um pouco deslocada
// para o lado em que o tufo tomba, então os fios ficam compridos e inclinados como num shaggy.
const RUG = { x0: -0.7, x1: 3.9, z0: -1.95, z1: 1.9 };
// `layers`: 12 camadas no computador, 6 no celular (cada camada é o tapete inteiro desenhado de novo)
const PILE = { layers: 12, compactLayers: 6, height: 0.085, lean: 0.07 };

function rugGeometries(layers) {
    const w = RUG.x1 - RUG.x0;
    const d = RUG.z1 - RUG.z0;
    const base = new THREE.PlaneGeometry(w, d, 100, 84);
    base.rotateX(-Math.PI / 2);
    const pos = base.attributes.position;
    const uv = base.attributes.uv;
    const edges = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let z = pos.getZ(i);
        // os fios da borda escapam um pouco para fora
        const fringe = 0.03 * (Math.sin(x * 13.1 + z * 9.3) + 0.7 * Math.sin(x * 31.7 - z * 27.9));
        if (Math.abs(x) > w / 2 - 1e-4) x += Math.sign(x) * fringe;
        if (Math.abs(z) > d / 2 - 1e-4) z += Math.sign(z) * fringe;
        const edge = Math.min(w / 2 - Math.abs(x), d / 2 - Math.abs(z));
        const f = THREE.MathUtils.smoothstep(edge, -0.04, 0.2);
        // tufos: ondas cruzadas em várias escalas
        const tuft =
            0.5 * Math.sin(x * 5.3 + 1.7) * Math.sin(z * 4.7 + 0.3) +
            0.3 * Math.sin(x * 11.9 - z * 7.1 + 2.0) * Math.sin(z * 13.3 + x * 5.2) +
            0.2 * Math.sin(x * 23.0 + z * 19.0) * Math.sin(z * 29.0 - x * 13.0);
        pos.setXYZ(i, x, 0.01 + f * (0.035 + 0.02 * tuft), z);
        uv.setXY(i, (x + w / 2) / w, (z + d / 2) / d);
        edges[i] = f;
    }
    base.computeVertexNormals();

    // as camadas reaproveitam uv, normais e índices da base; só a posição muda
    const shells = Array.from({ length: layers }, (_, k) => {
        const t = (k + 1) / layers;
        const out = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const f = edges[i];
            // direção para onde o tufo tomba, mudando devagar pelo tapete
            const a = 2.4 * Math.sin(x * 1.7 + z * 0.9) + 1.9 * Math.sin(z * 2.3 - x * 1.1 + 1.3);
            const lean = PILE.lean * (0.6 + 0.4 * Math.sin(x * 3.1 + z * 2.7)) * Math.pow(t, 1.6);
            out[i * 3] = x + Math.cos(a) * lean;
            out[i * 3 + 1] = pos.getY(i) + t * PILE.height * (0.45 + 0.55 * f);
            out[i * 3 + 2] = z + Math.sin(a) * lean;
        }
        const geo = new THREE.BufferGeometry();
        geo.setIndex(base.index);
        geo.setAttribute('position', new THREE.BufferAttribute(out, 3));
        geo.setAttribute('normal', base.attributes.normal);
        geo.setAttribute('uv', uv);
        return { geo, t };
    });
    return { base, shells };
}

// As camadas de pelo não gravam profundidade: são desenhadas de baixo para cima por cima da
// base, então o fio mais alto sempre cobre o de baixo e a oclusão (N8AO) não vira chuvisco.
function Rug({ compact }) {
    const layers = compact ? PILE.compactLayers : PILE.layers;
    const { base, shells } = useMemo(() => rugGeometries(layers), [layers]);
    const { color, pile } = useMemo(() => rugTextures(), []);
    return (
        <group position={[(RUG.x0 + RUG.x1) / 2, 0, (RUG.z0 + RUG.z1) / 2]}>
            <mesh geometry={base} receiveShadow>
                <meshStandardMaterial map={color} color="#d8d2cb" roughness={1} />
            </mesh>
            {/* raiz do pelo um pouco mais escura (sombra entre os fios), ponta clara */}
            {shells.map(({ geo, t }, k) => (
                <mesh key={t} geometry={geo} renderOrder={k + 1} receiveShadow>
                    <meshStandardMaterial
                        map={color}
                        alphaMap={pile}
                        alphaTest={0.12 + 0.8 * t}
                        depthWrite={false}
                        color={Array(3).fill(lerp(0.58, 1.02, t))}
                        roughness={lerp(1, 0.75, t)}
                    />
                </mesh>
            ))}
        </group>
    );
}

export default function BedWall({ t, onSelect, showLabels, compact, focus }) {
    const frameWood = useMemo(() => mahoganyTexture(), []);
    const ball = useMemo(() => ballTexture(), []);
    return (
        <group>
            {/* estrutura da cama de solteiro, no mesmo mogno da cabeceira */}
            <Box size={[5.8, 0.1, 2.75]} position={[1.96, 0.05, -3.5]} color="#2a160e" roughness={0.7} />
            <Box size={[6.02, 0.4, 2.95]} position={[1.96, 0.3, -3.5]} map={frameWood} color="#ffffff" roughness={0.45} />
            <Headboard />
            <Bedding />

            <Phone t={t} onSelect={onSelect} showLabels={showLabels} active={focus === 'contact'} />

            <Nightstand />

            {/* pôsteres dos filmes favoritos (artes minimalistas próprias) */}
            <Poster kind="pulp" position={[3.0, 4.15, -4.97]} />
            <Poster kind="fight" position={[4.25, 4.15, -4.97]} />
            <Poster kind="beauty" position={[3.0, 2.7, -4.97]} />
            <Poster kind="basterds" position={[4.25, 2.7, -4.97]} />

            {/* tapete felpudo e a bola de futevôlei */}
            <Rug compact={compact} />
            <mesh position={[3.15, 0.45, 1.15]} rotation={[0.4, 0.8, 0.2]} castShadow receiveShadow>
                <sphereGeometry args={[0.4, 32, 24]} />
                <meshStandardMaterial map={ball} roughness={0.55} />
            </mesh>
        </group>
    );
}
