// O quarto 3D, recriado a partir das fotos do quarto do Daniel.
// Cada parte fica num arquivo de src/room: estrutura, mesa, nicho e cama.
import Bed from './Bed';
import Desk from './Desk';
import Floor from './Floor';
import Lights from './Lights';
import Niche from './Niche';
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

import { Bake, dayNight, lerp } from './shared';
import Shell from './Shell';

// `interactionOnly`: modo do quarto assado (src/baked). O quarto em código continua montado, mas
// invisível, como camada de interação: cliques, etiquetas, hover e a cadeira continuam vindo daqui,
// e o modelo assado acompanha os movimentos. Ficam visíveis só as telas e o céu da janela.
export default function Room({
    t,
    night,
    focus,
    screen,
    onSelect,
    showLabels,
    compact,
    reducedMotion,
    onBackgroundClick,
    interactionOnly
}) {
    const root = useRef();
    const unlit = useRef([]);
    useLayoutEffect(() => {
        if (!interactionOnly) return;
        const hidden = [];
        const swapped = [];
        root.current.traverse((o) => {
            // Luzes que alguns objetos têm (ex.: a luminária de cobre): a luz já está assada
            const hide = o.isLight || ((o.isMesh || o.isPoints) && !o.name.startsWith('screen-') && !insideLive(o));
            // Invisível não é desenhado, mas o raycaster do three continua acertando (os cliques funcionam)
            if (hide && o.visible) {
                o.visible = false;
                hidden.push(o);
            } else if (o.isMesh && insideLive(o) && !o.material.isMeshBasicMaterial) {
                // O que fica lá fora (a casa do vizinho) usava material com luz, e no modo assado não
                // há luz em tempo real: ficava preto. Vira um material sem luz, escurecido à noite
                const basic = new THREE.MeshBasicMaterial({ color: o.material.color.clone(), map: o.material.map });
                swapped.push({ mesh: o, original: o.material, base: o.material.color.clone() });
                o.material = basic;
            }
        });
        unlit.current = swapped;
        // Se o quarto assado falhar e o Scene voltar para o quarto em código, tudo reaparece
        return () => {
            hidden.forEach((o) => (o.visible = true));
            swapped.forEach(({ mesh, original }) => {
                mesh.material.dispose();
                mesh.material = original;
            });
            unlit.current = [];
        };
    }, [interactionOnly]);
    useFrame(() => {
        const shade = lerp(0.85, 0.12, dayNight.mix);
        for (const { mesh, base } of unlit.current) mesh.material.color.copy(base).multiplyScalar(shade);
    });
    return (
        <group ref={root} onClick={onBackgroundClick}>
            {!interactionOnly && <Lights night={night} />}
            {/* Os grupos do bake: estrutura, móveis e objetos (cada área marca os seus objetos por dentro) */}
            <Bake group="shell" area="shell">
                <Shell />
            </Bake>
            <Bake group="furniture">
                <Bake area="desk">
                    <Desk t={t} onSelect={onSelect} showLabels={showLabels} focus={focus} screen={screen} reducedMotion={reducedMotion} />
                </Bake>
                <Bake area="niche">
                    <Niche t={t} night={night} onSelect={onSelect} showLabels={showLabels} compact={compact} focus={focus} />
                </Bake>
                <Bake area="bed">
                    <Bed t={t} onSelect={onSelect} showLabels={showLabels} compact={compact} focus={focus} />
                </Bake>
            </Bake>
            <Bake group="props" area="floor">
                <Floor />
            </Bake>
        </group>
    );
}

// Dentro de um <Bake kind="live"> (o céu da janela): continua sendo desenhado pelo código
function insideLive(o) {
    for (let p = o; p; p = p.parent) if (p.userData?.bake?.kind === 'live') return true;
    return false;
}
