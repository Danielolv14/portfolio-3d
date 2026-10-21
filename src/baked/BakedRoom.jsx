// O quarto assado no Blender (pipeline/): lê o manifest.json, carrega o GLB e as texturas e monta
// um material por grupo de atlas. O quarto em código continua montado, invisível, como camada de
// interação (Room com interactionOnly); aqui só se desenha o visual e se acompanha o movimento.
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { dayNight } from '../room/shared';
import { createBakedMaterial } from './BakedMaterial';

const BASE = '/room/';
const { smoothstep, lerp } = THREE.MathUtils;

// No celular, as texturas com metade do tamanho (4x menos memória na placa de vídeo)
const fileFor = (name, compact) => BASE + (compact ? name.replace(/\.webp$/, '-mobile.webp') : name);

function BakedScene({ manifest, night, compact }) {
    // Geometria comprimida com Draco; o decodificador fica em public/draco (nada vem de CDN)
    const { scene } = useGLTF(BASE + manifest.glb, '/draco/');
    const groups = Object.entries(manifest.grupos);
    // Todas as texturas de uma vez (o useTexture espera a lista inteira carregar)
    const files = groups.flatMap(([, g]) => [g.albedo, g.luz_dia, g.luz_noite, g.leds].map((f) => fileFor(f, compact)));
    const textures = useTexture(files);

    const materials = useMemo(() => {
        const byGroup = {};
        const ledColors = manifest.leds.map((l) => l.cor);
        groups.forEach(([name, g], i) => {
            const [albedo, lightDay, lightNight, ledMask] = textures.slice(i * 4, i * 4 + 4);
            // Padrão do glTF: UV sem inverter. O albedo está em sRGB; a luz já vem codificada à mão
            [albedo, lightDay, lightNight, ledMask].forEach((tex) => {
                tex.flipY = false;
                tex.anisotropy = compact ? 4 : 8;
                tex.colorSpace = THREE.NoColorSpace;
                tex.needsUpdate = true;
            });
            albedo.colorSpace = THREE.SRGBColorSpace;
            byGroup[name] = createBakedMaterial({
                albedo,
                lightDay,
                lightNight,
                ledMask,
                scaleDay: g.escala_dia,
                scaleNight: g.escala_noite,
                scaleLeds: g.escala_leds,
                ledColors
            });
        });
        return byGroup;
        // as texturas e o manifesto não mudam durante a vida do componente
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [textures]);

    useEffect(() => {
        scene.traverse((o) => {
            if (!o.isMesh) return;
            // Nome do objeto no Blender: <grupo>__<unidade>, ex.: furniture__fixo
            const group = o.name.split('__')[0];
            if (materials[group]) o.material = materials[group];
        });
    }, [scene, materials]);

    // Partes que se mexem: o objeto clicável (cresce no hover) e a cadeira (sai do caminho da câmera)
    // são animados no quarto em código, invisível. A malha assada copia o movimento:
    // matriz = (posição atual do objeto do código) × (posição dele no momento do bake)⁻¹
    const world = useThree((state) => state.scene);
    const followers = useRef([]);
    useEffect(() => {
        const list = [];
        scene.traverse((mesh) => {
            const match = mesh.isMesh && mesh.name.split('__')[1]?.match(/^(hotspot|dyn)-(.+)$/);
            if (!match) return;
            let target = null;
            world.traverse((n) => {
                const bake = n.userData?.bake;
                if (!target && bake?.kind === match[1] && bake?.id === match[2]) target = n;
            });
            if (!target) return;
            target.updateWorldMatrix(true, false);
            mesh.matrixAutoUpdate = false;
            list.push({ mesh, target, rest: target.matrixWorld.clone().invert() });
        });
        followers.current = list;
    }, [scene, world]);

    // O quarto já começa no tema atual (o tema fica guardado); só as trocas depois são animadas
    useLayoutEffect(() => {
        dayNight.mix = night ? 1 : 0;
        // só na montagem, de propósito
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const exposure = manifest.exposicao ?? { dia: 0, noite: 0 };
    useFrame((_, dt) => {
        // dayNight.mix: 0 = dia, 1 = noite. Antes quem animava eram as luzes em tempo real
        dayNight.mix = THREE.MathUtils.damp(dayNight.mix, night ? 1 : 0, 3, dt);
        const m = dayNight.mix;
        // A noite chega em sequência (docs/plano/03-iluminacao.md, seção 8): primeiro escurece,
        // depois acende a luminária da cabeceira, em seguida a da TV, e o RGB por último
        const power = [smoothstep(m, 0.35, 0.85), smoothstep(m, 0.55, 1), lerp(0.08, 1, smoothstep(m, 0.7, 1))];
        // Exposição em stops, como no Blender: 2^exposição, misturada entre dia e noite
        const gain = Math.pow(2, lerp(exposure.dia, exposure.noite, m));
        Object.values(materials).forEach((mat) => {
            mat.uniforms.uNight.value = m;
            mat.uniforms.uExposure.value = gain;
            mat.uniforms.ledPower.value.set(...power);
        });
        for (const f of followers.current) {
            f.mesh.matrix.multiplyMatrices(f.target.matrixWorld, f.rest);
            f.mesh.matrixWorldNeedsUpdate = true;
        }
    });

    return <primitive object={scene} />;
}

// `onFail`: se o manifesto não carregar, o Scene volta para o quarto em código com luz em tempo real
export default function BakedRoom({ night, compact, onFail }) {
    const [manifest, setManifest] = useState(null);
    useEffect(() => {
        fetch(BASE + 'manifest.json')
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(setManifest)
            .catch((e) => {
                console.error('quarto assado indisponível, voltando ao quarto em código', e);
                onFail?.();
            });
    }, [onFail]);
    return manifest ? <BakedScene manifest={manifest} night={night} compact={compact} /> : null;
}
