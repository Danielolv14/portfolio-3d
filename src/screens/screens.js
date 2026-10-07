// Seções que abrem dentro de uma tela do quarto, em vez do painel lateral.
import MonitorScreen from './MonitorScreen';

// Seção -> tela onde ela aparece. No quarto, a malha dessa tela se chama `screen-<seção>`.
export const SCREEN_OF = {
    projects: 'monitor',
    experience: 'tv',
    contact: 'phone'
};

// Telas já prontas. Uma seção cuja tela ainda não existe continua abrindo no painel.
export const SCREEN_COMPONENTS = {
    monitor: MonitorScreen
};

export function hasScreen(section) {
    return Boolean(SCREEN_COMPONENTS[SCREEN_OF[section]]);
}

// A malha da tela da seção dentro da cena (nome dado no quarto: `screen-projects`...)
export function findScreen(scene, section) {
    return scene.getObjectByName(`screen-${section}`);
}

// Põe a camada HTML em cima da tela 3D. `rect` vem do ScreenTracker, em px da página.
// Escreve direto no estilo do elemento: muda a cada quadro e não precisa passar pelo React.
export function placeScreen(el, rect) {
    if (!el || !rect) return;
    el.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    // começa escondida no CSS até receber a primeira posição
    el.style.visibility = 'visible';
}
