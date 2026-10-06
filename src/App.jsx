import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { content, profile, SECTIONS } from './content';
import { IconClose, IconCube, IconList, IconMoon, IconSun, sectionIcon } from './Icons';
import { sectionComponents } from './Sections';

const Scene = lazy(() => import('./Scene'));

const MOBILE_MAX = 760;
const PANEL_W = 460;
const TABBAR_H = 64;

function hasWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
    } catch {
        return false;
    }
}

function prefersNight() {
    const theme = document.documentElement.dataset.theme;
    if (theme) return theme === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
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

function SectionHeader({ id, t, headingRef, headingId }) {
    const Icon = sectionIcon[id];
    return (
        <header className="section-head">
            <span className="section-icon">
                <Icon />
            </span>
            <h2 ref={headingRef} id={headingId} tabIndex={-1}>
                {t.ui.nav[id]}
            </h2>
        </header>
    );
}

export default function App() {
    const webgl = useMemo(hasWebGL, []);
    const [lang, setLang] = useState('pt');
    const [night, setNight] = useState(prefersNight);
    const [focus, setFocus] = useState(null);
    const [flat, setFlat] = useState(!webgl);
    const [ready, setReady] = useState(false);
    const headingRef = useRef(null);
    const { w, h } = useViewport();
    const t = content[lang];
    const mobile = w < MOBILE_MAX;
    const reducedMotion = useMemo(
        () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
        []
    );

    // Fração da tela coberta pelo painel, para a câmera compensar
    const panel = mobile
        ? { side: 'bottom', frac: Math.min(0.9, (0.58 * h + TABBAR_H) / h) }
        : { side: 'right', frac: (Math.min(PANEL_W, 0.42 * w) + 16) / w };

    useEffect(() => {
        document.documentElement.dataset.mode = night ? 'night' : 'day';
    }, [night]);

    useEffect(() => {
        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    }, [lang]);

    useEffect(() => {
        document.body.classList.toggle('is-flat', flat);
    }, [flat]);

    useEffect(() => {
        if (focus && headingRef.current) headingRef.current.focus({ preventScroll: true });
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

    // Objetos do quarto: seções abrem o painel; a luminária "&" é o atalho de dia/noite
    const onSelect = useCallback(
        (id) => {
            if (id === 'lamp') return toggleNight();
            setFocus(id);
        },
        [toggleNight]
    );

    const goTo = (id) => {
        if (flat) {
            document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        } else {
            setFocus(id);
        }
    };

    const ActiveSection = focus ? sectionComponents[focus] : null;

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
                            onSelect={onSelect}
                            onClose={() => setFocus(null)}
                            panel={panel}
                            onReady={() => setReady(true)}
                            reducedMotion={reducedMotion}
                            compact={mobile}
                        />
                    </Suspense>
                    {!ready && <p className="loading">{t.ui.loading}</p>}
                    {!focus && ready && <p className="hint">{mobile ? t.ui.hintTouch : t.ui.hint}</p>}

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
