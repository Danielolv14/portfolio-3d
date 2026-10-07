// Celular deitado na cama: abre o Contato
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';

import { phoneScreenTexture } from '../textures';
import { dayNight, Hotspot, lerp, Rounded } from './shared';

export function Phone({ t, onSelect, showLabels, active }) {
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
