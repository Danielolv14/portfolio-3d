// Canvas 3D + câmera. Cada seção tem um "ponto de vista"; navegar = mover a câmera.
import { BakeShadows, CameraControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import CameraControlsImpl from 'camera-controls';
import { ToneMappingMode } from 'postprocessing';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

import Room from './Room';
import { findScreen } from './screens/screens';
import ScreenTracker from './screens/ScreenTracker';

// Posição da câmera e ponto para onde ela olha, por seção
const SPOTS = {
    projects: { pos: [-0.5, 4.5, -1.2], target: [-4.35, 2.45, -2.85] },
    experience: { pos: [0.9, 4.0, -1.6], target: [-4.8, 4.1, -2.8] },
    about: { pos: [-1.46, 2.78, 4.39], target: [-4.66, 2.1, 3.4] },
    contact: { pos: [4.6, 4.5, 0.6], target: [2.55, 1.0, -2.75] }
};

const OVERVIEW_TARGET = new THREE.Vector3(0, 1.6, 0);
const OVERVIEW_DIR = new THREE.Vector3(1, 0.82, 1).normalize();
// Em tela em pé a câmera fica mais alta, para o quarto ocupar mais a altura
const OVERVIEW_DIR_PORTRAIT = new THREE.Vector3(1, 1.2, 1).normalize();

const { ACTION } = CameraControlsImpl;

// Com o painel aberto a câmera continua animando, mas não responde a arrasto/zoom
function setInput(c, free) {
    c.mouseButtons.left = free ? ACTION.ROTATE : ACTION.NONE;
    c.mouseButtons.middle = free ? ACTION.DOLLY : ACTION.NONE;
    c.mouseButtons.right = ACTION.NONE;
    c.mouseButtons.wheel = free ? ACTION.DOLLY : ACTION.NONE;
    c.touches.one = free ? ACTION.TOUCH_ROTATE : ACTION.NONE;
    c.touches.two = free ? ACTION.TOUCH_DOLLY : ACTION.NONE;
    c.touches.three = ACTION.NONE;
}

const LIMITS_OVERVIEW = {
    minAzimuthAngle: 0.06 * Math.PI,
    maxAzimuthAngle: 0.44 * Math.PI,
    minPolarAngle: 0.12 * Math.PI,
    maxPolarAngle: 0.46 * Math.PI,
    minDistance: 9,
    maxDistance: 80
};

const LIMITS_FREE = {
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
    minDistance: 0.1,
    maxDistance: Infinity
};

// Seções que abrem numa tela do quarto (src/screens): quanto da área útil (abaixo do menu do
// topo) a tela ocupa com a câmera parada. (A câmera para onde fica o encosto da cadeira: por isso,
// com Projetos aberto, a cadeira se afasta para o lado. Veja Chair em room/Desk.jsx.)
// O celular fica deitado na cama, com a tela virada para cima: a câmera olha de cima (`faceUp`).
const SCREEN_VIEW = {
    projects: { fill: 0.88 },
    contact: { fill: 0.8, faceUp: true }
};

// A câmera parou: o camera-controls avisa 'rest' (quase parada) e depois 'sleep' (parada de vez).
// Depois de um quadro muito longo (aba escondida por minutos no meio do voo) ela chega de uma vez e
// só vem o 'sleep'. Esperando qualquer um dos dois, a tela sempre aparece.
function stopped(controls) {
    return new Promise((resolve) => {
        const done = () => {
            controls.removeEventListener('rest', done);
            controls.removeEventListener('sleep', done);
            resolve();
        };
        controls.addEventListener('rest', done);
        controls.addEventListener('sleep', done);
    });
}

// Câmera de frente para a tela, calculada a partir da própria malha (centro, frente e tamanho)
function screenView(mesh, camera, size, topInset, { fill, faceUp = false }) {
    mesh.updateWorldMatrix(true, false);
    const center = mesh.getWorldPosition(new THREE.Vector3());
    // a frente do plano é o eixo +z dele, levado para o mundo
    const normal = new THREE.Vector3(0, 0, 1).transformDirection(mesh.matrixWorld);
    const scale = mesh.getWorldScale(new THREE.Vector3());
    const w = mesh.geometry.parameters.width * scale.x;
    const h = mesh.geometry.parameters.height * scale.y;

    // A 1 unidade de distância, a câmera enxerga k unidades de altura (k = 2·tan(fov/2))
    const k = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const usableH = size.height - topInset;
    // Distância para a tela ocupar `fill` da largura ou da altura útil (o que encher primeiro)
    const distance = (size.height / (k * fill)) * Math.max(h / usableH, w / size.width);
    const pos = normal.multiplyScalar(distance).add(center);
    // Tela virada para cima: olhando reto para baixo, a câmera não teria um "lado de cima" e o
    // camera-controls poderia girar a vista para qualquer lado. Um empurrão de 0,001 para o lado de
    // baixo da tela (eixo -y da malha) decide o giro: o topo da tela fica no topo da vista, de pé.
    if (faceUp) pos.add(new THREE.Vector3(0, -1, 0).transformDirection(mesh.matrixWorld).multiplyScalar(0.001));
    // Sobe a câmera meio menu (em unidades do mundo): a tela desce e fica no meio da área útil
    const offsetY = -((topInset / 2) * k * distance) / size.height;
    // Largura (px) que a tela vai ter na página: `fill` da largura ou da altura útil (a que encher primeiro)
    const width = fill * Math.min(size.width, (usableH * w) / h);
    return { center, pos, offsetY, width };
}

function CameraRig({ focus, screen, panel, topInset, reducedMotion, onParked }) {
    const controls = useRef();
    // cada voo ganha um número; só o último pode avisar que a câmera parou
    const flight = useRef(0);
    // Chegada numa tela que ainda vai ser avisada ao App (no quadro seguinte, ver abaixo)
    const parkNext = useRef(null);
    const { size, camera, scene } = useThree();

    // Avisa que a câmera parou só no quadro seguinte à chegada. Nesse quadro o ScreenTracker
    // (que roda depois deste) já mede a tela com a câmera no lugar final, e a camada HTML nasce
    // visível. Sem isso, com movimento reduzido (voo instantâneo) ela nascia antes da primeira
    // medida, ainda escondida, e o foco no título se perdia.
    useFrame(() => {
        const park = parkNext.current;
        if (!park) return;
        parkNext.current = null;
        if (park.token === flight.current) onParked(park.screen);
    });

    // A textura de cada tela se ajusta ao tamanho que a tela vai ter na página (textures.js).
    // Roda ao abrir o site e quando a janela muda: assim a textura já está certa antes do clique,
    // e não muda de tamanho no começo do voo, com o monitor à vista.
    useEffect(() => {
        for (const section of Object.keys(SCREEN_VIEW)) {
            const mesh = findScreen(scene, section);
            if (!mesh) continue;
            const { width } = screenView(mesh, camera, size, topInset, SCREEN_VIEW[section]);
            mesh.material.map?.userData.fit?.(width);
        }
    }, [scene, camera, size, topInset]);

    useEffect(() => {
        const c = controls.current;
        if (!c) return;
        const animate = !reducedMotion;
        const aspect = size.width / size.height;
        const token = ++flight.current;
        const isLatest = () => token === flight.current;
        setInput(c, !focus);

        // Tela: a câmera para de frente para ela e avisa o App quando chegou (aí o HTML aparece).
        // A chegada é quando a câmera para (veja `stopped`).
        const mesh = screen && findScreen(scene, screen);
        if (mesh) {
            const view = screenView(mesh, camera, size, topInset, SCREEN_VIEW[screen]);
            const goTo = (smooth) =>
                Promise.all([
                    c.setFocalOffset(0, view.offsetY, 0, smooth),
                    c.setLookAt(...view.pos.toArray(), ...view.center.toArray(), smooth)
                ]);
            Promise.race([goTo(animate), stopped(c)]).then(() => {
                if (!isLatest()) return;
                // O `rest` chega com a câmera ainda deslizando 1 ou 2 px por mais um segundo:
                // termina o caminho na hora, para a camada HTML entrar sobre uma tela parada
                goTo(false);
                parkNext.current = { token, screen };
            });
            return;
        }

        if (!focus) {
            // Em telas estreitas a câmera se afasta para o quarto inteiro caber
            const distance = aspect >= 1.35 ? 24 : 24 * Math.pow(1.35 / aspect, 0.72);
            const dir = aspect < 1 ? OVERVIEW_DIR_PORTRAIT : OVERVIEW_DIR;
            const pos = dir.clone().multiplyScalar(distance).add(OVERVIEW_TARGET);
            c.setFocalOffset(0, 0, 0, animate);
            c.setLookAt(pos.x, pos.y, pos.z, OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z, animate);
        } else {
            const spot = SPOTS[focus];
            const target = new THREE.Vector3(...spot.target);
            const offset = new THREE.Vector3(...spot.pos).sub(target);
            if (aspect < 1) offset.multiplyScalar(THREE.MathUtils.clamp(0.8 / aspect, 1, 2));
            const pos = target.clone().add(offset);

            // Desloca a imagem para o objeto não ficar atrás do painel
            const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * offset.length();
            const halfW = halfH * aspect;
            if (panel.side === 'right') c.setFocalOffset(panel.frac * halfW, 0, 0, animate);
            // (no camera-controls o eixo y do deslocamento aponta para baixo)
            else c.setFocalOffset(0, panel.frac * halfH, 0, animate);
            c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, animate);
        }
    }, [focus, screen, size, panel.side, panel.frac, topInset, camera, scene, reducedMotion, onParked]);

    // Só em desenvolvimento: window.__view([x, y, z], [alvo]) posiciona a câmera livremente,
    // para tirar capturas de qualquer ângulo e comparar com as fotos do quarto
    useEffect(() => {
        if (!import.meta.env.DEV) return undefined;
        window.__view = (pos, target) => {
            const c = controls.current;
            Object.assign(c, LIMITS_FREE);
            c.setFocalOffset(0, 0, 0, false);
            c.setLookAt(...pos, ...target, false);
        };
        return () => {
            delete window.__view;
        };
    }, []);

    const limits = focus ? LIMITS_FREE : LIMITS_OVERVIEW;
    // Indo para uma tela o voo é mais rápido: o conteúdo só aparece quando a câmera para
    // (com 0,7 ela levava uns 4 s para "parar" de vez; com 0,45, uns 2 s)
    const smoothTime = screen ? 0.45 : 0.7;

    return (
        <CameraControls
            ref={controls}
            makeDefault
            smoothTime={reducedMotion ? 0.01 : smoothTime}
            dollySpeed={0.6}
            truckSpeed={0}
            {...limits}
        />
    );
}

// Brilho nas luzes (RGB, lâmpadas, telas) e sombra de contato entre os objetos.
// No celular fica só o brilho, para não pesar.
function Effects({ compact }) {
    return (
        <EffectComposer multisampling={compact ? 0 : 4} disableNormalPass>
            {!compact && <N8AO halfRes aoRadius={0.55} intensity={1.8} distanceFalloff={0.6} />}
            <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.75} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
    );
}

// Só em desenvolvimento: window.__stats() devolve os draw calls e triângulos do último quadro
// inteiro (sombra + cena + pós-processamento), para medir o efeito das otimizações.
// O three zera essa contagem a cada render() e depois da sombra; aqui zeramos uma vez por quadro.
function DevStats() {
    const gl = useThree((state) => state.gl);
    const last = useRef({ calls: 0, triangles: 0 });

    // Prioridade negativa: roda antes de tudo no quadro (e não assume o render)
    useFrame(() => {
        last.current = { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
        gl.info.reset();
    }, -1000);

    useEffect(() => {
        gl.info.autoReset = false;
        window.__stats = () => ({ ...last.current, shadowAutoUpdate: gl.shadowMap.autoUpdate });
        return () => {
            gl.info.autoReset = true;
            delete window.__stats;
        };
    }, [gl]);
    return null;
}

// `screen`: seção aberta dentro de uma tela do quarto (ou null). `screenBox` é o objeto que o
// ScreenTracker preenche com o retângulo da tela, para a camada HTML (ScreenOverlay) usar.
export default function Scene({
    t,
    night,
    focus,
    screen,
    screenBox,
    topInset,
    onParked,
    onSelect,
    onClose,
    panel,
    onReady,
    reducedMotion,
    compact
}) {
    const showLabels = !focus;
    // Clique fora (no quarto ou no vazio) fecha a seção. O 2º clique de um duplo clique não conta:
    // ele cai onde estava a etiqueta ou o objeto que abriu a seção (a câmera já saiu do lugar)
    // e fecharia na hora o que o 1º clique abriu.
    const closeOnClick = (e) => focus && e.detail < 2 && onClose();
    return (
        <Canvas
            shadows="soft"
            // No celular, no máximo 1,5 pixel por pixel CSS: a diferença quase não aparece e
            // a placa de vídeo pinta cerca de 45% menos pixels que com 2
            dpr={compact ? [1, 1.5] : [1, 2]}
            camera={{ fov: 35, near: 0.1, far: 200, position: [34, 30, 34] }}
            onCreated={onReady}
            onPointerMissed={closeOnClick}
        >
            <Room
                t={t}
                night={night}
                focus={focus}
                screen={screen}
                onSelect={onSelect}
                showLabels={showLabels}
                compact={compact}
                reducedMotion={reducedMotion}
                onBackgroundClick={closeOnClick}
            />
            {/* O quarto não se mexe e o sol não muda de lugar (só de cor e força): o mapa de
                sombra é desenhado uma vez só, em vez de redesenhar todas as peças a cada quadro */}
            <BakeShadows />
            <CameraRig
                focus={focus}
                screen={screen}
                panel={panel}
                topInset={topInset}
                reducedMotion={reducedMotion}
                onParked={onParked}
            />
            {screen && <ScreenTracker section={screen} box={screenBox} />}
            <Effects compact={compact} />
            {import.meta.env.DEV && <DevStats />}
        </Canvas>
    );
}
