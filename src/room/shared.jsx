// Peças básicas do quarto: formas com material, objeto clicável e as cores tiradas das fotos.
import { Html, RoundedBox, useCursor } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';

// Valor de 0 (dia) a 1 (noite), animado aos poucos pelas luzes
export const dayNight = { mix: 0 };

export const lerp = THREE.MathUtils.lerp;

export const WALL_H = 5.6;

export const C = {
    wall: '#dccab6',
    baseboard: '#efe7da',
    slab: '#cbbba7',
    black: '#1b1c1f',
    blackSoft: '#2b2c31',
    graphite: '#3a3b40',
    chrome: '#c9ccd1',
    aluminum: '#b7bbc0',
    navy: '#283044',
    sheet: '#f1efeb',
    pillow: '#e8e5e0',
    bedFrame: '#4c3627',
    shelf: '#f3eee5',
    shelfBack: '#ecdcc7',
    oak: '#c9a77f',
    stone: '#e9e3d9',
    magenta: '#ff3fd2',
    warm: '#ffc27a'
};

function Material({ color, map, roughness = 0.8, metalness = 0, ...rest }) {
    return <meshStandardMaterial color={color} map={map} roughness={roughness} metalness={metalness} {...rest} />;
}

export function Box({ size, color, map, roughness, metalness, shadow = true, ...props }) {
    return (
        <mesh castShadow={shadow} receiveShadow {...props}>
            <boxGeometry args={size} />
            <Material color={color} map={map} roughness={roughness} metalness={metalness} />
        </mesh>
    );
}

export function Rounded({ size, radius = 0.05, color, map, roughness = 0.75, metalness, ...props }) {
    return (
        <RoundedBox args={size} radius={radius} smoothness={4} castShadow receiveShadow {...props}>
            <Material color={color} map={map} roughness={roughness} metalness={metalness} />
        </RoundedBox>
    );
}

export function Cyl({ args, color, map, roughness, metalness, ...props }) {
    return (
        <mesh castShadow receiveShadow {...props}>
            <cylinderGeometry args={args} />
            <Material color={color} map={map} roughness={roughness} metalness={metalness} />
        </mesh>
    );
}

// Objeto clicável: cresce um pouco no hover e mostra uma etiqueta com o nome da seção.
// `hit` cria uma área de clique invisível maior que o objeto (bom para o toque).
export function Hotspot({ id, label, onSelect, showLabel, labelPosition, hit, children, ...props }) {
    const ref = useRef();
    const [hover, setHover] = useState(false);
    useCursor(hover);

    useFrame((_, dt) => {
        const s = THREE.MathUtils.damp(ref.current.scale.x, hover ? 1.04 : 1, 12, dt);
        ref.current.scale.setScalar(s);
    });

    return (
        <group
            ref={ref}
            {...props}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHover(true);
            }}
            onPointerOut={() => setHover(false)}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(id);
            }}
        >
            {children}
            {hit && (
                <mesh position={hit.position}>
                    <boxGeometry args={hit.size} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            )}
            {showLabel && (
                <Html position={labelPosition} center zIndexRange={[20, 0]}>
                    <button
                        type="button"
                        className={`tag${hover ? ' is-hover' : ''}`}
                        onClick={() => onSelect(id)}
                        onPointerEnter={() => setHover(true)}
                        onPointerLeave={() => setHover(false)}
                    >
                        <span className="tag-dot" aria-hidden="true" />
                        {label}
                    </button>
                </Html>
            )}
        </group>
    );
}
