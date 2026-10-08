// Celular deitado na cama: abre o Contato. Inspirado no iPhone 17 preto, só na forma (sem marca
// nenhuma): borda fina e igual nos 4 lados da tela, cantos bem arredondados, lateral reta de
// alumínio com as quinas arredondadas e os botões. A tela é a malha `screen-contact`: a câmera e a
// camada HTML (src/screens) acham ela pelo nome e usam o tamanho dela (0,27 x 0,57).
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { content } from '../content';
import { msToNextMinute } from '../screens/phoneClock';
import { PHONE_SCREEN_DAY, phoneScreenTexture } from './phoneTexture';
import { dayNight, Hotspot, lerp } from './shared';

// Medidas: a tela tem 0,27 de largura, então 1 mm do aparelho de verdade vale ~0,004 aqui
const SCREEN_W = 0.27;
const SCREEN_H = 0.57;
const BEZEL = 0.0095; // borda preta em volta da tela, igual nos 4 lados (~2,4 mm)
const WIDTH = SCREEN_W + 2 * BEZEL;
const LENGTH = SCREEN_H + 2 * BEZEL;
// canto do corpo: o mesmo centro do canto da tela (13cqw, phone.css), com a borda a mais
const RADIUS = 0.13 * SCREEN_W + BEZEL;
const THICK = 0.032; // 7,95 mm
const EDGE = 0.003; // arredondado das quinas de cima e de baixo
const BOTTOM = -0.0175; // apoiado no edredom na mesma altura de antes
const TOP = BOTTOM + THICK;

// Cores do corpo (uma malha só, cor por vértice): vidro preto na frente, alumínio preto na lateral
const GLASS = new THREE.Color('#08090b');
const FRAME = new THREE.Color('#3b3c41');
const HOLE = new THREE.Color('#020203');

// Botões: [lado (-1 esquerda, 1 direita), centro e comprimento em mm a partir do topo, quanto sai]
// Esquerda: botão de ação e volume. Direita: botão lateral e o controle da câmera (quase rente).
const BUTTONS = [
    [-1, 27, 7.5, 0.0024],
    [-1, 41, 10.5, 0.0024],
    [-1, 55, 10.5, 0.0024],
    [1, 45, 17, 0.0024],
    [1, 108, 18, 0.0009]
];
const MM = SCREEN_W / 66.6;

// Pinta todos os vértices de uma cor (atributo `color`, para o vertexColors do material)
function paint(geometry, color, from = 0, count = geometry.attributes.position.count) {
    if (!geometry.attributes.color) {
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 3), 3));
    }
    const attr = geometry.attributes.color;
    for (let i = from; i < from + count; i++) attr.setXYZ(i, color.r, color.g, color.b);
    return geometry;
}

// Corpo do celular, com os botões, numa geometria só (1 draw call)
function phoneBody() {
    // contorno de cantos em arco de círculo; a quina arredondada (bevel) cresce EDGE para fora
    const w = WIDTH / 2 - EDGE;
    const l = LENGTH / 2 - EDGE;
    const r = RADIUS - EDGE;
    const shape = new THREE.Shape();
    shape.moveTo(-w + r, -l);
    shape.lineTo(w - r, -l);
    shape.absarc(w - r, -l + r, r, -Math.PI / 2, 0);
    shape.lineTo(w, l - r);
    shape.absarc(w - r, l - r, r, 0, Math.PI / 2);
    shape.lineTo(-w + r, l);
    shape.absarc(-w + r, l - r, r, Math.PI / 2, Math.PI);
    shape.lineTo(-w, -l + r);
    shape.absarc(-w + r, -l + r, r, Math.PI, Math.PI * 1.5);
    const body = new THREE.ExtrudeGeometry(shape, {
        depth: THICK - 2 * EDGE,
        bevelEnabled: true,
        bevelThickness: EDGE,
        bevelSize: EDGE,
        bevelSegments: 4,
        curveSegments: 14
    });
    // grupo 0: frente e fundo (vidro); grupo 1: lateral e quinas (alumínio)
    const [caps, sides] = body.groups;
    paint(body, GLASS, caps.start, caps.count);
    paint(body, FRAME, sides.start, sides.count);
    // a extrusão cresce em +z: deita o celular (z vira a altura), com a base em BOTTOM
    body.rotateX(-Math.PI / 2);
    body.translate(0, BOTTOM + EDGE, 0);

    // botões em forma de pílula, metade para dentro da lateral (o topo do celular fica em -z)
    const buttons = BUTTONS.map(([side, center, length, out]) => {
        const radius = 0.0055;
        const pill = new THREE.CapsuleGeometry(radius, length * MM - 2 * radius, 3, 8).toNonIndexed();
        pill.rotateX(Math.PI / 2);
        pill.scale(out / radius, 1, 1);
        pill.translate(side * WIDTH / 2, BOTTOM + THICK / 2, -LENGTH / 2 + center * MM);
        return paint(pill, FRAME);
    });

    // embaixo, na ponta de baixo (+z): a entrada USB-C no meio e 6 furinhos de cada lado
    // (manchas pretas rentes à lateral, só um fio para fora dela)
    const face = LENGTH / 2 + 0.0002;
    const middle = BOTTOM + THICK / 2;
    const port = new THREE.CapsuleGeometry(1.25 * MM, 5.8 * MM, 3, 8).toNonIndexed();
    port.rotateZ(Math.PI / 2);
    port.scale(1, 1, 0.0004 / (1.25 * MM));
    port.translate(0, middle, LENGTH / 2);
    const holes = [-1, 1].flatMap((side) =>
        [0, 1, 2, 3, 4, 5].map((i) => {
            const hole = new THREE.CircleGeometry(0.65 * MM, 10).toNonIndexed();
            hole.translate(side * (8.15 + i * 2.3) * MM, middle, face);
            return paint(hole, HOLE);
        })
    );
    const merged = mergeGeometries([body, ...buttons, paint(port, HOLE), ...holes]);
    merged.computeBoundingSphere();
    return merged;
}

export function Phone({ t, onSelect, showLabels, active }) {
    const body = useMemo(() => phoneBody(), []);
    const tex = useMemo(() => phoneScreenTexture(), []);
    const screen = useRef();
    const level = useRef(PHONE_SCREEN_DAY);
    const lang = t === content.en ? 'en' : 'pt';

    // Desenha a tela inicial no idioma atual; na virada de cada minuto redesenha só a hora (tick)
    useEffect(() => {
        tex.userData.redraw(t, lang);
        let timer;
        const schedule = () => {
            timer = setTimeout(() => {
                tex.userData.tick();
                schedule();
            }, msToNextMinute());
        };
        schedule();
        return () => clearTimeout(timer);
    }, [tex, t, lang]);

    // Brilho da tela: à noite, de longe, ela brilha mais (1,2), como as outras telas do quarto. Com o
    // Contato aberto volta ao brilho de dia, o mesmo para o qual a textura foi calibrada: assim a
    // camada HTML entra por cima sem salto de cor (o voo da câmera dura mais que essa transição).
    useFrame((_, dt) => {
        const target = active ? PHONE_SCREEN_DAY : lerp(PHONE_SCREEN_DAY, 1.2, dayNight.mix);
        level.current = THREE.MathUtils.damp(level.current, target, 6, dt);
        screen.current.color.setScalar(level.current);
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
            <mesh geometry={body} castShadow receiveShadow>
                <meshStandardMaterial vertexColors roughness={0.3} metalness={0.35} />
            </mesh>
            {/* Os cantos da tela vêm da própria textura (transparentes fora do raio): ali aparece o
                vidro preto de baixo. polygonOffset: a tela sempre ganha do vidro, mesmo de longe. */}
            <mesh name="screen-contact" position={[0, TOP + 0.001, 0]} rotation-x={-Math.PI / 2}>
                <planeGeometry args={[SCREEN_W, SCREEN_H]} />
                <meshBasicMaterial
                    ref={screen}
                    map={tex}
                    transparent
                    alphaTest={0.01}
                    toneMapped={false}
                    polygonOffset
                    polygonOffsetFactor={-2}
                    polygonOffsetUnits={-2}
                />
            </mesh>
        </Hotspot>
    );
}
