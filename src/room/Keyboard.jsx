// Teclado Ajazz AK820 preto: 75% com 81 teclas PBT de perfil OEM, legendas brancas, knob de alumínio no
// canto e RGB virado para baixo (à noite, um brilho leve entre as teclas). Fica no mousepad, na frente do monitor.
//
// Desempenho: as 81 teclas, o gabinete e a placa são UMA malha só, com as legendas num atlas de canvas
// (o topo de cada tecla aponta para o retângulo dela no atlas). 81 malhas seriam 81 chamadas de desenho,
// e no celular é isso que pesa. O knob é a 2ª malha, porque é de metal (outro material).
//
// Tudo é montado em milímetros: x para a direita de quem digita, y para cima e z na direção de quem
// digita. No fim vira a escala do quarto e é girado para a frente apontar para +x (para a cadeira).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { chromeEnvTexture } from '../textures';
import { dayNight, lerp } from './shared';

// ---------------------------------------------------------------------------------------------
// Peças de montagem (o mouse também usa)
// ---------------------------------------------------------------------------------------------

// Junta pontos e triângulos de várias peças numa geometria só. Pontos compartilhados entre
// faixas vizinhas deixam a quina suave; um anel novo no mesmo lugar deixa a quina viva.
export class MeshBuilder {
    constructor() {
        this.pos = [];
        this.uv = [];
        this.index = [];
    }

    // Uma linha (ou anel) de pontos [x, y, z] com as coordenadas de textura [u, v]; devolve o índice do 1º
    add(points, uvs) {
        const first = this.pos.length / 3;
        points.forEach((p, i) => {
            this.pos.push(p[0], p[1], p[2]);
            this.uv.push(uvs[i][0], uvs[i][1]);
        });
        return first;
    }

    // Faixa de triângulos entre duas linhas de n pontos (a e b). A face fica virada para
    // (sentido da linha) × (de a para b): nos anéis de roundRect, subir = para fora e entrar = para cima.
    band(a, b, n, closed = true) {
        for (let j = 0; j < (closed ? n : n - 1); j++) {
            const k = (j + 1) % n;
            this.index.push(a + j, a + k, b + k, a + j, b + k, b + j);
        }
    }

    // Tampa: liga o anel a um ponto do meio (`flip` vira a face para o outro lado)
    fan(ring, center, n, flip = false) {
        for (let j = 0; j < n; j++) {
            const k = (j + 1) % n;
            if (flip) this.index.push(ring + k, ring + j, center);
            else this.index.push(ring + j, ring + k, center);
        }
    }

    geometry() {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
        geo.setIndex(this.index);
        geo.computeVertexNormals();
        return geo;
    }
}

// Contorno de retângulo arredondado no plano x/z (centro, metades da largura e da profundidade, raio).
// O sentido dos pontos é o que deixa as faixas viradas para fora (ver MeshBuilder.band).
export function roundRect(cx, cz, hx, hz, r, segs = 3) {
    const pts = [];
    for (let q = 0; q < 4; q++) {
        const sx = q === 0 || q === 3 ? 1 : -1;
        const sz = q < 2 ? -1 : 1;
        for (let i = 0; i <= segs; i++) {
            const a = ((q + i / segs) * Math.PI) / 2;
            pts.push([cx + sx * (hx - r) + r * Math.cos(a), cz + sz * (hz - r) - r * Math.sin(a)]);
        }
    }
    return pts;
}

// Desenha num canvas e devolve a textura (cores em sRGB, como as outras do quarto)
export function drawTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
}

// ---------------------------------------------------------------------------------------------
// Medidas (mm)
// ---------------------------------------------------------------------------------------------
const U = 19.05; // 1u: o passo de uma tecla comum
const GAP = 0.9; // vão entre uma tecla e outra
// Gabinete 333 × 145 mm: metade da largura e da profundidade, raio dos cantos e altura na frente e atrás
const CASE = { hx: 333 / 2, hz: 145 / 2, r: 7, front: 19, back: 31 };
const RIM_MID = (CASE.front + CASE.back) / 2;
const SLOPE = (CASE.back - CASE.front) / (2 * CASE.hz); // ângulo de digitação (tangente)
const COS = Math.cos(Math.atan(SLOPE));
const SIN = Math.sin(Math.atan(SLOPE));
const rim = (z) => RIM_MID - SLOPE * z; // altura da borda de cima do gabinete
const DROP = 7; // a placa fica abaixo da borda: o gabinete esconde os switches
const LIFT = 5; // a borda de baixo das teclas fica acima da placa (é a altura do switch)
// Área das teclas: 16u × 6,25u (a linha de função tem um vão de 0,25u antes dos números)
const KEYS = { hx: (16 * U) / 2, hz: (6.25 * U) / 2 };
const WELL = { hx: KEYS.hx + 1.6, hz: KEYS.hz + 1.6, r: 3 }; // abertura do gabinete em volta das teclas
// mm -> quarto: 3,5 unidades por metro na horizontal e 2,15 na vertical (a escala do quarto)
const TO_ROOM = new THREE.Matrix4().makeScale(0.0035, 0.00215, 0.0035);

// Da placa (inclinada pelo ângulo de digitação, com y = 0 na placa) para o gabinete
const onPlate = ([x, y, z]) => [x, rim(0) - DROP + y * COS - z * SIN, y * SIN + z * COS];

// Layout ANSI 75%: [legenda, largura em u]; um número sozinho é um vão (só na linha de função)
const chars = (s) => [...s].map((c) => [c, 1]);
const ROWS = [
    [['Esc', 1], 0.5, ...['F1', 'F2', 'F3', 'F4'].map((f) => [f, 1]), 0.5, ...['F5', 'F6', 'F7', 'F8'].map((f) => [f, 1]), 0.5, ...['F9', 'F10', 'F11', 'F12'].map((f) => [f, 1])],
    [...chars('`1234567890-='), ['Backspace', 2], ['Del', 1]],
    [['Tab', 1.5], ...chars('QWERTYUIOP[]'), ['\\', 1.5], ['PgUp', 1]],
    [['Caps', 1.75], ...chars("ASDFGHJKL;'"), ['Enter', 2.25], ['PgDn', 1]],
    [['Shift', 2.25], ...chars('ZXCVBNM,./'), ['Shift', 1.75], ['↑', 1], ['End', 1]],
    [['Ctrl', 1.25], ['Win', 1.25], ['Alt', 1.25], ['', 6.25], ['Alt', 1], ['Fn', 1], ['Ctrl', 1], ['←', 1], ['↓', 1], ['→', 1]]
];
// O knob fica no fim da linha de função, na coluna do Del
const KNOB = { x: -KEYS.hx + 15.5 * U, z: -KEYS.hz + 0.5 * U, r: 9, h: 22 };

// Perfil OEM: cada fileira tem altura (mm) e inclinação do topo (graus; + = borda de trás mais alta).
// As de cima são mais altas e viradas para quem digita; as duas de baixo, ao contrário.
const PROFILE = [
    { h: 11.8, tilt: 9 }, // R1: função
    { h: 10.6, tilt: 5 }, // R2: números
    { h: 9.5, tilt: 1 }, // R3: QWERTY
    { h: 9.5, tilt: 1 }, // R3: ASDF
    { h: 10, tilt: -6 }, // R4: ZXCV
    { h: 10, tilt: -6 } // R4: espaço
];
// O topo é menor que a base (as laterais caem para fora) e fica um pouco puxado para trás
const TOP = { side: 2.7, back: 2.4, front: 3.2 };

function layout() {
    const keys = [];
    ROWS.forEach((items, row) => {
        const z = -KEYS.hz + (row + 0.5) * U + (row > 0 ? 0.25 * U : 0);
        let col = 0;
        for (const item of items) {
            if (typeof item === 'number') {
                col += item;
                continue;
            }
            const [label, w] = item;
            keys.push({ label, w, row, col, x: -KEYS.hx + (col + w / 2) * U, z });
            col += w;
        }
    });
    return keys;
}

// ---------------------------------------------------------------------------------------------
// Atlas: 1 linha por fileira de teclas (80 px por 1u) e, embaixo, uma faixa com a cor do gabinete
// e outra com a da placa. O mapa de brilho (emissive) usa a mesma divisão, com metade da resolução.
// ---------------------------------------------------------------------------------------------
const T = 80;
const ATLAS = { w: 16 * T, h: 7 * T };
const CASE_Y = 6.25 * T; // linha do atlas com a cor do gabinete
const PLATE_Y = 6.75 * T; // linha com a cor (e o brilho) da placa
const toUV = (px, py) => [px / ATLAS.w, 1 - py / ATLAS.h];
const atlasX = (x) => ((x + CASE.hx) / (2 * CASE.hx)) * ATLAS.w;

const COLORS = { key: '#17181b', legend: '#ecebe6', case: '#121315', plate: '#0b0b0d' };
// RGB por baixo das teclas: rosa (como o RGB do quarto) na esquerda, passando pelo roxo até o azul
const GLOW = ['#ff2bd6', '#9b4dff', '#2fb8ff'];
const glowAt = (t) => {
    const i = Math.min(1, Math.floor(t * 2));
    return new THREE.Color(GLOW[i]).lerp(new THREE.Color(GLOW[i + 1]), t * 2 - i).getStyle();
};

const SHIFTED = { '`': '~', 1: '!', 2: '@', 3: '#', 4: '$', 5: '%', 6: '^', 7: '&', 8: '*', 9: '(', 0: ')', '-': '_', '=': '+', '[': '{', ']': '}', '\\': '|', ';': ':', "'": '"', ',': '<', '.': '>', '/': '?' };
const ARROWS = { '→': 0, '↓': Math.PI / 2, '←': Math.PI, '↑': -Math.PI / 2 };
const FONT = 'Arial, Helvetica, sans-serif';

// Setinha desenhada (nem toda fonte tem o caractere), apontando no ângulo dado
function drawArrow(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(7, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(11, 0);
    ctx.lineTo(3, -6);
    ctx.lineTo(3, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function legendTexture(keys) {
    return drawTexture(ATLAS.w, ATLAS.h, (ctx) => {
        ctx.fillStyle = COLORS.key;
        ctx.fillRect(0, 0, ATLAS.w, CASE_Y - 0.25 * T);
        ctx.fillStyle = COLORS.case;
        ctx.fillRect(0, CASE_Y - 0.25 * T, ATLAS.w, 0.5 * T);
        ctx.fillStyle = COLORS.plate;
        ctx.fillRect(0, PLATE_Y - 0.25 * T, ATLAS.w, 0.5 * T);
        ctx.fillStyle = ctx.strokeStyle = COLORS.legend;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const key of keys) {
            // meio do topo da tecla dentro do retângulo dela (o topo é puxado um pouco para trás)
            const x = (key.col + key.w / 2) * T;
            const y = (key.row + 0.48) * T;
            const { label } = key;
            if (label in ARROWS) drawArrow(ctx, x, y, ARROWS[label]);
            else if (label in SHIFTED) {
                ctx.font = `600 19px ${FONT}`;
                ctx.fillText(SHIFTED[label], x, y - 11);
                ctx.fillText(label, x, y + 11);
            } else if (label.length === 1) {
                ctx.font = `600 26px ${FONT}`;
                ctx.fillText(label, x, y + 1);
            } else {
                ctx.font = `600 ${key.w > 1 ? 16 : 17}px ${FONT}`;
                ctx.fillText(label, x, y + 1);
            }
        }
    });
}

// Brilho do RGB: a placa inteira e a parte de baixo das laterais de cada tecla (a luz vaza por baixo)
function glowTexture(keys) {
    return drawTexture(ATLAS.w / 2, ATLAS.h / 2, (ctx) => {
        ctx.scale(0.5, 0.5);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ATLAS.w, ATLAS.h);
        for (const key of keys) {
            const x0 = key.col * T;
            const y0 = key.row * T;
            // só a beirada de baixo da tecla, mais fraca que a placa
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = glowAt((key.x + KEYS.hx) / (2 * KEYS.hx));
            ctx.fillRect(x0, y0, key.w * T, T);
            ctx.globalAlpha = 1;
            // o topo e o resto das laterais ficam apagados; a borda é suave
            ctx.filter = 'blur(2px)';
            ctx.fillStyle = '#000000';
            const inset = 0.05 * T;
            ctx.fillRect(x0 + inset, y0 + inset, key.w * T - 2 * inset, T - 2 * inset);
            ctx.filter = 'none';
        }
        const g = ctx.createLinearGradient(atlasX(-KEYS.hx), 0, atlasX(KEYS.hx), 0);
        GLOW.forEach((c, i) => g.addColorStop(i / (GLOW.length - 1), c));
        // mais fraca que a cor cheia: nos vãos largos (linha de função, knob) ela aparece inteira
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = g;
        ctx.fillRect(0, PLATE_Y - 0.25 * T, ATLAS.w, 0.5 * T);
    });
}

// ---------------------------------------------------------------------------------------------
// Geometria
// ---------------------------------------------------------------------------------------------

// Tecla: anéis da base até o topo (lateral levemente abaulada), topo inclinado conforme a fileira
// e com uma concavidade leve (cilíndrica, de um lado ao outro), fechado por um ponto no meio.
function addKey(b, key) {
    const P = PROFILE[key.row];
    const hx = (key.w * U - GAP) / 2;
    const hz = (U - GAP) / 2;
    const top = { cx: key.x, cz: key.z + (TOP.back - TOP.front) / 2, hx: hx - TOP.side, hz: hz - (TOP.back + TOP.front) / 2 };
    const slope = Math.tan(THREE.MathUtils.degToRad(P.tilt));
    const dish = key.w > 2.5 ? 0.2 : 0.55; // a barra de espaço é quase reta
    const topY = (x, z) => LIFT + P.h - slope * (z - top.cz) - dish * Math.max(0, 1 - ((x - top.cx) / top.hx) ** 2);
    const at = (t, a, c) => a + (c - a) * t;
    const inner = Math.min(top.hx, top.hz) * 0.55;
    const rings = [
        { cx: key.x, cz: key.z, hx, hz, r: 1, y: () => LIFT },
        { cx: key.x, cz: at(0.45, key.z, top.cz), hx: at(0.45, hx, top.hx) + 0.25, hz: at(0.45, hz, top.hz) + 0.25, r: 1.6, y: (x, z) => LIFT + 0.45 * (topY(x, z) - LIFT) },
        { ...top, r: 2.3, y: topY },
        { ...top, hx: top.hx - 1, hz: top.hz - 1, r: 1.6, y: topY },
        { ...top, hx: top.hx - inner, hz: top.hz - inner, r: 0.8, y: topY }
    ];
    // textura: projeção de cima no retângulo da tecla no atlas (as laterais pegam a borda lisa dele)
    const uvOf = ([x, , z]) => toUV((key.col + ((x - key.x + hx) / (2 * hx)) * key.w) * T, (key.row + (z - key.z + hz) / (2 * hz)) * T);
    let prev = -1;
    let n = 0;
    for (const ring of rings) {
        const pts = roundRect(ring.cx, ring.cz, ring.hx, ring.hz, ring.r).map(([x, z]) => [x, ring.y(x, z), z]);
        n = pts.length;
        const first = b.add(pts.map(onPlate), pts.map(uvOf));
        if (prev >= 0) b.band(prev, first, n);
        prev = first;
    }
    const c = [top.cx, topY(top.cx, top.cz), top.cz];
    b.fan(prev, b.add([onPlate(c)], [uvOf(c)]), n);
}

// Gabinete: parede de fora com o fundo chanfrado e a borda de cima arredondada, a moldura em volta
// das teclas, a parede de dentro descendo até a placa e o fundo.
function addCase(b) {
    const caseUV = ([x]) => toUV(atlasX(x), CASE_Y);
    const plateUV = ([x]) => toUV(atlasX(x), PLATE_Y);
    const ring = (inset, y, rect = CASE, uv = caseUV) => {
        const pts = roundRect(0, 0, rect.hx - inset, rect.hz - inset, Math.max(0.5, rect.r - inset)).map(([x, z]) => [x, y(z), z]);
        return [b.add(pts, pts.map(uv)), pts.length];
    };
    // [recuo, altura]: do fundo até a borda de cima
    const outer = [
        [1.2, () => 0],
        [0.2, () => 1.2],
        [0, () => 2.6],
        [0, (z) => rim(z) - 3],
        [0.25, (z) => rim(z) - 1.2],
        [1, (z) => rim(z) - 0.25],
        [2, rim],
        [3.2, rim]
    ];
    let prev = -1;
    let n = 0;
    for (const [inset, y] of outer) {
        const [first, count] = ring(inset, y);
        if (prev >= 0) b.band(prev, first, count);
        prev = first;
        n = count;
    }
    // moldura de cima até a abertura das teclas
    const [wellTop] = ring(0, rim, WELL);
    b.band(prev, wellTop, n);
    // parede de dentro: a parte de baixo pega a cor da placa (e o brilho do RGB à noite)
    const [wallTop] = ring(0, rim, WELL);
    const [wallBottom] = ring(0, (z) => rim(z) - DROP, WELL, plateUV);
    b.band(wallTop, wallBottom, n);
    const [plate] = ring(0, (z) => rim(z) - DROP, WELL, plateUV);
    b.fan(plate, b.add([[0, rim(0) - DROP, 0]], [plateUV([0])]), n);
    // fundo, virado para baixo
    const [bottom] = ring(1.2, () => 0);
    b.fan(bottom, b.add([[0, 0, 0]], [caseUV([0])]), n, true);
}

// Knob de alumínio usinado: lateral serrilhada (sulcos alternados), chanfro e topo liso
function knobGeometry() {
    const b = new MeshBuilder();
    const n = 96;
    const circle = (r, y, knurl = 0) =>
        Array.from({ length: n }, (_, j) => {
            const a = (j / n) * Math.PI * 2;
            const rr = r - (j % 2) * knurl;
            return onPlate([KNOB.x + rr * Math.cos(a), y, KNOB.z - rr * Math.sin(a)]);
        });
    const rings = [circle(KNOB.r, -1, 0.5), circle(KNOB.r, KNOB.h - 1.8, 0.5), circle(KNOB.r - 0.5, KNOB.h - 0.4), circle(KNOB.r - 1.3, KNOB.h), circle(KNOB.r - 4, KNOB.h)];
    const zero = Array.from({ length: n }, () => [0, 0]);
    let prev = -1;
    for (const pts of rings) {
        const first = b.add(pts, zero);
        if (prev >= 0) b.band(prev, first, n);
        prev = first;
    }
    b.fan(prev, b.add([onPlate([KNOB.x, KNOB.h, KNOB.z])], [[0, 0]]), n);
    return b.geometry().applyMatrix4(TO_ROOM);
}

function buildKeyboard() {
    const keys = layout();
    const b = new MeshBuilder();
    keys.forEach((key) => addKey(b, key));
    addCase(b);
    return {
        body: b.geometry().applyMatrix4(TO_ROOM),
        knob: knobGeometry(),
        legends: legendTexture(keys),
        glow: glowTexture(keys)
    };
}

export function Keyboard() {
    const parts = useMemo(buildKeyboard, []);
    const knobEnv = useMemo(() => chromeEnvTexture(), []);
    const body = useRef();
    const knob = useRef();
    // À noite o RGB acende devagar junto com o quarto; fica abaixo de 1 para o Bloom não pegar (é discreto)
    useFrame(() => {
        const m = dayNight.mix;
        body.current.emissiveIntensity = lerp(0, 0.4, m);
        knob.current.envMapIntensity = lerp(1, 0.25, m);
    });
    return (
        <group position={[-3.92, 1.5805, -2.95]} rotation-y={Math.PI / 2 + 0.04}>
            <mesh geometry={parts.body} castShadow receiveShadow>
                <meshStandardMaterial ref={body} map={parts.legends} emissive="#ffffff" emissiveMap={parts.glow} emissiveIntensity={0} roughness={0.72} />
            </mesh>
            {/* facetado de propósito: cada face da lateral vira um sulco do serrilhado */}
            <mesh geometry={parts.knob} castShadow receiveShadow>
                <meshStandardMaterial ref={knob} color="#c4c7cd" metalness={1} roughness={0.32} envMap={knobEnv} flatShading />
            </mesh>
        </group>
    );
}
