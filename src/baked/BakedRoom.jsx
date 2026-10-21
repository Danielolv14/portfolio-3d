// O quarto assado no Blender: lê o manifest.json do pipeline, carrega o GLB e as texturas e monta
// um material por grupo (shell, furniture, props). Por enquanto só na prova de conceito (?render=poc).
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { dayNight } from '../room/shared';
import { createBakedMaterial } from './BakedMaterial';

const BASE = '/room-poc/';

function BakedScene({ manifest, night }) {
    // Geometria comprimida com Draco; o decodificador fica em public/draco (nada vem de CDN)
    const { scene } = useGLTF(BASE + manifest.glb, '/draco/');
    const groups = Object.entries(manifest.grupos);
    // Todas as texturas de uma vez (o useTexture espera a lista inteira carregar)
    const files = groups.flatMap(([, g]) => [g.albedo, g.luz_dia, g.luz_noite].map((f) => BASE + f));
    const textures = useTexture(files);

    const materials = useMemo(() => {
        const byGroup = {};
        groups.forEach(([name, g], i) => {
            const [albedo, lightDay, lightNight] = textures.slice(i * 3, i * 3 + 3);
            // Padrão do glTF: UV sem inverter. O albedo está em sRGB; a luz já vem codificada à mão
            [albedo, lightDay, lightNight].forEach((tex) => {
                tex.flipY = false;
                tex.anisotropy = 8;
                tex.needsUpdate = true;
            });
            albedo.colorSpace = THREE.SRGBColorSpace;
            lightDay.colorSpace = lightNight.colorSpace = THREE.NoColorSpace;
            byGroup[name] = createBakedMaterial({ albedo, lightDay, lightNight, scaleDay: g.escala_dia, scaleNight: g.escala_noite });
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
    // são animados no quarto em código, invisível (Room com interactionOnly). A malha assada copia o
    // movimento: matriz = (posição atual do objeto do código) × (posição dele no momento do bake)⁻¹
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
    useFrame(() => {
        for (const f of followers.current) {
            f.mesh.matrix.multiplyMatrices(f.target.matrixWorld, f.rest);
            f.mesh.matrixWorldNeedsUpdate = true;
        }
    });

    // Exposição em stops, como no Blender: 2^exposição, misturada entre dia e noite
    const exposure = manifest.exposicao ?? { dia: 0, noite: 0 };
    useFrame(() => {
        const m = dayNight.mix;
        const stops = THREE.MathUtils.lerp(exposure.dia, exposure.noite, m);
        Object.values(materials).forEach((mat) => {
            mat.uniforms.uNight.value = m;
            mat.uniforms.uExposure.value = Math.pow(2, stops);
        });
    });

    // O valor dayNight.mix é animado pelas luzes em tempo real, que não existem aqui
    useFrame((_, dt) => {
        dayNight.mix = THREE.MathUtils.damp(dayNight.mix, night ? 1 : 0, 3, dt);
    });

    return <primitive object={scene} />;
}

export default function BakedRoom({ night }) {
    const [manifest, setManifest] = useState(null);
    useEffect(() => {
        fetch(BASE + 'manifest.json')
            .then((r) => r.json())
            .then(setManifest)
            .catch((e) => console.error('manifest do bake não encontrado', e));
    }, []);
    return manifest ? <BakedScene manifest={manifest} night={night} /> : null;
}
