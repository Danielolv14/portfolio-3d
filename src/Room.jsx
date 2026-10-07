// O quarto 3D, recriado a partir das fotos do quarto do Daniel.
// Cada parte fica num arquivo de src/room: estrutura, mesa, nicho e cama.
import Bed from './room/Bed';
import Desk from './room/Desk';
import Floor from './room/Floor';
import Lights from './room/Lights';
import Niche from './room/Niche';
import Shell from './room/Shell';

export default function Room({ t, night, focus, onSelect, showLabels, compact, onBackgroundClick }) {
    return (
        <group onClick={onBackgroundClick}>
            <Lights night={night} />
            <Shell />
            <Desk t={t} onSelect={onSelect} showLabels={showLabels} focus={focus} />
            <Niche t={t} night={night} onSelect={onSelect} showLabels={showLabels} compact={compact} focus={focus} />
            <Bed t={t} onSelect={onSelect} showLabels={showLabels} compact={compact} focus={focus} />
            <Floor />
        </group>
    );
}
