// Mouse em cima do mousepad, à direita do teclado
import { C } from './shared';

export function Mouse() {
    return (
        <mesh position={[-3.95, 1.61, -3.95]} scale={[0.2, 0.07, 0.12]} castShadow>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color={C.black} roughness={0.35} />
        </mesh>
    );
}
