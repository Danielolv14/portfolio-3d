// Canvas 3D + câmera. Cada seção tem um "ponto de vista"; navegar = mover a câmera.
import { CameraControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import CameraControlsImpl from 'camera-controls';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import Room from './Room';

// Posição da câmera e ponto para onde ela olha, por seção
const SPOTS = {
    projects: { pos: [-1.6, 3.3, 1.6], target: [-2.1, 2.45, -4.45] },
    experience: { pos: [0.6, 3.25, 0.4], target: [-4.95, 3.15, 0.2] },
    about: { pos: [0.7, 3.0, 4.6], target: [-4.95, 2.45, 3.45] },
    contact: { pos: [4.8, 3.7, 4.6], target: [1.4, 1.3, 1.0] }
};

const OVERVIEW_TARGET = new THREE.Vector3(0, 1.6, 0);
const OVERVIEW_DIR = new THREE.Vector3(1, 0.82, 1).normalize();
// Em tela em pé a câmera fica mais alta, para o quarto ocupar mais a altura
const OVERVIEW_DIR_PORTRAIT = new THREE.Vector3(1, 1.2, 1).normalize();

const { ACTION } = CameraControlsImpl;

// Com o painel aberto a câmera continua animando, mas não responde a arrasto/zoom
function setInput(c, free) {
    c.mouseButtons.left = free ? ACTION.ROTATE : ACTION.NONE;
    c.mouseButtons.middle = free ? ACTION.DOLLY : ACTION.NONE;
    c.mouseButtons.right = ACTION.NONE;
    c.mouseButtons.wheel = free ? ACTION.DOLLY : ACTION.NONE;
    c.touches.one = free ? ACTION.TOUCH_ROTATE : ACTION.NONE;
    c.touches.two = free ? ACTION.TOUCH_DOLLY : ACTION.NONE;
    c.touches.three = ACTION.NONE;
}

const LIMITS_OVERVIEW = {
    minAzimuthAngle: 0.06 * Math.PI,
    maxAzimuthAngle: 0.44 * Math.PI,
    minPolarAngle: 0.12 * Math.PI,
    maxPolarAngle: 0.46 * Math.PI,
    minDistance: 9,
    maxDistance: 80
};

const LIMITS_FREE = {
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    minDistance: 0.1,
    maxDistance: Infinity
};

function CameraRig({ focus, panel, reducedMotion }) {
    const controls = useRef();
    const { size, camera } = useThree();
    const aspect = size.width / size.height;

    useEffect(() => {
        const c = controls.current;
        if (!c) return;
        const animate = !reducedMotion;
        setInput(c, !focus);

        if (!focus) {
            // Em telas estreitas a câmera se afasta para o quarto inteiro caber
            const distance = aspect >= 1.35 ? 24 : 24 * Math.pow(1.35 / aspect, 0.72);
            const dir = aspect < 1 ? OVERVIEW_DIR_PORTRAIT : OVERVIEW_DIR;
            const pos = dir.clone().multiplyScalar(distance).add(OVERVIEW_TARGET);
            c.setFocalOffset(0, 0, 0, animate);
            c.setLookAt(pos.x, pos.y, pos.z, OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z, animate);
            return;
        }

        const spot = SPOTS[focus];
        const target = new THREE.Vector3(...spot.target);
        const offset = new THREE.Vector3(...spot.pos).sub(target);
        if (aspect < 1) offset.multiplyScalar(THREE.MathUtils.clamp(0.8 / aspect, 1, 2));
        const pos = target.clone().add(offset);

        // Desloca a imagem para o objeto não ficar atrás do painel
        const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * offset.length();
        const halfW = halfH * aspect;
        if (panel.side === 'right') c.setFocalOffset(panel.frac * halfW, 0, 0, animate);
        // (no camera-controls o eixo y do deslocamento aponta para baixo)
        else c.setFocalOffset(0, panel.frac * halfH, 0, animate);

        c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, animate);
    }, [focus, aspect, panel.side, panel.frac, camera, reducedMotion]);

    const limits = focus ? LIMITS_FREE : LIMITS_OVERVIEW;

    return (
        <CameraControls
            ref={controls}
            makeDefault
            smoothTime={reducedMotion ? 0.01 : 0.7}
            dollySpeed={0.6}
            truckSpeed={0}
            {...limits}
        />
    );
}

export default function Scene({ t, night, focus, onSelect, onClose, panel, onReady, reducedMotion, compact }) {
    const showLabels = !focus;
    return (
        <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ fov: 35, near: 0.1, far: 200, position: [34, 30, 34] }}
            onCreated={onReady}
            onPointerMissed={() => focus && onClose()}
        >
            <Room
                t={t}
                night={night}
                onSelect={onSelect}
                showLabels={showLabels}
                compact={compact}
                onBackgroundClick={() => focus && onClose()}
            />
            <CameraRig focus={focus} panel={panel} reducedMotion={reducedMotion} />
        </Canvas>
    );
}
