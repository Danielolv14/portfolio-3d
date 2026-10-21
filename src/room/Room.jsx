// O quarto 3D, recriado a partir das fotos do quarto do Daniel.
// Cada parte fica num arquivo de src/room: estrutura, mesa, nicho e cama.
import Bed from './Bed';
import Desk from './Desk';
import Floor from './Floor';
import Lights from './Lights';
import Niche from './Niche';
import { useLayoutEffect, useRef } from 'react';

import { Bake } from './shared';
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
    useLayoutEffect(() => {
        if (!interactionOnly) return;
        root.current.traverse((o) => {
            if (!o.isMesh && !o.isPoints) return;
            const live = o.name.startsWith('screen-') || insideLive(o);
            // Invisível não é desenhado, mas o raycaster do three continua acertando (os cliques funcionam)
            if (!live) o.visible = false;
        });
    }, [interactionOnly]);
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
