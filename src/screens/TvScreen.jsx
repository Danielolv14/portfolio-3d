// TV = Experiências, no estilo de um perfil do LinkedIn (decisão 8: só inspiração, sem logos).
// A TV vira uma "smart TV" com o perfil profissional: capa com arte própria, foto, título, o botão
// "Conectar" (leva ao LinkedIn de verdade) e as abas Experiência, Formação e Competências.
// De dia o tema é claro; à noite, escuro, acompanhando o quarto (tv.css). A textura da TV em
// repouso (tvScreenTexture, em room/textures.js) desenha o mesmo cartão do topo.
import { useState } from 'react';

import { channels, monthLabel, profile } from '../content/content';
import { IconArrow, IconClose, IconList, IconPin } from '../app/Icons';
import './tv.css';

const LINKEDIN_URL = channels.find((c) => c.id === 'linkedin').href;

// Meses entre o início e o fim (ou hoje), contando os dois, como no LinkedIn
function monthsBetween(start, end) {
    const [y0, m0] = start.split('-').map(Number);
    const now = new Date();
    const [y1, m1] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
    return Math.max(1, (y1 - y0) * 12 + (m1 - m0) + 1);
}

// Em quantos projetos uma tecnologia aparece ("Java" conta "Java 21"; "HTML e CSS" conta HTML ou CSS)
function projectsUsing(skill, projects) {
    const names = skill.split(/ e | and /).map((s) => s.toLowerCase());
    return projects.filter((p) => p.tech.some((x) => names.some((n) => x.toLowerCase().split(' ')[0] === n.split(' ')[0]))).length;
}

// Logo genérico: um quadrado com a inicial (nada de logo real de empresa)
function Monogram({ text }) {
    return (
        <span className="li-logo" aria-hidden="true">
            {text}
        </span>
    );
}

function Experience({ t, l }) {
    // destaques abertos por experiência
    const [open, setOpen] = useState({});
    return (
        <ul className="li-list">
            {t.experience.items.map((item) => {
                const shown = open[item.id];
                return (
                    <li key={item.id} className="li-item">
                        <Monogram text={item.org[0]} />
                        <div className="li-item-body">
                            <h4>{item.role}</h4>
                            <p>
                                {item.url ? (
                                    <a href={item.url} target="_blank" rel="noreferrer">
                                        {item.org}
                                    </a>
                                ) : (
                                    item.org
                                )}{' '}
                                · {l.fullTime}
                            </p>
                            <p className="li-muted">
                                {monthLabel(item.start, t)} – {item.end ? monthLabel(item.end, t) : t.ui.present} ·{' '}
                                {l.duration(monthsBetween(item.start, item.end))}
                            </p>
                            <p className="li-muted">{t.about.location}</p>
                            <p className="li-text">{item.description}</p>
                            {item.highlights?.length > 0 && (
                                <>
                                    <button
                                        type="button"
                                        className="li-more"
                                        aria-expanded={Boolean(shown)}
                                        onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}
                                    >
                                        {shown ? l.showLess : l.showMore}
                                    </button>
                                    {shown && (
                                        <ul className="li-highlights">
                                            {item.highlights.map((h) => (
                                                <li key={h}>{h}</li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            )}
                            {item.tech?.length > 0 && (
                                <p className="li-skills">
                                    <b>{l.tabs.skills}:</b> {item.tech.join(' · ')}
                                </p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function Education({ t }) {
    return (
        <ul className="li-list">
            {t.about.education.map((e) => (
                <li key={e.school + e.course} className="li-item">
                    <Monogram text={e.school.replace(/[^A-Z]/g, '').slice(0, 3) || e.school[0]} />
                    <div className="li-item-body">
                        <h4>{e.school}</h4>
                        <p>{e.course}</p>
                        <p className="li-muted">{e.detail}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

function Skills({ t, l }) {
    const projects = t.projects.items;
    return (
        <ul className="li-skill-list">
            {t.about.stack.map((skill) => (
                <li key={skill}>
                    <b>{skill}</b>
                    <span className="li-muted">{l.skillsUsed(projectsUsing(skill, projects))}</span>
                </li>
            ))}
        </ul>
    );
}

export default function TvScreen({ t, headingRef, onClose, onRead2d }) {
    const s = t.ui.screen;
    const l = t.experience.li;
    const [tab, setTab] = useState('experience');
    const job = t.experience.items[0];
    const school = t.about.education[0];
    return (
        <>
            <div className="win-bar">
                <span className="win-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                <span className="win-path" aria-hidden="true">
                    {s.path.experience}
                </span>
                <button type="button" className="win-close" onClick={onClose} aria-label={s.closeWindow} title={s.closeWindow}>
                    <IconClose />
                </button>
            </div>

            <div className="win-scroll li">
                <h2 ref={headingRef} id="screen-title" tabIndex={-1} className="sr-only">
                    {t.ui.nav.experience}
                </h2>

                {/* Cartão do topo: capa, foto por cima da capa, nome, título e o botão Conectar */}
                <section className="li-card li-top">
                    <div className="li-cover" aria-hidden="true" />
                    <img className="li-avatar" src={profile.photo} alt={profile.name} />
                    <div className="li-top-body">
                        <div>
                            <h3 className="li-name">{profile.name}</h3>
                            <p className="li-headline">{l.headline}</p>
                            <p className="li-muted li-place">
                                <IconPin /> {t.about.location}
                            </p>
                            <a className="li-connect" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                                {l.connect} <IconArrow />
                            </a>
                        </div>
                        <ul className="li-now">
                            {job && (
                                <li>
                                    <Monogram text={job.org[0]} /> {job.org}
                                </li>
                            )}
                            {school && (
                                <li>
                                    <Monogram text={school.school.replace(/[^A-Z]/g, '').slice(0, 3)} /> {school.school}
                                </li>
                            )}
                        </ul>
                    </div>
                </section>

                <section className="li-card li-section">
                    <nav className="li-tabs" aria-label={t.ui.nav.experience}>
                        {Object.entries(l.tabs).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                className="li-tab"
                                aria-current={tab === id ? 'page' : undefined}
                                onClick={() => setTab(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                    {tab === 'experience' && <Experience t={t} l={l} />}
                    {tab === 'education' && <Education t={t} />}
                    {tab === 'skills' && <Skills t={t} l={l} />}
                </section>
            </div>

            <div className="win-task">
                <span className="win-hint">{s.escHint}</span>
                <button type="button" className="win-btn" onClick={onRead2d}>
                    <IconList />
                    {s.read2d}
                </button>
                <button type="button" className="win-btn win-btn-primary" onClick={onClose}>
                    {t.ui.close}
                </button>
            </div>
        </>
    );
}
