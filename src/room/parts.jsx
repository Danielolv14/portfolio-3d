// Formas e peças reutilizáveis dos móveis: contornos (para extrusões e molduras), cabo, cromado e
// caixa com textura numa face só. São usadas pela mesa (Desk.jsx), pela cadeira (Chair.jsx) e pelos periféricos.
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';

import { chromeEnvTexture } from '../textures';
import { C, dayNight, lerp } from './shared';

// Gira a textura 90° (para o veio ou o desenho seguir o comprimento da peça)
export function turned(tex) {
    tex.center.set(0.5, 0.5);
    tex.rotation = Math.PI / 2;
    return tex;
}

// Contorno com os cantos cortados na diagonal (frente do gabinete), com a base em y0
export function chamferShape(w, h, top, bottom, y0 = 0) {
    const x = w / 2;
    return new THREE.Shape([
        [-x + bottom, y0],
        [x - bottom, y0],
        [x, y0 + bottom],
        [x, y0 + h - top],
        [x - top, y0 + h],
        [-x + top, y0 + h],
        [-x, y0 + h - top],
        [-x, y0 + bottom]
    ].map(([px, py]) => new THREE.Vector2(px, py)));
}

// Retângulo de cantos arredondados centrado em (cx, cy)
export function roundedRectShape(w, h, r, cx = 0, cy = 0) {
    const x = cx - w / 2;
    const y = cy - h / 2;
    const s = new THREE.Shape();
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
}

// Forma com um furo no meio (moldura)
export function ring(outer, hole) {
    outer.holes.push(hole);
    return outer;
}

// Geometria plana de um contorno, com a textura esticada de ponta a ponta
export function fittedShapeGeometry(shape) {
    const geo = new THREE.ShapeGeometry(shape, 12);
    geo.computeBoundingBox();
    const { min, max } = geo.boundingBox;
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, (uv.getX(i) - min.x) / (max.x - min.x), (uv.getY(i) - min.y) / (max.y - min.y));
    }
    return geo;
}

// Fio fino passando suavemente pelos pontos dados
export function Cable({ points, radius = 0.012, color = C.black, roughness = 0.5 }) {
    const geometry = useMemo(
        () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), points.length * 14, radius, 6),
        [points, radius]
    );
    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial color={color} roughness={roughness} />
        </mesh>
    );
}

// Cromado: o reflexo geral da cena é fraco e quase todo escuro (bom para os foscos), então o metal
// reflete um panorama próprio do quarto, que escurece à noite junto com o resto
export function useChrome() {
    const material = useMemo(
        () => new THREE.MeshStandardMaterial({ color: '#f4f6f9', roughness: 0.16, metalness: 1, envMap: chromeEnvTexture() }),
        []
    );
    useFrame(() => {
        material.envMapIntensity = lerp(1.05, 0.25, dayNight.mix);
    });
    return material;
}

// Peça cromada: caixa (`size`) ou cilindro (`args`)
export function Chrome({ material, size, args, ...props }) {
    return (
        <mesh material={material} castShadow receiveShadow {...props}>
            {size ? <boxGeometry args={size} /> : <cylinderGeometry args={args} />}
        </mesh>
    );
}

// Caixa com uma textura só em uma das faces (ordem: +x, -x, +y, -y, +z, -z); `map` vale para as outras
export function FacedBox({ size, faceIndex, faceMap, faceProps = {}, map, color, roughness = 0.6, ...props }) {
    return (
        <mesh castShadow receiveShadow {...props}>
            <boxGeometry args={size} />
            {[0, 1, 2, 3, 4, 5].map((i) =>
                i === faceIndex ? (
                    <meshStandardMaterial key={i} attach={`material-${i}`} map={faceMap} roughness={roughness} {...faceProps} />
                ) : (
                    <meshStandardMaterial key={i} attach={`material-${i}`} map={map} color={color} roughness={roughness} />
                )
            )}
        </mesh>
    );
}
