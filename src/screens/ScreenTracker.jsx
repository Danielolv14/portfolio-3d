// Fica dentro do Canvas. A cada quadro projeta os 4 cantos da tela 3D na página e guarda o
// retângulo em `box.rect`; se a camada HTML (ScreenOverlay) estiver aberta, move ela para lá.
// Escreve direto no estilo do elemento, sem re-render do React a cada quadro.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { findScreen, placeScreen } from './screens';

const CORNERS = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [0.5, 0.5],
    [-0.5, 0.5]
];
const point = new THREE.Vector3();

export default function ScreenTracker({ section, box }) {
    const scene = useThree((state) => state.scene);
    const mesh = useRef(null);

    useEffect(() => {
        mesh.current = findScreen(scene, section);
        return () => {
            box.rect = null;
        };
    }, [scene, section, box]);

    // Prioridade 0: roda depois do CameraControls (-1), com a câmera já no lugar deste quadro
    useFrame(({ camera, size }) => {
        const screen = mesh.current;
        if (!screen) return;
        const { width, height } = screen.geometry.parameters;
        camera.updateMatrixWorld();
        screen.updateWorldMatrix(true, false);

        let left = Infinity;
        let right = -Infinity;
        let top = Infinity;
        let bottom = -Infinity;
        for (const [cx, cy] of CORNERS) {
            // canto do plano -> mundo -> coordenadas da câmera (-1 a 1) -> px da página
            point.set(cx * width, cy * height, 0).applyMatrix4(screen.matrixWorld).project(camera);
            const x = ((point.x + 1) / 2) * size.width;
            const y = ((1 - point.y) / 2) * size.height;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
        }

        // px inteiros: o texto fica nítido e, parado, nada muda (não mexe no DOM à toa)
        const rect = {
            x: Math.round(left),
            y: Math.round(top),
            width: Math.round(right - left),
            height: Math.round(bottom - top)
        };
        const last = box.rect;
        if (last && last.x === rect.x && last.y === rect.y && last.width === rect.width && last.height === rect.height) return;
        box.rect = rect;
        placeScreen(box.el, rect);
    });

    return null;
}
