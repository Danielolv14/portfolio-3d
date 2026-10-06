// Luzes do quarto. De dia: sol e luz da janela. À noite: luminária "&", RGB rosa do gabinete,
// telas e a light bar da TV. Tudo é misturado aos poucos pelo valor dayNight.mix.
import { Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { dayNight, lerp } from './shared';

export default function Lights({ night }) {
    const { scene } = useThree();
    const hemi = useRef();
    const sun = useRef();
    const windowLight = useRef();
    const lamp = useRef();
    const rgb = useRef();
    const screen = useRef();
    const tvBar = useRef();
    const colors = useMemo(
        () => ({
            sun: new THREE.Color('#fff0dc'),
            moon: new THREE.Color('#9fb2ff'),
            skyDay: new THREE.Color('#fff6ea'),
            skyNight: new THREE.Color('#6c6f9a'),
            winDay: new THREE.Color('#ffe2b8'),
            winNight: new THREE.Color('#7f93d6')
        }),
        []
    );

    useFrame((_, dt) => {
        dayNight.mix = THREE.MathUtils.damp(dayNight.mix, night ? 1 : 0, 3, dt);
        const m = dayNight.mix;
        hemi.current.intensity = lerp(0.72, 0.2, m);
        hemi.current.color.lerpColors(colors.skyDay, colors.skyNight, m);
        sun.current.intensity = lerp(1.9, 0.22, m);
        sun.current.color.lerpColors(colors.sun, colors.moon, m);
        windowLight.current.intensity = lerp(4, 1.2, m);
        windowLight.current.color.lerpColors(colors.winDay, colors.winNight, m);
        lamp.current.intensity = lerp(0, 16, m);
        rgb.current.intensity = lerp(0.5, 6, m);
        screen.current.intensity = lerp(0.3, 4, m);
        tvBar.current.intensity = lerp(0, 5, m);
        scene.environmentIntensity = lerp(0.32, 0.08, m);
    });

    return (
        <>
            <hemisphereLight ref={hemi} args={['#fff6ea', '#8a7464', 1]} />
            <directionalLight
                ref={sun}
                position={[9, 13, 10]}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-bias={-0.0004}
                shadow-normalBias={0.025}
                shadow-camera-left={-9}
                shadow-camera-right={9}
                shadow-camera-top={9}
                shadow-camera-bottom={-9}
                shadow-camera-near={1}
                shadow-camera-far={40}
            />
            {/* Claridade que entra pela janela */}
            <pointLight ref={windowLight} position={[-1.1, 3.3, -3.8]} distance={9} decay={1.6} />
            {/* Luminária "&" do nicho */}
            <pointLight ref={lamp} position={[-3.95, 3.35, 4.2]} color="#ffb764" distance={10} decay={1.6} />
            {/* RGB rosa do gabinete */}
            <pointLight ref={rgb} position={[-3.15, 3.7, -1.6]} color="#ff3fd2" distance={3.4} decay={2} />
            {/* Brilho do monitor */}
            <pointLight ref={screen} position={[-3.75, 2.6, -2.85]} color="#9fb7ff" distance={5} decay={1.8} />
            {/* Light bar em cima da TV */}
            <pointLight ref={tvBar} position={[-4.5, 4.75, -2.8]} color="#eef3ff" distance={3.6} decay={1.8} />

            {/* Reflexos suaves (nada é baixado da internet) */}
            <Environment resolution={128} frames={1}>
                <Lightformer form="rect" intensity={2} color="#fff4e6" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
                <Lightformer form="rect" intensity={1.4} color="#ffe2b8" position={[0, 3, -9]} scale={[6, 4, 1]} />
                <Lightformer form="rect" intensity={0.8} color="#f1f1ff" position={[9, 4, 9]} rotation-y={(Math.PI * 5) / 4} scale={[10, 6, 1]} />
            </Environment>
        </>
    );
}
