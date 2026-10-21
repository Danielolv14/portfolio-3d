// Página só de desenvolvimento (export.html): desenha o quarto em código num estado fixo e
// exporta como GLB para o pipeline do Blender (pipeline/export/exportar.mjs).
// Estado fixo: dia, cadeira encostada, sem etiquetas, sem efeitos. Fica pronta quando as fontes
// carregaram e a cena desenhou alguns quadros; aí `window.__exportGLB()` devolve o GLB em base64.
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

import { content } from '../content/content';
import Room from '../room/Room';
import { camoTexture } from '../room/textures';

function Exporter() {
    const scene = useThree((state) => state.scene);
    const frames = useRef(0);

    // Espera alguns quadros: as texturas de canvas e os useFrame (cores do dia) se acertam
    useFrame(() => {
        frames.current++;
    });

    useEffect(() => {
        window.__exportGLB = async () => {
            await document.fonts.ready;
            while (frames.current < 10) await new Promise((r) => setTimeout(r, 50));
            const room = scene.getObjectByName('room');
            const glb = await new GLTFExporter().parseAsync(room, { binary: true, onlyVisible: true });
            // ArrayBuffer → base64, em pedaços para não estourar a pilha
            const bytes = new Uint8Array(glb);
            let bin = '';
            for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
            return btoa(bin);
        };
        // Texturas desenhadas em canvas que os modelos do Blender reaproveitam (pipeline/blender/modelos)
        window.__exportTexturas = () => ({ camo: camoTexture().image.toDataURL('image/png') });
        window.__exportReady = true;
    }, [scene]);
    return null;
}

export default function ExportPage() {
    const t = content.pt;
    return (
        <Canvas frameloop="always" camera={{ fov: 35, position: [34, 30, 34] }} style={{ position: 'fixed', inset: 0 }}>
            <group name="room">
                <Room t={t} night={false} focus={null} screen={null} onSelect={() => {}} showLabels={false} compact={false} reducedMotion />
            </group>
            <Exporter />
        </Canvas>
    );
}
