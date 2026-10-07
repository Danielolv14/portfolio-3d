// Teclado mecânico em cima do mousepad, na frente do monitor
import { useMemo } from 'react';

import { keyboardTexture } from '../textures';
import { FacedBox, turned } from './parts';

export function Keyboard() {
    const keys = useMemo(() => turned(keyboardTexture()), []);
    return (
        <FacedBox size={[0.48, 0.06, 1.25]} position={[-3.92, 1.61, -2.95]} rotation-y={0.04} faceIndex={2} faceMap={keys} color="#141519" roughness={0.6} />
    );
}
