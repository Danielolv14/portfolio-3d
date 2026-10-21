// O quarto 3D, recriado a partir das fotos do quarto do Daniel.
// Cada parte fica num arquivo de src/room: estrutura, mesa, nicho e cama.
import Bed from './Bed';
import Desk from './Desk';
import Floor from './Floor';
import Lights from './Lights';
import Niche from './Niche';
import { Bake } from './shared';
import Shell from './Shell';

export default function Room({ t, night, focus, screen, onSelect, showLabels, compact, reducedMotion, onBackgroundClick }) {
    return (
        <group onClick={onBackgroundClick}>
            <Lights night={night} />
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
