// O quarto assado no Blender (pipeline/): lê o manifest.json, carrega o GLB e as texturas e monta
// um material por grupo de atlas. O quarto em código continua montado, invisível, como camada de
// interação (Room com interactionOnly); aqui só se desenha o visual e se acompanha o movimento.
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

import { dayNight } from '../room/shared';
import { createBakedMaterial, createSharedUniforms } from './BakedMaterial';

const BASE = '/room/';
const { smoothstep, lerp } = THREE.MathUtils;

// No celular, as texturas com metade do tamanho (4x menos memória na placa de vídeo)
const fileFor = (name, compact) => BASE + (compact ? name.replace(/\.webp$/, '-mobile.webp') : name);

function BakedScene({ manifest, night, compact }) {
    // Geometria comprimida com Draco; o decodificador fica em public/draco (nada vem de CDN).
    // O GLB traz os materiais e as texturas originais; as texturas de luz vêm à parte
    const { scene } = useGLTF(BASE + manifest.glb, '/draco/');
    const groups = Object.entries(manifest.grupos);
    // Todas as texturas de luz de uma vez (o useTexture espera a lista inteira carregar)
    const files = groups.flatMap(([, g]) => [g.luz_dia, g.luz_noite, g.leds].map((f) => fileFor(f, compact)));
    const textures = useTexture(files);

    const shared = useMemo(
        () =>
            createSharedUniforms(
                manifest.leds.map((l) => l.cor),
                manifest.codificacao?.tipo === 'log' ? manifest.codificacao.k : 0
            ),
        [manifest]
    );
    const lightByGroup = useMemo(() => {
        const byGroup = {};
        groups.forEach(([name, g], i) => {
            const [lightDay, lightNight, ledMask] = textures.slice(i * 3, i * 3 + 3);
            // Padrão do glTF: UV sem inverter. A luz vem codificada à mão (sem conversão de cor)
            // e é lida no 2º UV, o do atlas (channel 1)
            [lightDay, lightNight, ledMask].forEach((tex) => {
                tex.flipY = false;
                tex.channel = 1;
                tex.colorSpace = THREE.NoColorSpace;
                tex.needsUpdate = true;
            });
            byGroup[name] = { lightDay, lightNight, ledMask, scaleDay: g.escala_dia, scaleNight: g.escala_noite, scaleLeds: g.escala_leds };
        });
        return byGroup;
        // as texturas e o manifesto não mudam durante a vida do componente
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [textures]);

    // Cada malha troca o material do GLB por um com a mesma cor e textura, mais a luz assada.
    // O grupo de atlas vem do nome do objeto no Blender: <grupo>__<unidade> (ex.: furniture__fixo);
    // com vários materiais, o three cria uma malha por material dentro de um grupo com esse nome
    useEffect(() => {
        const cache = new Map();
        scene.traverse((o) => {
            if (!o.isMesh) return;
            let named = o;
            while (named && !named.name.includes('__')) named = named.parent;
            const group = lightByGroup[named?.name.split('__')[0]];
            if (!group) return;
            // Faces cortadas da maquete (topo das paredes, lateral da laje): cor fixa, sem luz, como o
            // corte de uma maquete de arquitetura. A cor escurece à noite junto com o quarto (useFrame)
            if (o.material.name.startsWith('corte_maquete')) {
                if (!cut.current) {
                    const day = o.material.color.clone();
                    cut.current = { mat: new THREE.MeshBasicMaterial({ color: day }), day, night: day.clone().multiplyScalar(0.3) };
                }
                o.material = cut.current.mat;
                return;
            }
            // Vidro (lateral do gabinete): transparente, sem luz assada, só com o reflexo do mapa 360°
            if (o.material.name.startsWith('vidro')) {
                if (!glass.current) {
                    glass.current = new THREE.MeshStandardMaterial({
                        color: o.material.color,
                        roughness: 0.05,
                        metalness: 0,
                        transparent: true,
                        opacity: 0.18,
                        depthWrite: false,
                        envMapIntensity: 1.5
                    });
                }
                o.material = glass.current;
                o.renderOrder = 2;
                return;
            }
            const key = `${o.material.uuid}:${named.name.split('__')[0]}`;
            if (!cache.has(key)) cache.set(key, createBakedMaterial(o.material, group, shared));
            o.material = cache.get(key);
        });
        // Materiais que brilham com uma fonte ajustável: emit-R (cabeceira), emit-G (TV), emit-B (RGB)
        glowing.current = [...cache.values()]
            .map((mat) => ({ mat, channel: 'RGB'.indexOf(mat.name.match(/^emit-([RGB])/)?.[1]) }))
            .filter((g) => g.channel >= 0);
    }, [scene, lightByGroup, shared]);

    // Partes que se mexem: o objeto clicável (cresce no hover) e a cadeira (sai do caminho da câmera)
    // são animados no quarto em código, invisível. O objeto assado copia o movimento:
    // matriz = (posição atual do objeto do código) × (posição dele no momento do bake)⁻¹
    const world = useThree((state) => state.scene);
    const followers = useRef([]);
    const glowing = useRef([]);
    const cut = useRef(null);
    const glass = useRef(null);
    useEffect(() => {
        const list = [];
        scene.traverse((obj) => {
            const match = obj.name.split('__')[1]?.match(/^(hotspot|dyn)-(.+)$/);
            if (!match || obj.parent?.name.includes('__')) return;
            let target = null;
            world.traverse((n) => {
                const bake = n.userData?.bake;
                if (!target && bake?.kind === match[1] && bake?.id === match[2]) target = n;
            });
            if (!target) return;
            target.updateWorldMatrix(true, false);
            obj.matrixAutoUpdate = false;
            list.push({ mesh: obj, target, rest: target.matrixWorld.clone().invert() });
        });
        followers.current = list;
    }, [scene, world]);

    // Reflexo: o quarto assado é fotografado em 360° do meio do quarto, uma vez de dia e uma de noite,
    // e vira o mapa de ambiente (scene.environment). Piso, cromado e vidro refletem o próprio quarto.
    // A luz difusa desse mapa é descartada no material (já está no bake); só o reflexo é usado.
    const gl = useThree((state) => state.gl);
    const envs = useRef(null);
    const exposure = manifest.exposicao ?? { dia: 0, noite: 0 };
    useEffect(() => {
        const target = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
        const camera = new THREE.CubeCamera(0.05, 60, target);
        camera.position.set(0, 2.4, 0);
        const pmrem = new THREE.PMREMGenerator(gl);
        // Pelos lados abertos do quarto a câmera 360° veria o vazio, e o metal (que só reflete)
        // ficava preto. O vazio vira um tom quente e claro, como se o quarto continuasse
        const clear = gl.getClearColor(new THREE.Color());
        const clearAlpha = gl.getClearAlpha();
        const capture = (n) => {
            gl.setClearColor(n ? '#2a2420' : '#cbb9a3', 1);
            shared.uNight.value = n;
            shared.uExposure.value = Math.pow(2, n ? exposure.noite : exposure.dia);
            shared.ledPower.value.set(n, n, n ? 1 : 0.08);
            camera.update(gl, scene);
            return pmrem.fromCubemap(target.texture).texture;
        };
        envs.current = { day: capture(0), night: capture(1) };
        gl.setClearColor(clear, clearAlpha);
        target.dispose();
        pmrem.dispose();
        return () => {
            envs.current.day.dispose();
            envs.current.night.dispose();
            envs.current = null;
            world.environment = null;
        };
        // a captura é feita uma vez, depois que os materiais assados entram
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scene, lightByGroup, shared, gl, world]);

    // O quarto já começa no tema atual (o tema fica guardado); só as trocas depois são animadas
    useLayoutEffect(() => {
        dayNight.mix = night ? 1 : 0;
        // só na montagem, de propósito
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useFrame((_, dt) => {
        // dayNight.mix: 0 = dia, 1 = noite. Antes quem animava eram as luzes em tempo real
        dayNight.mix = THREE.MathUtils.damp(dayNight.mix, night ? 1 : 0, 3, dt);
        const m = dayNight.mix;
        // A noite chega em sequência (docs/plano/03-iluminacao.md, seção 8): primeiro escurece,
        // depois acende a luminária da cabeceira, em seguida a da TV, e o RGB por último
        const power = [smoothstep(m, 0.35, 0.85), smoothstep(m, 0.55, 1), lerp(0.08, 1, smoothstep(m, 0.7, 1))];
        // Exposição em stops, como no Blender: 2^exposição, misturada entre dia e noite
        const gain = Math.pow(2, lerp(exposure.dia, exposure.noite, m));
        if (envs.current) world.environment = m < 0.5 ? envs.current.day : envs.current.night;
        shared.uNight.value = m;
        shared.uExposure.value = gain;
        shared.ledPower.value.set(...power);
        // O LED do RGB nunca apaga de todo (de dia fica fraco); a luminária da TV e a da cabeceira acendem à noite
        for (const { mat, channel } of glowing.current) {
            const p = channel === 2 ? lerp(0.35, 1, power[2]) : power[channel];
            mat.emissiveIntensity = mat.userData.baseEmissive * p;
        }
        if (cut.current) cut.current.mat.color.lerpColors(cut.current.day, cut.current.night, m);
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
