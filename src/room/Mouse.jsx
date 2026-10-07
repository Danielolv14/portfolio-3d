// Mouse ATK VXE Dragonfly R1 preto fosco, à direita do teclado: simétrico, 120,6 × 64,1 × 37,6 mm, com a
// corcova suave atrás do meio, os botões principais separados por um vinco, a roda de rolagem com
// ranhuras e dois botões laterais do lado esquerdo.
// Casco, roda e botões laterais são UMA malha só (uma chamada de desenho), com as cores num canvas.
//
// Medidas em milímetros, como no teclado: x para a direita de quem usa, y para cima e z para trás
// (na direção da pessoa). No fim vira a escala do quarto e é girado para a frente apontar para o monitor.
import { useMemo } from 'react';
import * as THREE from 'three';

import { drawTexture, MeshBuilder } from './Keyboard';

const LENGTH = 120.6;
// Metade da largura ao longo do comprimento (s = 0 na ponta da frente, 1 no fim da traseira):
// frente larga, uma cintura leve no meio e a parte mais larga (64,1 mm) embaixo da palma
const HALF_WIDTH = [[0, 29.4], [0.16, 30.5], [0.34, 29.6], [0.5, 29.2], [0.68, 31.2], [0.8, 32.05], [0.92, 31.4], [1, 30]];
// Altura do meio do casco: sobe devagar desde os botões até a corcova (37,6 mm), um pouco atrás do meio
const TOP_HEIGHT = [[0, 19.5], [0.1, 23], [0.22, 27], [0.36, 31.2], [0.5, 35.2], [0.62, 37.6], [0.72, 37.1], [0.83, 33.8], [0.93, 27.5], [1, 21]];
// Arredondamento das pontas (mm): a frente é mais reta, a traseira mais redonda
const ENDS = { plan: [12, 30], side: [7, 15] };
// Seção transversal: superelipse (expoentes maiores = lateral mais reta e topo mais chato)
const SECTION = { x: 2.2, y: 1.9 };
// Os botões principais vão até aqui; a roda fica no vão entre eles
const BUTTONS_END = 0.44;
const WHEEL = { s: 0.19, r: 10, w: 7, rise: 3.6 };
const SLOT = { s0: 0.075, s1: 0.31, hx: 5.4, depth: 3.2 };
// Botões laterais (esquerda): começo e fim no comprimento, altura do meio
const SIDE_BUTTONS = [[0.335, 0.485], [0.5, 0.645]];
const SIDE_Y = 20;

// Escala do quarto e o atlas de cores (o casco usa a parte da esquerda)
const TO_ROOM = new THREE.Matrix4().makeScale(0.0035, 0.00215, 0.0035);
const ATLAS = 512;
const SHELL_W = 400;
const WHEEL_U = [412, 452];
const SIDE_U = 474;
const BOTTOM_U = 504;
const COLORS = { shell: '#17181b', seam: '#060607', slot: '#08080a', wheel: '#2e2f33', ridge: '#111214', side: '#1e1f23', bottom: '#0d0d0f' };

// Curva suave que passa pelos pontos [s, valor] (Hermite com as inclinações dos vizinhos)
function smoothCurve(pts) {
    const slope = pts.map((_, i) => {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(pts.length - 1, i + 1)];
        return (b[1] - a[1]) / (b[0] - a[0]);
    });
    return (s) => {
        let i = 0;
        while (i < pts.length - 2 && s > pts[i + 1][0]) i++;
        const [s0, y0] = pts[i];
        const [s1, y1] = pts[i + 1];
        const h = s1 - s0;
        const t = (s - s0) / h;
        const t2 = t * t;
        const t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * slope[i] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * slope[i + 1];
    };
}
const halfWidth = smoothCurve(HALF_WIDTH);
const topHeight = smoothCurve(TOP_HEIGHT);

// Fator que leva a medida até 0 nas pontas, num arco (p = 2 é redondo; maior = mais reto)
function endRound(s, [front, back], p = 2.4) {
    const d = Math.min(s * LENGTH, front) / front;
    const e = Math.min((1 - s) * LENGTH, back) / back;
    const f = (1 - (1 - d) ** p) ** (1 / p);
    const g = (1 - (1 - e) ** 2) ** (1 / 2);
    return f * g;
}
const smoothstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

// Parâmetro da seção: q vai de -1 (base, lado direito) a 1 (base, lado esquerdo), passando pelo topo em 0.
// Os pontos ficam mais juntos perto do topo, onde estão o vinco e o vão da roda.
const Q_POW = 1.6;
const angleOf = (q) => Math.PI / 2 + (Math.PI / 2) * Math.sign(q) * Math.abs(q) ** Q_POW;
// q do ponto do lado direito que está a uma fração `f` da meia largura (para desenhar as costuras)
const qOfFraction = (f) => -(((Math.PI / 2 - Math.acos(f ** (SECTION.x / 2))) / (Math.PI / 2)) ** (1 / Q_POW));

// Ponto do casco na posição s (comprimento) e q (seção)
function shellPoint(s, q) {
    const a = angleOf(q);
    const c = Math.cos(a);
    const sn = Math.abs(Math.sin(a));
    const hw = halfWidth(s) * endRound(s, ENDS.plan, 3);
    const h = topHeight(s) * endRound(s, ENDS.side);
    // perto da base a lateral entra um pouco (o mouse "assenta" no mousepad)
    const x = hw * Math.sign(c) * Math.abs(c) ** (2 / SECTION.x) * (1 - 0.05 * (1 - sn) ** 3);
    let y = h * sn ** (2 / SECTION.y);
    // vinco entre os botões e o vão da roda (afundados no meio do casco)
    y -= 0.9 * Math.exp(-((x / 1.1) ** 2)) * (1 - smoothstep(BUTTONS_END - 0.04, BUTTONS_END + 0.02, s));
    y -= SLOT.depth * (1 - smoothstep(SLOT.hx - 1.2, SLOT.hx, Math.abs(x))) * smoothstep(SLOT.s0, SLOT.s0 + 0.02, s) * (1 - smoothstep(SLOT.s1 - 0.02, SLOT.s1, s));
    return [x, Math.max(0, y), s * LENGTH - LENGTH / 2];
}
const shellUV = (s, q) => [((q + 1) / 2) * (SHELL_W / ATLAS), 1 - s];

function addShell(b) {
    const stations = 64;
    const around = 97;
    let prev = -1;
    for (let k = 0; k <= stations; k++) {
        // mais estações perto das pontas, onde a forma muda rápido
        const s = 0.5 - 0.5 * Math.cos((k / stations) * Math.PI);
        const qs = Array.from({ length: around }, (_, j) => -1 + (2 * j) / (around - 1));
        const first = b.add(
            qs.map((q) => shellPoint(s, q)),
            qs.map((q) => shellUV(s, q))
        );
        if (prev >= 0) b.band(prev, first, around, false);
        prev = first;
    }
    // fundo liso, virado para baixo: uma escada entre a borda direita e a esquerda
    const uv = [BOTTOM_U / ATLAS, 0.5];
    for (let k = 0; k < stations; k++) {
        const s0 = 0.5 - 0.5 * Math.cos((k / stations) * Math.PI);
        const s1 = 0.5 - 0.5 * Math.cos(((k + 1) / stations) * Math.PI);
        const i = b.add([shellPoint(s0, -1), shellPoint(s1, -1), shellPoint(s0, 1), shellPoint(s1, 1)], [uv, uv, uv, uv]);
        b.index.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    }
}

// Roda de rolagem: banda de borracha com ranhuras (desenhadas no canvas) e as duas laterais
function addWheel(b) {
    const z = WHEEL.s * LENGTH - LENGTH / 2;
    const top = shellPoint(WHEEL.s, 0)[1] + SLOT.depth;
    const yc = top + WHEEL.rise - WHEEL.r;
    const n = 48;
    // o ângulo começa embaixo (escondido no casco), onde a textura dá a volta
    const circle = (x, r) => Array.from({ length: n + 1 }, (_, j) => {
        const a = Math.PI + (j / n) * Math.PI * 2;
        return [x, yc + r * Math.cos(a), z + r * Math.sin(a)];
    });
    const tread = (x, r) => {
        const pts = circle(x, r);
        const u = (WHEEL_U[0] + ((x + WHEEL.w / 2) / WHEEL.w) * (WHEEL_U[1] - WHEEL_U[0])) / ATLAS;
        return b.add(pts, pts.map((_, j) => [u, 1 - j / n]));
    };
    const hw = WHEEL.w / 2;
    const rings = [tread(-hw, WHEEL.r - 0.8), tread(-hw + 0.7, WHEEL.r), tread(hw - 0.7, WHEEL.r), tread(hw, WHEEL.r - 0.8)];
    for (let i = 1; i < rings.length; i++) b.band(rings[i - 1], rings[i], n + 1, false);
    const flat = [WHEEL_U[0] / ATLAS + 0.004, 0.02];
    for (const [x, flip] of [[-hw, true], [hw, false]]) {
        const pts = circle(x, WHEEL.r - 0.8);
        const ring = b.add(pts, pts.map(() => flat));
        b.fan(ring, b.add([[x, yc, z]], [flat]), n + 1, flip);
    }
}

// Botão lateral: pastilha arredondada saindo da lateral esquerda. É montada deitada (a, c no plano,
// d para fora) e depois virada para o lado: (a, d, c) -> (x - d, -c, a), uma rotação de verdade.
function addSideButton(b, [s0, s1]) {
    const sm = (s0 + s1) / 2;
    // onde a lateral esquerda está, na altura do botão
    let q = 0.6;
    for (let i = 0; i < 40 && shellPoint(sm, q)[1] > SIDE_Y; i++) q += 0.01;
    const xs = shellPoint(sm, q)[0];
    const ha = ((s1 - s0) * LENGTH) / 2;
    const ca = sm * LENGTH - LENGTH / 2;
    const uv = [SIDE_U / ATLAS, 0.5];
    const layers = [[-1.2, 0, 2.6], [0.7, 0.15, 2.5], [1.3, 0.7, 2.1], [1.5, 1.6, 1.4]];
    let prev = -1;
    let n = 0;
    for (const [d, inset, r] of layers) {
        const pts = [];
        for (let qd = 0; qd < 4; qd++) {
            const sa = qd === 0 || qd === 3 ? 1 : -1;
            const sc = qd < 2 ? -1 : 1;
            for (let i = 0; i <= 3; i++) {
                const t = ((qd + i / 3) * Math.PI) / 2;
                const a = ca + sa * (ha - inset - r) + r * Math.cos(t);
                const c = -SIDE_Y + sc * (3.1 - inset - r) - r * Math.sin(t);
                pts.push([xs - d, -c, a]);
            }
        }
        n = pts.length;
        const first = b.add(pts, pts.map(() => uv));
        if (prev >= 0) b.band(prev, first, n);
        prev = first;
    }
    b.fan(prev, b.add([[xs - 1.5, SIDE_Y, ca]], [uv]), n);
}

// Cores: casco fosco com as costuras dos botões, o vão escuro da roda, ranhuras da roda e o resto liso
function mouseTexture() {
    return drawTexture(ATLAS, ATLAS, (ctx) => {
        ctx.fillStyle = COLORS.shell;
        ctx.fillRect(0, 0, SHELL_W, ATLAS);
        const px = (q) => ((q + 1) / 2) * SHELL_W;
        const py = (s) => s * ATLAS;
        ctx.strokeStyle = COLORS.seam;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        // costuras dos botões: descem pelas laterais e cruzam o casco no fim dos botões
        const side = (s) => qOfFraction(0.8 - 0.14 * (s / BUTTONS_END));
        for (const sign of [1, -1]) {
            ctx.beginPath();
            for (let s = 0; s <= BUTTONS_END; s += 0.01) ctx.lineTo(px(sign * side(s)), py(s));
            ctx.stroke();
        }
        const edge = -side(BUTTONS_END);
        ctx.beginPath();
        for (let q = -edge; q <= edge + 1e-6; q += edge / 20) ctx.lineTo(px(q), py(BUTTONS_END + 0.02 * (1 - (q / edge) ** 2)));
        ctx.stroke();
        // vinco no meio, entre os botões
        ctx.beginPath();
        ctx.moveTo(px(0), 0);
        ctx.lineTo(px(0), py(BUTTONS_END + 0.02));
        ctx.stroke();
        // vão da roda (cantos arredondados com arcTo: ctx.roundRect não existe nos navegadores mais antigos)
        const slotQ = -qOfFraction(SLOT.hx / 30);
        const [x0, x1, y0, y1, r] = [px(-slotQ), px(slotQ), py(SLOT.s0), py(SLOT.s1), 10];
        ctx.fillStyle = COLORS.slot;
        ctx.beginPath();
        ctx.moveTo(x0 + r, y0);
        ctx.arcTo(x1, y0, x1, y1, r);
        ctx.arcTo(x1, y1, x0, y1, r);
        ctx.arcTo(x0, y1, x0, y0, r);
        ctx.arcTo(x0, y0, x1, y0, r);
        ctx.fill();
        // roda: borracha com ranhuras
        ctx.fillStyle = COLORS.wheel;
        ctx.fillRect(WHEEL_U[0], 0, WHEEL_U[1] - WHEEL_U[0], ATLAS);
        ctx.fillStyle = COLORS.ridge;
        for (let y = 0; y < ATLAS; y += ATLAS / 36) ctx.fillRect(WHEEL_U[0] + 4, y, WHEEL_U[1] - WHEEL_U[0] - 8, ATLAS / 72);
        ctx.fillStyle = COLORS.side;
        ctx.fillRect(SIDE_U - 10, 0, 20, ATLAS);
        ctx.fillStyle = COLORS.bottom;
        ctx.fillRect(BOTTOM_U - 6, 0, 12, ATLAS);
    });
}

function buildMouse() {
    const b = new MeshBuilder();
    addShell(b);
    addWheel(b);
    SIDE_BUTTONS.forEach((range) => addSideButton(b, range));
    return { geometry: b.geometry().applyMatrix4(TO_ROOM), map: mouseTexture() };
}

export function Mouse() {
    const { geometry, map } = useMemo(buildMouse, []);
    // a frente aponta para o monitor (-x), um pouquinho virada para o teclado, como na mão
    return (
        <mesh geometry={geometry} position={[-3.95, 1.5805, -3.95]} rotation-y={Math.PI / 2 + 0.1} castShadow receiveShadow>
            <meshStandardMaterial map={map} roughness={0.6} />
        </mesh>
    );
}
