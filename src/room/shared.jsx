// Peças básicas do quarto: formas com material, objeto clicável e as cores tiradas das fotos.
import { Html, RoundedBox, useCursor } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef, useState } from 'react';
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
// `active`: a seção dele está aberta. Aí ele fica no tamanho normal, sem hover, para a
// camada HTML da tela (ScreenOverlay) encaixar certinho em cima da malha; e clicar nele fecha.
export function Hotspot({ id, label, onSelect, showLabel, labelPosition, hit, active = false, children, ...props }) {
    const ref = useRef();
    const [hover, setHover] = useState(false);
    const gl = useThree((state) => state.gl);
    useCursor(hover && !active);

    // Ao abrir, volta na hora ao tamanho normal (o clique parece um botão apertado). A câmera mede a
    // tela logo em seguida (screenView, em Scene.jsx) e precisa do tamanho de verdade, não o do hover.
    // (o layout effect roda antes do efeito da câmera, no mesmo commit)
    useLayoutEffect(() => {
        if (!active) return;
        ref.current.scale.setScalar(1);
        gl.shadowMap.needsUpdate = true;
    }, [active, gl]);

    useFrame((state, dt) => {
        const target = hover && !active ? 1.04 : 1;
        const s = THREE.MathUtils.damp(ref.current.scale.x, target, 12, dt);
        ref.current.scale.setScalar(s);
        // A sombra é desenhada uma vez só (BakeShadows, em Scene.jsx). Enquanto o objeto cresce
        // ou encolhe, pede para redesenhá-la, senão a sombra fica do tamanho antigo
        if (Math.abs(s - target) > 0.001) state.gl.shadowMap.needsUpdate = true;
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
                // 2º clique de um duplo clique (ou toque duplo): a seção já abriu no 1º.
                // Para aqui, senão ele abriria outro objeto ou fecharia a seção (ver Scene.jsx).
                if (e.detail > 1) {
                    e.stopPropagation();
                    return;
                }
                // Já aberto, o clique segue para o quarto, que entende "clique fora" e fecha.
                // (com a câmera no monitor, a área de clique dele cobre quase a página toda)
                if (active) return;
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
                        onClick={(e) => {
                            // Sem isto o clique sobe até o Canvas, que entende "clique fora"
                            // e fecha na hora a seção que acabou de abrir
                            e.stopPropagation();
                            onSelect(id);
                        }}
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
