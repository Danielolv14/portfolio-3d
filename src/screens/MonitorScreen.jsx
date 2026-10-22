// Monitor = Projetos, no estilo de um perfil do GitHub (decisão 8: só inspiração, sem logos).
// Uma "janela" de navegador: barra com o endereço, as abas do perfil (Visão geral e Repositórios),
// a página de um projeto (o README) e a barra de tarefas com as saídas. A textura do monitor em
// repouso (monitorScreenTexture, em room/textures.js) desenha a Visão geral com as mesmas cores.
import { useState } from 'react';

import { channels, monthLabel, profile } from '../content/content';
import { IconArrow, IconClose, IconList, IconLock, IconPin, IconUsers } from '../app/Icons';
import { contributionWeeks, github, languageColor, projectList } from './github';
import './monitor.css';

const GITHUB_URL = channels.find((c) => c.id === 'github').href;

// '2026-10-22T…' -> '22 out 2026'
function dayLabel(iso, t) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${Number(d)} ${t.ui.months[Number(m) - 1]} ${y}`;
}

function IconRepo() {
    return (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M3 1.5A1.5 1.5 0 0 1 4.5 0h9a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5H11v-1h2V1H4.5a.5.5 0 0 0-.5.5v9.6c.15-.06.32-.1.5-.1H9v1H4.5a.5.5 0 0 0 0 1H5v1h-.5A1.5 1.5 0 0 1 3 12.5zM6 12h4v4l-2-1.5L6 16z" />
        </svg>
    );
}

function IconStar() {
    return (
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
            <path d="m8 1.6 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.4l-3.8 2 .7-4.3-3.1-3 4.3-.6z" strokeLinejoin="round" />
        </svg>
    );
}

function Language({ name }) {
    return (
        <span className="gh-lang">
            <i style={{ background: languageColor(name) }} />
            {name}
        </span>
    );
}

function Visibility({ item, g }) {
    return <span className="gh-label">{item.privateRepo ? g.private : g.public}</span>;
}

function Profile({ t, g }) {
    return (
        <aside className="gh-profile">
            <img className="gh-avatar" src={profile.photo} alt={profile.name} />
            <h3 className="gh-name">{profile.name}</h3>
            <p className="gh-login">{github.user?.login ?? 'Danielolv14'}</p>
            <p className="gh-bio">{t.about.role}</p>
            <a className="gh-follow" href={GITHUB_URL} target="_blank" rel="noreferrer">
                {g.profile} <IconArrow />
            </a>
            {github.user && (
                <p className="gh-meta">
                    <IconUsers /> <b>{github.user.followers}</b> {g.followers(github.user.followers)} · <b>{github.user.following}</b>{' '}
                    {g.following}
                </p>
            )}
            <p className="gh-meta">
                <IconPin /> {t.about.location}
            </p>
        </aside>
    );
}

function Contributions({ g, t }) {
    const { weeks, total, real } = contributionWeeks();
    if (!weeks.length) return null;
    return (
        <section className="gh-box gh-contrib" aria-label={real ? g.contributions(total) : g.activity(total)}>
            <h4>{real ? g.contributions(total) : g.activity(total)}</h4>
            <div className="gh-grid" aria-hidden="true">
                {weeks.map((week) => (
                    <span key={week[0].date} className="gh-week">
                        {week.map((d) => (
                            <i key={d.date} data-l={d.level} title={g.day(d.count, dayLabel(d.date, t))} />
                        ))}
                    </span>
                ))}
            </div>
            <p className="gh-legend" aria-hidden="true">
                {g.less}
                {[0, 1, 2, 3, 4].map((l) => (
                    <i key={l} data-l={l} />
                ))}
                {g.more}
            </p>
        </section>
    );
}

function Overview({ t, g, items, open }) {
    return (
        <div className="gh-overview">
            <Profile t={t} g={g} />
            <div className="gh-main">
                <h4 className="gh-sub">{g.pinned}</h4>
                <ul className="gh-pins">
                    {items.map((item) => (
                        <li key={item.id} className="gh-box gh-pin">
                            <p className="gh-pin-head">
                                <IconRepo />
                                <button type="button" className="gh-link" onClick={() => open(item.id)}>
                                    {item.repoName}
                                </button>
                                <Visibility item={item} g={g} />
                            </p>
                            <p className="gh-desc">{item.description}</p>
                            <p className="gh-foot">
                                <Language name={item.language} />
                                {item.stars > 0 && (
                                    <span>
                                        <IconStar /> {item.stars}
                                    </span>
                                )}
                                {item.team && (
                                    <span>
                                        <IconUsers /> {t.projects.team}
                                    </span>
                                )}
                                <span>{monthLabel(item.date, t)}</span>
                            </p>
                        </li>
                    ))}
                </ul>
                <Contributions g={g} t={t} />
            </div>
        </div>
    );
}

function Repositories({ t, g, items, open }) {
    return (
        <ul className="gh-repos">
            {items.map((item) => (
                <li key={item.id} className="gh-repo">
                    <p className="gh-pin-head">
                        <button type="button" className="gh-link gh-link-big" onClick={() => open(item.id)}>
                            {item.name}
                        </button>
                        <Visibility item={item} g={g} />
                    </p>
                    <p className="gh-desc">{item.description}</p>
                    <ul className="gh-topics">
                        {item.tech.map((tech) => (
                            <li key={tech}>{tech}</li>
                        ))}
                    </ul>
                    <p className="gh-foot">
                        <Language name={item.language} />
                        {item.stars > 0 && (
                            <span>
                                <IconStar /> {item.stars}
                            </span>
                        )}
                        <span>{item.pushed ? `${g.updated} ${dayLabel(item.pushed, t)}` : `${g.started} ${monthLabel(item.date, t)}`}</span>
                    </p>
                </li>
            ))}
        </ul>
    );
}

// Página de um projeto: cabeçalho do repositório e o README com a mídia, a descrição e os links
function Repo({ t, g, item, back }) {
    const p = t.projects;
    return (
        <article className="gh-repo-page">
            <p className="gh-crumb">
                <button type="button" className="gh-link" onClick={back}>
                    {github.user?.login ?? 'Danielolv14'}
                </button>
                <span aria-hidden="true">/</span>
                <b>{item.repoName}</b>
                <Visibility item={item} g={g} />
            </p>
            <div className="gh-box gh-readme">
                <p className="gh-readme-bar">
                    <IconList /> {g.readme}
                </p>
                <div className="gh-readme-body">
                    <h3>{item.name}</h3>
                    {item.media && <img className="project-media" src={item.media} alt="" loading="lazy" />}
                    <p>{item.description}</p>
                    {item.role && (
                        <>
                            <h4>{g.whatIDid}</h4>
                            <p>{item.role}</p>
                        </>
                    )}
                    <h4>{g.built}</h4>
                    <ul className="gh-topics">
                        {item.tech.map((tech) => (
                            <li key={tech}>{tech}</li>
                        ))}
                    </ul>
                    <p className="gh-actions">
                        {item.links.map((link) => (
                            <a key={link.url} className="gh-btn" href={link.url} target="_blank" rel="noreferrer">
                                {p.links[link.kind]} <IconArrow />
                            </a>
                        ))}
                        {item.privateRepo && (
                            <span className="gh-meta">
                                <IconLock /> {p.privateRepo}
                            </span>
                        )}
                    </p>
                </div>
            </div>
        </article>
    );
}

export default function MonitorScreen({ t, headingRef, onClose, onRead2d }) {
    const s = t.ui.screen;
    const g = t.projects.gh;
    const items = projectList(t);
    const [tab, setTab] = useState('overview');
    // projeto aberto (a página do repositório); ao voltar, fica a aba de onde ele foi aberto
    const [openId, setOpenId] = useState(null);
    const current = items.find((i) => i.id === openId);
    return (
        <>
            <div className="win-bar">
                {/* as três bolinhas são só enfeite */}
                <span className="win-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                <span className="win-path" aria-hidden="true">
                    {s.path.projects}
                    {current ? `/${current.repoName}` : tab === 'repos' ? '?tab=repositories' : ''}
                </span>
                <button type="button" className="win-close" onClick={onClose} aria-label={s.closeWindow} title={s.closeWindow}>
                    <IconClose />
                </button>
            </div>

            <div className="win-scroll gh">
                {/* o título da seção fica para leitores de tela e para o foco; na tela, as abas fazem o papel */}
                <h2 ref={headingRef} id="screen-title" tabIndex={-1} className="sr-only">
                    {t.ui.nav.projects}
                </h2>
                <nav className="gh-tabs" aria-label={t.ui.nav.projects}>
                    {[
                        ['overview', g.overview],
                        ['repos', g.repositories]
                    ].map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            className="gh-tab"
                            aria-current={!current && tab === id ? 'page' : undefined}
                            onClick={() => {
                                setTab(id);
                                setOpenId(null);
                            }}
                        >
                            {id === 'repos' ? <IconRepo /> : <IconList />}
                            {label}
                            {id === 'repos' && <span className="gh-count">{items.length}</span>}
                        </button>
                    ))}
                </nav>
                {current ? (
                    <Repo t={t} g={g} item={current} back={() => setOpenId(null)} />
                ) : tab === 'overview' ? (
                    <Overview t={t} g={g} items={items} open={setOpenId} />
                ) : (
                    <Repositories t={t} g={g} items={items} open={setOpenId} />
                )}
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
