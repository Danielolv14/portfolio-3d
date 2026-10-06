// Coisas pelo chão, como nas fotos: mochila preta encostada na lateral da cama e o par de tênis
// brancos perto da porta.
import { Soft } from './Bed';
import { Box, C, Rounded } from './shared';

// Mochila em pé: corpo macio, bolso da frente com zíper, alça de mão e a etiqueta
function Backpack(props) {
    return (
        <group {...props}>
            <Soft size={[0.74, 0.98, 0.4]} position={[0, 0.49, 0]} color="#1e1f23" roughness={0.8} pinch={0.35} />
            <Soft size={[0.56, 0.48, 0.16]} position={[0, 0.32, 0.17]} color="#242529" roughness={0.8} pinch={0.3} />
            <Box size={[0.42, 0.012, 0.02]} position={[0, 0.53, 0.235]} rotation-x={-0.35} color="#3b3c42" roughness={0.5} shadow={false} />
            <Box size={[0.03, 0.07, 0.012]} position={[0.17, 0.5, 0.25]} color={C.chrome} roughness={0.3} metalness={0.8} shadow={false} />
            <Rounded size={[0.15, 0.05, 0.012]} radius={0.005} position={[0, 0.71, 0.2]} rotation-x={-0.18} color="#2e3a33" roughness={0.6} />
            <mesh position={[0, 0.955, 0]} castShadow>
                <torusGeometry args={[0.08, 0.018, 8, 20, Math.PI]} />
                <meshStandardMaterial color={C.black} roughness={0.8} />
            </mesh>
        </group>
    );
}

// Tênis branco: solado com a linha da entressola, cabedal alto no calcanhar e baixo na biqueira,
// a boca escura, cadarço, um friso cinza na lateral e a lingueta do calcanhar
function Sneaker(props) {
    return (
        <group {...props}>
            <Rounded size={[0.64, 0.08, 0.25]} radius={0.035} position={[0, 0.04, 0]} color="#ebe7e0" roughness={0.85} />
            <Box size={[0.6, 0.012, 0.254]} position={[0, 0.03, 0]} color="#cdc6bc" roughness={0.9} shadow={false} />
            <Soft size={[0.42, 0.2, 0.23]} position={[-0.09, 0.165, 0]} color="#f7f6f2" roughness={0.7} pinch={0.2} />
            <Soft size={[0.34, 0.13, 0.22]} position={[0.13, 0.12, 0]} color="#f7f6f2" roughness={0.7} pinch={0.2} />
            {/* boca do tênis: forro escuro e a gola acolchoada */}
            <group position={[-0.17, 0.272, 0]} scale={[1, 1, 0.66]}>
                <mesh rotation-x={-Math.PI / 2}>
                    <circleGeometry args={[0.08, 24]} />
                    <meshStandardMaterial color="#4a4b4f" roughness={0.9} />
                </mesh>
                <mesh rotation-x={-Math.PI / 2}>
                    <torusGeometry args={[0.085, 0.022, 10, 28]} />
                    <meshStandardMaterial color="#f4f3ef" roughness={0.7} />
                </mesh>
            </group>
            <Box size={[0.2, 0.045, 0.236]} position={[-0.06, 0.12, 0]} color="#d3d5d9" roughness={0.7} shadow={false} />
            {[-0.02, 0.035, 0.09].map((x) => (
                <Box key={x} size={[0.022, 0.014, 0.12]} position={[x, 0.28 - (x + 0.02) * 0.4, 0]} rotation-z={-0.4} color="#dcdcd9" roughness={0.8} shadow={false} />
            ))}
            <Rounded size={[0.06, 0.12, 0.12]} radius={0.025} position={[-0.29, 0.21, 0]} color="#f2f1ed" roughness={0.7} />
        </group>
    );
}

export default function Floor() {
    return (
        <group>
            <Backpack position={[0.35, 0.04, -1.72]} rotation={[-0.12, 0.25, 0]} />
            <Sneaker position={[-3.78, 0, 1.8]} rotation-y={0.62} />
            <Sneaker position={[-3.48, 0, 2.1]} rotation-y={0.22} />
        </group>
    );
}
