// Cadeira ergonômica da mesa (fica em frente ao monitor). Com Projetos aberto no monitor ela rola para
// o lado, porque a câmera para bem onde fica o encosto.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { chairMeshTexture } from '../textures';
import { Chrome, ring, roundedRectShape } from './parts';
import { Box, Cyl, lerp, MONITOR_POS, Rounded } from './shared';

const PLASTIC = '#17181b';
const CHAIR_EXTRUDE = { depth: 0.03, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 24 };

// Cadeira encostada na mesa (como na foto) e afastada para o lado, quando Projetos abre.
// x e z = posição no chão, rot = giro em volta do eixo y (radianos).
const CHAIR_HOME = { x: -2.45, z: -2.85, rot: 0.15 };
const CHAIR_AWAY = { x: -2.3, z: -4.1, rot: 1.0 };
// Ao fechar, a cadeira só volta quando a câmera já está a esta distância do monitor
const CHAIR_RETURN_DIST = 4;

// Contorno do encosto da cadeira: largo nos ombros, afinando na cintura. `inset` encolhe por igual.
function backShape(inset) {
    const side = [[0.24, 0], [0.34, 0.1], [0.37, 0.42], [0.41, 0.82], [0.45, 1.12], [0.39, 1.28]].map(
        ([x, y]) => new THREE.Vector2(x - inset, y + (y < 0.6 ? inset : -inset))
    );
    const top = side[side.length - 1];
    const s = new THREE.Shape();
    s.moveTo(-side[0].x, side[0].y);
    s.lineTo(side[0].x, side[0].y);
    s.splineThru(side.slice(1));
    s.quadraticCurveTo(0, 1.36 - inset, -top.x, top.y);
    s.splineThru(side.slice(0, -1).reverse().map((p) => new THREE.Vector2(-p.x, p.y)));
    return s;
}

// Cadeira ergonômica: base estrela cromada com rodízios, assento e encosto de tela preta,
// apoio de cabeça e braços. O filete claro no meio do encosto é igual ao da cadeira de verdade.
// `away`: Projetos está aberto dentro do monitor. A câmera para bem onde fica o encosto, então a
// cadeira rola para o lado (como quem afasta a cadeira para usar o PC) e volta depois.
// `instant`: sem animação (movimento reduzido).
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

    const fabric = useMemo(() => chairMeshTexture(), []);
    const shapes = useMemo(
        () => ({
            back: ring(backShape(0), backShape(0.06)),
            backMesh: new THREE.ShapeGeometry(backShape(0.045), 24),
            head: ring(roundedRectShape(0.66, 0.3, 0.12), roundedRectShape(0.6, 0.24, 0.09)),
            headMesh: new THREE.ShapeGeometry(roundedRectShape(0.62, 0.26, 0.1), 12),
            accent: new THREE.ShapeGeometry(ring(roundedRectShape(0.08, 0.3, 0.035), roundedRectShape(0.045, 0.255, 0.02)), 8)
        }),
        []
    );
    const mesh = <meshStandardMaterial map={fabric} transparent depthWrite={false} side={THREE.DoubleSide} roughness={0.9} />;
    return (
        <group ref={group} position={[CHAIR_HOME.x, 0, CHAIR_HOME.z]} rotation-y={CHAIR_HOME.rot}>
            {/* base estrela cromada com rodízios pretos */}
            {[0, 1, 2, 3, 4].map((i) => (
                <group key={i} rotation-y={(i / 5) * Math.PI * 2}>
                    <Chrome material={chrome} args={[0.032, 0.045, 0.56, 16]} position={[0.32, 0.165, 0]} rotation-z={-Math.PI / 2 - 0.07} scale-z={1.2} />
                    <Rounded size={[0.1, 0.06, 0.08]} radius={0.025} position={[0.58, 0.115, 0]} color={PLASTIC} roughness={0.45} />
                    <Cyl args={[0.055, 0.055, 0.075, 18]} position={[0.6, 0.055, 0]} rotation-x={Math.PI / 2} color="#101114" roughness={0.4} />
                </group>
            ))}
            <Chrome material={chrome} args={[0.1, 0.12, 0.09, 24]} position={[0, 0.18, 0]} />
            <Chrome material={chrome} args={[0.045, 0.045, 0.62, 20]} position={[0, 0.52, 0]} />
            <Cyl args={[0.065, 0.065, 0.14, 16]} position={[0, 0.78, 0]} color={PLASTIC} roughness={0.5} />
            <Box size={[0.42, 0.08, 0.38]} position={[0, 0.87, 0]} color={PLASTIC} roughness={0.5} />
            <Rounded size={[0.9, 0.14, 0.92]} radius={0.06} position={[0, 0.98, 0]} color="#1e1f23" roughness={0.92} />

            {/* encosto inclinado para trás (o eixo z do grupo de dentro aponta para as costas) */}
            <group position={[0.44, 1.2, 0]} rotation-z={-0.14}>
                <group rotation-y={Math.PI / 2}>
                    <mesh castShadow>
                        <extrudeGeometry args={[shapes.back, CHAIR_EXTRUDE]} />
                        <meshStandardMaterial color={PLASTIC} roughness={0.45} />
                    </mesh>
                    <mesh geometry={shapes.backMesh} position-z={0.015} castShadow>
                        {mesh}
                    </mesh>
                    {/* apoio lombar e a coluna que liga o encosto ao assento, com o filete claro */}
                    <Rounded size={[0.6, 0.1, 0.05]} radius={0.02} position={[0, 0.34, 0.05]} color={PLASTIC} roughness={0.45} />
                    <Rounded size={[0.15, 0.78, 0.06]} radius={0.025} position={[0, 0.16, 0.07]} color={PLASTIC} roughness={0.45} />
                    <mesh geometry={shapes.accent} position={[0, 0.2, 0.101]}>
                        <meshStandardMaterial color="#e8e8e6" roughness={0.3} metalness={0.3} />
                    </mesh>
                    {/* haste e apoio de cabeça */}
                    <Box size={[0.07, 0.34, 0.035]} position={[0, 1.38, 0.05]} color={PLASTIC} roughness={0.45} />
                    <Rounded size={[0.11, 0.1, 0.06]} radius={0.02} position={[0, 1.3, 0.06]} color={PLASTIC} roughness={0.45} />
                    <group position={[0, 1.6, 0.01]} rotation-x={-0.2}>
                        <mesh castShadow>
                            <extrudeGeometry args={[shapes.head, CHAIR_EXTRUDE]} />
                            <meshStandardMaterial color={PLASTIC} roughness={0.45} />
                        </mesh>
                        <mesh geometry={shapes.headMesh} position-z={0.015}>
                            {mesh}
                        </mesh>
                    </group>
                </group>
            </group>

            {/* braços */}
            {[-1, 1].map((s) => (
                <group key={s}>
                    <Box size={[0.1, 0.05, 0.22]} position={[0.12, 0.86, s * 0.4]} color={PLASTIC} roughness={0.45} />
                    <Rounded size={[0.09, 0.56, 0.06]} radius={0.025} position={[0.14, 1.12, s * 0.53]} color={PLASTIC} roughness={0.45} />
                    <Rounded size={[0.5, 0.06, 0.13]} radius={0.028} position={[0.02, 1.42, s * 0.53]} color="#202125" roughness={0.7} />
                </group>
            ))}
        </group>
    );
}
