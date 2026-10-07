import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { content, profile, SECTIONS } from './content';
import { IconClose, IconCube, IconList, IconMoon, IconSun, sectionIcon } from './Icons';
import ScreenOverlay from './screens/ScreenOverlay';
import { hasScreen } from './screens/screens';
import { SectionHeader, sectionComponents } from './Sections';

const Scene = lazy(() => import('./Scene'));

const MOBILE_MAX = 760;
const PANEL_W = 460;
const TABBAR_H = 64;
// Altura do menu do topo com a folga (a mesma do `top` do .panel): as telas ficam abaixo dela
const TOPBAR_SPACE = 76;
// Seção dentro da tela 3D só com espaço para ler; em janela menor ela abre no painel/folha
const SCREEN_MIN_W = 900;
const SCREEN_MIN_H = 560;

function hasWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
        return false;
    }
}

// Tema e idioma ficam guardados no navegador. O try/catch cobre a aba anônima e o armazenamento
// bloqueado: nesses casos o site funciona igual, só não lembra a escolha.
// (o index.html lê a mesma chave do tema antes do primeiro desenho, para o fundo não piscar)
const THEME_KEY = 'portfolio-theme';
const LANG_KEY = 'portfolio-lang';

function readPref(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function savePref(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // sem armazenamento: segue sem lembrar
    }
}

// O tema guardado vale mais; o do sistema (ou o da página que hospeda o site) só na primeira visita
function initialNight() {
    const saved = readPref(THEME_KEY);
    if (saved === 'night' || saved === 'day') return saved === 'night';
    const theme = document.documentElement.dataset.theme;
    if (theme) return theme === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function initialLang() {
    const saved = readPref(LANG_KEY);
    return Object.keys(content).includes(saved) ? saved : 'pt';
}

function useViewport() {
    const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
        const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return vp;
}

export default function App() {
    const webgl = useMemo(hasWebGL, []);
    const [lang, setLang] = useState(initialLang);
    const [night, setNight] = useState(initialNight);
    const [focus, setFocus] = useState(null);
    const [flat, setFlat] = useState(!webgl);
    const [ready, setReady] = useState(false);
    // Seção cuja tela a câmera já alcançou (o Scene avisa quando ela para)
    const [parked, setParked] = useState(null);
    const headingRef = useRef(null);
    // Quem abriu a seção (botão do menu, etiqueta...), para devolver o foco quando ela fechar
    const openerRef = useRef(null);
    const lastFocusRef = useRef(null);
    // Retângulo da tela 3D na página: o Canvas escreve, a camada HTML da tela lê
    const screenBox = useRef({ el: null, rect: null }).current;
    const { w, h } = useViewport();
    const t = content[lang];
    const mobile = w < MOBILE_MAX;
    const reducedMotion = useMemo(
        () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
        []
    );
    // Tela de toque sem mouse (celular, tablet): a dica fala em "toque", mesmo em tela larga
    const touch = useMemo(() => window.matchMedia?.('(hover: none)').matches ?? false, []);

    // Seção aberta dentro de uma tela do quarto (monitor...), ou null quando ela usa o painel
    const screen = !flat && w >= SCREEN_MIN_W && h >= SCREEN_MIN_H && hasScreen(focus) ? focus : null;
    // Se a tela mudou (outra seção, janela pequena, modo 2D), a câmera ainda vai voar até o
    // lugar novo: esquece o "parou" antigo já nesta renderização, senão a tela apareceria antes.
    // (é o jeito do React de ajustar um estado quando outro valor muda, sem esperar um efeito)
    const [lastScreen, setLastScreen] = useState(screen);
    if (screen !== lastScreen) {
        setLastScreen(screen);
        setParked(null);
    }
    const screenOpen = screen !== null && parked === screen;

    // Fração da tela coberta pelo painel, para a câmera compensar
    const panel = mobile
        ? { side: 'bottom', frac: Math.min(0.9, (0.58 * h + TABBAR_H) / h) }
        : { side: 'right', frac: (Math.min(PANEL_W, 0.42 * w) + 16) / w };

    useEffect(() => {
        const mode = night ? 'night' : 'day';
        document.documentElement.dataset.mode = mode;
        savePref(THEME_KEY, mode);
    }, [night]);

    useEffect(() => {
        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
        savePref(LANG_KEY, lang);
    }, [lang]);

    useEffect(() => {
        document.body.classList.toggle('is-flat', flat);
    }, [flat]);

    // Foco no título da seção: no painel, assim que abre; na tela 3D, quando a câmera para.
    // (`screen` muda quando a janela encolhe no meio do voo e a seção passa para o painel)
    useEffect(() => {
        if (focus && headingRef.current) headingRef.current.focus({ preventScroll: true });
    }, [focus, screen, screenOpen]);

    // Ao fechar, o foco volta para quem abriu (se ele sumiu, para o botão da seção no menu).
    // Só quando o foco se perdeu junto com o painel/tela; quem fechou pelo menu fica onde está.
    useEffect(() => {
        const closed = lastFocusRef.current;
        lastFocusRef.current = focus;
        if (focus || !closed || !openerRef.current) return;
        if (document.activeElement && document.activeElement !== document.body) return;
        const opener = openerRef.current;
        const target = opener.isConnected ? opener : document.querySelector(`[data-section="${closed}"]`);
        target?.focus({ preventScroll: true });
    }, [focus]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') setFocus(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const toggleLang = useCallback(() => setLang((l) => (l === 'pt' ? 'en' : 'pt')), []);
    const toggleNight = useCallback(() => setNight((n) => !n), []);

    // Abre uma seção lembrando quem abriu. Clique direto no objeto 3D não deixa ninguém com foco:
    // aí não há o que devolver depois.
    const openSection = useCallback((id) => {
        const el = document.activeElement;
        const outside = el && el !== document.body && !el.closest('.panel, .screen');
        openerRef.current = outside ? el : null;
        setFocus(id);
    }, []);

    // Objetos do quarto: seções abrem o painel ou a tela; a luminária "&" é o atalho de dia/noite
    const onSelect = useCallback(
        (id) => {
            if (id === 'lamp') return toggleNight();
            openSection(id);
        },
        [toggleNight, openSection]
    );

    const goTo = (id) => {
        if (flat) {
            document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        } else {
            openSection(id);
        }
    };

    // "Ler em 2D" de dentro da tela: vai para o modo sem 3D já na mesma seção
    const readIn2d = (id) => {
        setFocus(null);
        setFlat(true);
        // espera o modo 2D aparecer para rolar até a seção e pôr o foco no título dela
        requestAnimationFrame(() => {
            const section = document.getElementById(`sec-${id}`);
            section?.scrollIntoView();
            section?.querySelector('h2')?.focus({ preventScroll: true });
        });
    };

    // Clique fora, no quarto: fecha a seção. Menos enquanto a câmera voa até uma tela, porque aí o
    // clique quase sempre cai no próprio monitor chegando. (Esc, o menu e o X fecham sempre)
    const closeFromRoom = () => {
        if (screen && !screenOpen) return;
        setFocus(null);
    };

    const ActiveSection = focus && !screen ? sectionComponents[focus] : null;

    return (
        <div className={`app${flat ? ' app-flat' : ''}`}>
            <header className="topbar">
                <button type="button" className="brand" onClick={() => (flat ? window.scrollTo(0, 0) : setFocus(null))}>
                    <span className="brand-mark" aria-hidden="true">
                        &lt;/&gt;
                    </span>
                    <span className="brand-name">{profile.name}</span>
                </button>

                {!mobile && (
                    <nav className="nav" aria-label="Menu">
                        {SECTIONS.map((id) => (
                            <button
                                key={id}
                                type="button"
                                className="nav-link"
                                data-section={id}
                                aria-current={focus === id ? 'page' : undefined}
                                onClick={() => goTo(id)}
                            >
                                {t.ui.nav[id]}
                            </button>
                        ))}
                    </nav>
                )}

                <div className="tools">
                    <button type="button" className="tool" onClick={toggleLang} aria-label={t.ui.langLabel}>
                        {t.ui.langButton}
                    </button>
                    <button
                        type="button"
                        className="tool"
                        onClick={toggleNight}
                        aria-label={night ? t.ui.day : t.ui.night}
                        title={night ? t.ui.day : t.ui.night}
                    >
                        {night ? <IconSun /> : <IconMoon />}
                    </button>
                    {webgl && (
                        <button
                            type="button"
                            className="tool tool-wide"
                            aria-label={flat ? t.ui.view3d : t.ui.view2d}
                            title={flat ? t.ui.view3d : t.ui.view2d}
                            onClick={() => {
                                setFocus(null);
                                setFlat((f) => !f);
                            }}
                        >
                            {flat ? <IconCube /> : <IconList />}
                            <span className="tool-text">{flat ? t.ui.view3d : t.ui.view2d}</span>
                        </button>
                    )}
                </div>
            </header>

            {!flat && (
                <main className="stage">
                    <Suspense fallback={null}>
                        <Scene
                            t={t}
                            night={night}
                            focus={focus}
                            screen={screen}
                            screenBox={screenBox}
                            topInset={TOPBAR_SPACE}
                            onParked={setParked}
                            onSelect={onSelect}
                            onClose={closeFromRoom}
                            panel={panel}
                            onReady={() => setReady(true)}
                            reducedMotion={reducedMotion}
                            compact={mobile}
                        />
                    </Suspense>
                    {!ready && <p className="loading">{t.ui.loading}</p>}
                    {!focus && ready && <p className="hint">{mobile || touch ? t.ui.hintTouch : t.ui.hint}</p>}

                    {screenOpen && (
                        <ScreenOverlay
                            key={screen}
                            section={screen}
                            box={screenBox}
                            t={t}
                            headingRef={headingRef}
                            onClose={() => setFocus(null)}
                            onRead2d={() => readIn2d(screen)}
                        />
                    )}

                    {ActiveSection && (
                        <aside className="panel" role="dialog" aria-labelledby="panel-title" key={focus}>
                            <div className="panel-top">
                                <button
                                    type="button"
                                    className="tool"
                                    onClick={() => setFocus(null)}
                                    aria-label={t.ui.close}
                                    title={t.ui.close}
                                >
                                    <IconClose />
                                </button>
                            </div>
                            <div className="panel-body">
                                <SectionHeader id={focus} t={t} headingRef={headingRef} headingId="panel-title" />
                                <ActiveSection t={t} lang={lang} setLang={setLang} idPrefix="panel" />
                            </div>
                        </aside>
                    )}
                </main>
            )}

            {flat && (
                <main className="flat">
                    {SECTIONS.map((id) => {
                        const Section = sectionComponents[id];
                        return (
                            <section key={id} id={`sec-${id}`} className="flat-section">
                                <SectionHeader id={id} t={t} />
                                <Section t={t} lang={lang} setLang={setLang} idPrefix="flat" />
                            </section>
                        );
                    })}
                </main>
            )}

            {mobile && (
                <nav className="tabbar" aria-label="Menu">
                    {SECTIONS.map((id) => {
                        const Icon = sectionIcon[id];
                        return (
                            <button
                                key={id}
                                type="button"
                                className="tab"
                                data-section={id}
                                aria-current={focus === id ? 'page' : undefined}
                                onClick={() => goTo(id)}
                            >
                                <Icon />
                                <span>{t.ui.nav[id]}</span>
                            </button>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
