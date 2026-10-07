// Cadeira do Daniel: Elements Vector preta. Assento, encosto e apoio de cabeça em tela, apoio lombar
// ajustável, braços 6D com apoio de PU, mecanismo com alavancas, pistão com capa e base de nylon com
// rodízios. Com Projetos aberto no monitor ela rola para o lado, porque a câmera para bem onde fica o encosto.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { ring, roundedRectShape } from './parts';
import { lerp, MONITOR_POS } from './shared';

// Cadeira encostada na mesa (como na foto) e afastada para o lado, quando Projetos abre.
// x e z = posição no chão, rot = giro em volta do eixo y (radianos).
const CHAIR_HOME = { x: -2.45, z: -2.85, rot: 0.15 };
const CHAIR_AWAY = { x: -2.3, z: -4.1, rot: 1.0 };
// Ao fechar, a cadeira só volta quando a câmera já está a esta distância do monitor
const CHAIR_RETURN_DIST = 4;

// Cores (pretos diferentes para cada material, como na cadeira de verdade)
const COLOR = {
    frame: '#16171a', // moldura do encosto e peças de plástico
    nylon: '#131417', // base de nylon e capa do pistão
    steel: '#1d1e22', // mecanismo de aço pintado
    wheel: '#0b0c0e', // rodas de PU
    button: '#2a2b30',
    accent: '#e4e4e1' // filete claro no meio do encosto (igual ao da cadeira de verdade)
};

// ---------------------------------------------------------------------------------------------
// Medidas. Tudo é montado com a frente para +z e depois girado para a frente apontar para -x
// (a mesa). A altura segue a escala do quarto (2,15 unidades por metro); na horizontal a cadeira
// usa ~1,85 u/m, porque o quarto é comprimido e ela precisa caber entre a mesa e a cama.
// ---------------------------------------------------------------------------------------------
const UP = new THREE.Vector3(0, 1, 0);
const ACROSS = new THREE.Vector3(1, 0, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);
const WEAVE_SCALE = 9; // repetições da trama da tela por unidade

// Assento 50 × 47 cm: altura da tela, centro em z, meia largura, meia profundidade, cantos
const SEAT = { y: 1.0, cz: 0.02, hw: 0.46, hd: 0.44, n: 3.2 };
// Encosto 46 × 56 cm, inclinado para trás; `pivot` = meio da borda de baixo
const BACK = { h: 1.17, n: 4.2, pivot: new THREE.Vector3(0, 1.19, -0.4), tilt: -0.17 };
// Apoio de cabeça (altura e ângulo ajustáveis): fica numa haste atrás do encosto
const HEAD = { h: 0.3, n: 3, lift: 0.09, tilt: 0.14 };
// Base de nylon de 70 cm: raio até o rodízio
const LEG_TIP = 0.585;

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// Ponto da borda de um "quadrado arredondado" (superelipse) no ângulo a. n maior = cantos mais retos.
function squircle(a, n) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const r = (Math.abs(c) ** n + Math.abs(s) ** n) ** (-1 / n);
    return [c * r, s * r];
}

// Tela do assento: frente um pouco mais larga, concha leve e borda da frente caindo (waterfall)
const seatHalfWidth = (w) => SEAT.hw * (0.955 + 0.045 * w);
function seatPoint(u, w) {
    const front = Math.max(0, w - 0.7) / 0.3;
    return v3(u * seatHalfWidth(w), SEAT.y + 0.014 * (u ** 4 + w ** 4) - 0.035 * front * front, SEAT.cz + w * SEAT.hd);
}

// Encosto (coordenadas dele: y sobe pelo encosto, z aponta para quem senta): mais largo nos ombros,
// curvo para abraçar as costas e com a barriga do apoio lombar
const backHalfWidth = (w) => 0.4 + 0.045 * w - 0.02 * w * w;
const backDepth = (x, y) => 0.36 * x * x + 0.04 * Math.exp(-(((y - 0.32) / 0.18) ** 2));
const backPoint = (u, w) => {
    const x = u * backHalfWidth(w);
    const y = ((w + 1) / 2) * BACK.h;
    return v3(x, y, backDepth(x, y));
};
const BACK_MATRIX = new THREE.Matrix4().makeRotationX(BACK.tilt).setPosition(BACK.pivot);

// Apoio de cabeça: mais curvo que o encosto
const headHalfWidth = (w) => 0.27 + 0.02 * w;
const headDepth = (x) => 0.85 * x * x;
const headPoint = (u, w) => {
    const x = u * headHalfWidth(w);
    return v3(x, ((w + 1) / 2) * HEAD.h, headDepth(x));
};

// ---------------------------------------------------------------------------------------------
// Geometrias
// ---------------------------------------------------------------------------------------------

// Superfície dentro de um contorno arredondado (tela do encosto, do apoio de cabeça e do assento).
// `at(u, w)` recebe um ponto do quadrado arredondado (u e w de -1 a 1) e devolve o ponto 3D.
// Os pontos vão em anéis do centro até a borda. `flip` inverte o lado da frente.
function panel(at, n, uvOf, { rings = 12, segs = 96, flip = false } = {}) {
    const pos = [];
    const uv = [];
    const index = [];
    for (let k = 0; k <= rings; k++) {
        for (let m = 0; m < segs; m++) {
            const [u, w] = squircle((m / segs) * Math.PI * 2, n);
            const p = at((u * k) / rings, (w * k) / rings);
            pos.push(p.x, p.y, p.z);
            uv.push(...uvOf(p));
        }
    }
    for (let k = 0; k < rings; k++) {
        for (let m = 0; m < segs; m++) {
            const a = k * segs + m;
            const b = k * segs + ((m + 1) % segs);
            if (flip) index.push(a, b, a + segs, b, b + segs, a + segs);
            else index.push(a, a + segs, b, b, a + segs, b + segs);
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(index);
    geo.computeVertexNormals();
    return geo;
}

// Contorno de um painel (o último anel), para a moldura passar por ele
function outline(at, n, segs = 96) {
    return Array.from({ length: segs }, (_, m) => at(...squircle((m / segs) * Math.PI * 2, n)));
}

// Tubo de seção arredondada (2w de largura × 2d de espessura) ao longo de um caminho: moldura,
// coluna, braço, pé da base. `up` diz para onde aponta a espessura; `taper(t)` afina a seção
// (t de 0 a 1); `samples` alisa um caminho de poucos pontos.
function sweep(points, { w, d, up = UP, closed = false, n = 4, sides = 16, taper, samples }) {
    let pts = points;
    if (samples) {
        pts = new THREE.CatmullRomCurve3(points, closed, 'centripetal').getSpacedPoints(samples);
        if (closed) pts.pop();
    }
    const count = pts.length;
    const pos = [];
    const index = [];
    const T = new THREE.Vector3();
    const B = new THREE.Vector3();
    const N = new THREE.Vector3();
    const rings = [];
    for (let i = 0; i < count; i++) {
        const prev = pts[closed ? (i - 1 + count) % count : Math.max(i - 1, 0)];
        const next = pts[closed ? (i + 1) % count : Math.min(i + 1, count - 1)];
        T.subVectors(next, prev).normalize();
        B.copy(up).addScaledVector(T, -up.dot(T)).normalize();
        N.crossVectors(T, B);
        const [kw, kd] = taper ? taper(i / (count - 1)) : [1, 1];
        const ringPts = [];
        for (let j = 0; j < sides; j++) {
            const [c, s] = squircle((j / sides) * Math.PI * 2, n);
            const p = pts[i].clone().addScaledVector(N, c * w * kw).addScaledVector(B, s * d * kd);
            ringPts.push(p);
            pos.push(p.x, p.y, p.z);
        }
        rings.push(ringPts);
    }
    const last = closed ? count : count - 1;
    for (let i = 0; i < last; i++) {
        const i2 = (i + 1) % count;
        for (let j = 0; j < sides; j++) {
            const a = i * sides + j;
            const b = i * sides + ((j + 1) % sides);
            const c = i2 * sides + j;
            const e = i2 * sides + ((j + 1) % sides);
            index.push(a, c, b, b, c, e);
        }
    }
    // tampas nas pontas (com vértices próprios, para a quina não ficar "borrada")
    if (!closed) {
        for (const [ri, end] of [[0, false], [count - 1, true]]) {
            const start = pos.length / 3;
            const center = pts[ri];
            pos.push(center.x, center.y, center.z);
            for (const p of rings[ri]) pos.push(p.x, p.y, p.z);
            for (let j = 0; j < sides; j++) {
                const a = start + 1 + j;
                const b = start + 1 + ((j + 1) % sides);
                if (end) index.push(start, b, a);
                else index.push(start, a, b);
            }
        }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    return geo;
}

// Caixa arredondada já posicionada
function rbox([w, h, d], r, [x, y, z], { rx = 0, ry = 0, rz = 0 } = {}) {
    const geo = new RoundedBoxGeometry(w, h, d, 2, r);
    geo.rotateX(rx).rotateZ(rz).rotateY(ry);
    return geo.translate(x, y, z);
}

// Cilindro já posicionado; `axis` = 'x', 'y' ou 'z'
function cyl(rTop, rBottom, h, [x, y, z], axis = 'y', segs = 20, extra = {}) {
    const geo = new THREE.CylinderGeometry(rTop, rBottom, h, segs, 1, false, extra.start ?? 0, extra.length ?? Math.PI * 2);
    if (axis === 'x') geo.rotateZ(Math.PI / 2);
    if (axis === 'z') geo.rotateX(Math.PI / 2);
    return geo.translate(x, y, z);
}

// Deixa a peça pronta para ser juntada com as outras do mesmo material: sem índice, só posição,
// normal e uv, e a cor em cada vértice (assim várias cores cabem num desenho só)
function prep(geo, color) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    const count = g.attributes.position.count;
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
    if (color) {
        const c = new THREE.Color(color);
        const arr = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) arr.set([c.r, c.g, c.b], i * 3);
        g.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
    }
    return g;
}

// Monta a cadeira inteira e junta as peças por material: 4 desenhos (draw calls) no total,
// em vez de um por peça. É isso que pesa no celular.
function buildChair() {
    const plastic = []; // [geometria, cor]
    const soft = [];
    const seatWeave = [];
    const backWeave = [];
    const add = (geo, color = COLOR.frame) => plastic.push([geo, color]);
    const xy = (p) => [p.x * WEAVE_SCALE, p.y * WEAVE_SCALE];

    // ---- base estrela de nylon, 5 pés com rodízios duplos de PU ----
    // giro de cada rodízio (como numa cadeira de verdade, cada um aponta para um lado)
    const casterTurn = [0.6, 2.1, -1.2, 2.9, -0.3];
    for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const dir = v3(Math.sin(a), 0, Math.cos(a));
        const at = (r, y) => v3(dir.x * r, y, dir.z * r);
        // pé: mais grosso perto do centro, descendo um pouco até a ponta
        add(
            sweep([at(0.03, 0.245), at(0.3, 0.226), at(LEG_TIP, 0.205)], {
                w: 0.062,
                d: 0.06,
                n: 3,
                samples: 8,
                taper: (t) => [1 - 0.35 * t, 1 - 0.43 * t]
            }),
            COLOR.nylon
        );
        const tip = at(LEG_TIP, 0);
        add(cyl(0.036, 0.036, 0.075, [tip.x, 0.205, tip.z]), COLOR.nylon);
        // rodízio: haste, capa (meio cilindro) e duas rodas
        add(cyl(0.024, 0.026, 0.06, [tip.x, 0.15, tip.z]), COLOR.nylon);
        const turn = casterTurn[i];
        const caster = new THREE.Matrix4().makeRotationY(turn).setPosition(tip.x, 0, tip.z);
        const local = (geo) => geo.applyMatrix4(caster);
        // capa por cima das rodas: meio cilindro deitado (eixo da roda em z)
        const hood = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 18, 1, false, -Math.PI / 2, Math.PI);
        hood.rotateX(-Math.PI / 2).translate(0.03, 0.062, 0);
        add(local(hood), COLOR.nylon);
        for (const s of [-1, 1]) add(local(cyl(0.062, 0.062, 0.03, [0.03, 0.062, s * 0.036], 'z', 20)), COLOR.wheel);
    }
    // cubo da base
    add(cyl(0.085, 0.1, 0.13, [0, 0.235, 0], 'y', 28), COLOR.nylon);

    // ---- pistão classe 4 com capa telescópica (3 gomos) ----
    const cover = [
        [0, 0.3],
        [0.064, 0.3],
        [0.064, 0.49],
        [0.058, 0.495],
        [0.058, 0.645],
        [0.052, 0.65],
        [0.052, 0.84],
        [0, 0.84]
    ].map(([r, y]) => new THREE.Vector2(r, y));
    add(new THREE.LatheGeometry(cover, 28), COLOR.nylon);

    // ---- mecanismo multifuncional (reclina até 135°) com alavancas ----
    add(rbox([0.34, 0.075, 0.38], 0.02, [0, 0.86, -0.04]), COLOR.steel);
    add(rbox([0.56, 0.028, 0.5], 0.01, [0, 0.912, 0]), COLOR.steel);
    // botão de tensão na frente
    add(cyl(0.022, 0.022, 0.12, [0, 0.845, 0.2], 'z'), COLOR.steel);
    add(cyl(0.04, 0.04, 0.05, [0, 0.845, 0.28], 'z', 24), COLOR.frame);
    // alavanca da altura (direita) e da trava do reclínio (esquerda)
    add(sweep([v3(0.15, 0.865, 0.06), v3(0.3, 0.862, 0.09), v3(0.41, 0.855, 0.15)], { w: 0.016, d: 0.007, samples: 10 }), COLOR.steel);
    add(rbox([0.05, 0.026, 0.085], 0.012, [0.43, 0.853, 0.18], { ry: -0.5 }));
    add(sweep([v3(-0.15, 0.86, -0.06), v3(-0.3, 0.858, -0.05), v3(-0.42, 0.85, 0)], { w: 0.016, d: 0.007, samples: 10 }), COLOR.steel);
    add(rbox([0.05, 0.026, 0.085], 0.012, [-0.44, 0.848, 0.03], { ry: 0.3 }));

    // ---- assento: moldura, tela e o fundo ----
    const seatRim = outline(seatPoint, SEAT.n).map((p) => p.add(v3(0, -0.03, 0)));
    add(sweep(seatRim, { w: 0.03, d: 0.04, closed: true, n: 3, sides: 14 }));
    add(panel((u, w) => v3(u * 0.985 * seatHalfWidth(w), SEAT.y - 0.065, SEAT.cz + w * 0.985 * SEAT.hd), SEAT.n, () => [0, 0], { rings: 3 }));
    seatWeave.push(panel(seatPoint, SEAT.n, (p) => [p.x * WEAVE_SCALE, p.z * WEAVE_SCALE], { flip: true }));

    // ---- encosto: moldura, tela, apoio lombar, coluna com o filete claro ----
    const backGeo = (geo) => geo.applyMatrix4(BACK_MATRIX);
    const backAt = (x, y, dz) => v3(x, y, backDepth(x, y) + dz).applyMatrix4(BACK_MATRIX);
    const backRim = outline(backPoint, BACK.n).map((p) => p.add(v3(0, 0, -0.012)));
    add(backGeo(sweep(backRim, { w: 0.024, d: 0.032, up: FORWARD, closed: true, sides: 14 })));
    backWeave.push(backGeo(panel(backPoint, BACK.n, xy)));
    // apoio lombar: faixa atrás da tela, presa nos dois lados da moldura (sobe e desce)
    const lumbarY = 0.31;
    const lumbarW = backHalfWidth((lumbarY / BACK.h) * 2 - 1);
    const lumbar = Array.from({ length: 17 }, (_, i) => {
        const x = (i / 16 - 0.5) * 2 * 0.985 * lumbarW;
        return v3(x, lumbarY, backDepth(x, lumbarY) - 0.048);
    });
    add(backGeo(sweep(lumbar, { w: 0.016, d: 0.055, n: 4 })));
    for (const s of [-1, 1]) {
        const x = s * (0.99 * lumbarW + 0.026);
        add(backGeo(rbox([0.045, 0.13, 0.075], 0.016, [x, lumbarY, backDepth(x, lumbarY) - 0.022])));
    }
    // coluna: sai do mecanismo, passa atrás do assento e sobe pelas costas do encosto
    const spine = [v3(0, 0.875, -0.17), v3(0, 0.875, -0.36), v3(0, 0.93, -0.5), v3(0, 1.06, -0.5)];
    for (const y of [0, 0.2, 0.42, 0.62]) spine.push(backAt(0, y, -0.075));
    add(sweep(spine, { w: 0.024, d: 0.062, up: ACROSS, samples: 40 }));
    // filete claro: aro fino nas costas da coluna, curvado junto com ela
    const accent = new THREE.ExtrudeGeometry(ring(roundedRectShape(0.07, 0.25, 0.033), roundedRectShape(0.04, 0.22, 0.018)), {
        depth: 0.006,
        bevelEnabled: false,
        curveSegments: 8
    });
    accent.translate(0, 0.42, 0);
    const ap = accent.attributes.position;
    for (let i = 0; i < ap.count; i++) ap.setZ(i, ap.getZ(i) + backDepth(0, ap.getY(i)) - 0.104);
    accent.computeVertexNormals();
    add(backGeo(accent), COLOR.accent);

    // ---- apoio de cabeça: haste atrás do encosto, articulação e a tela com moldura ----
    const postZ = backDepth(0, BACK.h) - 0.068;
    add(backGeo(rbox([0.11, 0.2, 0.05], 0.015, [0, BACK.h - 0.12, postZ])));
    add(backGeo(sweep([v3(0, BACK.h - 0.17, postZ), v3(0, BACK.h + HEAD.lift + 0.14, postZ - 0.005)], { w: 0.012, d: 0.032, up: ACROSS })));
    add(backGeo(cyl(0.024, 0.024, 0.1, [0, BACK.h + HEAD.lift + 0.14, postZ - 0.005], 'x')), COLOR.steel);
    const headMatrix = BACK_MATRIX.clone().multiply(
        new THREE.Matrix4().makeRotationX(HEAD.tilt).setPosition(0, BACK.h + HEAD.lift, postZ + 0.055)
    );
    const headGeo = (geo) => geo.applyMatrix4(headMatrix);
    const headRim = outline(headPoint, HEAD.n).map((p) => p.add(v3(0, 0, -0.008)));
    add(headGeo(sweep(headRim, { w: 0.02, d: 0.026, up: FORWARD, closed: true, sides: 12 })));
    add(headGeo(rbox([0.15, 0.13, 0.045], 0.015, [0, 0.14, -0.0565])));
    backWeave.push(headGeo(panel(headPoint, HEAD.n, xy, { rings: 8, segs: 72 })));

    // ---- braços 6D: suporte sob o assento, coluna com botão de altura e apoio de PU que gira ----
    for (const s of [-1, 1]) {
        add(
            sweep([v3(s * 0.14, 0.895, -0.06), v3(s * 0.36, 0.895, -0.06), v3(s * 0.47, 0.92, -0.06), v3(s * 0.505, 1.0, -0.06), v3(s * 0.51, 1.2, -0.05), v3(s * 0.51, 1.38, -0.04)], {
                w: 0.02,
                d: 0.045,
                up: FORWARD,
                samples: 24
            })
        );
        add(sweep([v3(s * 0.51, 1.04, -0.055), v3(s * 0.51, 1.37, -0.04)], { w: 0.03, d: 0.058, up: FORWARD, n: 3 }));
        add(rbox([0.03, 0.05, 0.03], 0.01, [s * 0.51, 1.33, 0.025]), COLOR.button);
        add(rbox([0.11, 0.035, 0.26], 0.012, [s * 0.51, 1.405, 0]), COLOR.steel);
        soft.push(rbox([0.165, 0.06, 0.45], 0.028, [s * 0.52, 1.45, 0.02], { ry: -s * 0.1 }));
    }

    // junta por material e vira a frente para -x (a mesa)
    const merge = (list) => {
        const geo = mergeGeometries(list.map((item) => (Array.isArray(item) ? prep(item[0], item[1]) : prep(item))), false);
        geo.rotateY(-Math.PI / 2);
        geo.computeBoundingSphere();
        return geo;
    };
    return { plastic: merge(plastic), soft: merge(soft), seat: merge(seatWeave), back: merge(backWeave) };
}

// Tela da cadeira desenhada aqui: trama em losangos. `open` = tela vazada (encosto e apoio de cabeça)
function weaveTexture(open) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const a = (x + y) % 8;
            const b = (x - y + size) % 8;
            // cruzamento dos fios (pega um pouco de luz), fio e furo
            const [r, g, bl, al] = a < 2 && b < 2 ? [54, 56, 62, 255] : a < 2 || b < 2 ? [27, 28, 32, 255] : [8, 8, 10, open ? 150 : 255];
            img.data.set([r, g, bl, al], (y * size + x) * 4);
        }
    }
    ctx.putImageData(img, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    return texture;
}

// `away`: Projetos está aberto dentro do monitor. A câmera para bem onde fica o encosto, então a
// cadeira rola para o lado (como quem afasta a cadeira para usar o PC) e volta depois.
// `instant`: sem animação (movimento reduzido). `chrome` (o cromado da mesa) não é mais usado,
// porque a base agora é de nylon preto como a da cadeira de verdade.
const monitorCenter = new THREE.Vector3(...MONITOR_POS);

export function Chair({ chrome, away, instant }) {
    const group = useRef();
    // 0 = encostada na mesa, 1 = afastada para o lado
    const progress = useRef(0);
    useFrame(({ camera, gl }, dt) => {
        // Ao fechar, espera a câmera sair de perto do monitor: senão voltaria passando por ela
        const cameraClose = camera.position.distanceTo(monitorCenter) < CHAIR_RETURN_DIST;
        const target = away || cameraClose ? 1 : 0;
        if (progress.current === target) return;
        let p = instant ? target : THREE.MathUtils.damp(progress.current, target, 5, dt);
        if (Math.abs(p - target) < 0.001) p = target;
        progress.current = p;
        group.current.position.set(lerp(CHAIR_HOME.x, CHAIR_AWAY.x, p), 0, lerp(CHAIR_HOME.z, CHAIR_AWAY.z, p));
        group.current.rotation.y = lerp(CHAIR_HOME.rot, CHAIR_AWAY.rot, p);
        // A sombra é desenhada uma vez só (BakeShadows): enquanto a cadeira anda, redesenha
        gl.shadowMap.needsUpdate = true;
    });

    const geo = useMemo(() => buildChair(), []);
    const weave = useMemo(() => ({ seat: weaveTexture(false), back: weaveTexture(true) }), []);
    return (
        <group ref={group} position={[CHAIR_HOME.x, 0, CHAIR_HOME.z]} rotation-y={CHAIR_HOME.rot}>
            <mesh geometry={geo.plastic} castShadow receiveShadow>
                <meshStandardMaterial vertexColors roughness={0.45} />
            </mesh>
            {/* apoio de braço de PU: um pouco mais fosco que o plástico */}
            <mesh geometry={geo.soft} castShadow receiveShadow>
                <meshStandardMaterial color="#1c1d21" roughness={0.62} />
            </mesh>
            <mesh geometry={geo.seat} castShadow receiveShadow>
                <meshStandardMaterial map={weave.seat} roughness={0.85} side={THREE.DoubleSide} />
            </mesh>
            {/* tela vazada do encosto e do apoio de cabeça (dá para ver através dela) */}
            <mesh geometry={geo.back} castShadow receiveShadow>
                <meshStandardMaterial map={weave.back} transparent depthWrite={false} side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
        </group>
    );
}
