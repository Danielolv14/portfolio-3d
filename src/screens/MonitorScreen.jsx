// Monitor = Projetos, no estilo do perfil do Daniel no GitHub, do jeito que ele está hoje: foto, nome,
// bio e redes do perfil, o README do perfil, os repositórios fixados, o gráfico de contribuições e a
// lista de repositórios (tudo buscado no build, scripts/github.mjs). Uma "janela" de navegador: barra
// com o endereço, as abas do perfil, a página de um projeto (o README com a mídia e os links, para os
// repositórios que têm projeto no content.js) e a barra de tarefas com as saídas. A textura do monitor
// em repouso (monitorScreenTexture, em room/textures.js) desenha o começo da Visão geral.
import { useMemo, useState } from 'react';

import { channels, profile } from '../content/content';
import { IconArrow, IconClose, IconList, IconLock, IconPin, IconUsers } from '../app/Icons';
import {
    GITHUB_LOGIN,
    contributionWeeks,
    github,
    githubAvatar,
    languageColor,
    pinnedList,
    profileReadme,
    projectList,
    repoList,
    socialList
} from './github';
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

// Nome do repositório: abre a página do projeto quando ele existe no content.js; senão, o GitHub
function RepoName({ repo, open, big }) {
    const className = `gh-link${big ? ' gh-link-big' : ''}`;
    if (repo.project) {
        return (
            <button type="button" className={className} onClick={() => open(repo.project.id)}>
                {repo.name}
            </button>
        );
    }
    return (
        <a className={className} href={repo.url} target="_blank" rel="noreferrer">
            {repo.name}
        </a>
    );
}

// Coluna do perfil, como no GitHub: foto, nome, usuário, bio, seguir, seguidores, local e redes
function Profile({ t, g }) {
    const user = github.user;
    return (
        <aside className="gh-profile">
            <img className="gh-avatar" src={user ? githubAvatar : profile.photo} alt={profile.name} />
            <h3 className="gh-name">{user?.name ?? profile.name}</h3>
            <p className="gh-login">{GITHUB_LOGIN}</p>
            <p className="gh-bio">{user?.bio ?? t.about.role}</p>
            <a className="gh-follow" href={GITHUB_URL} target="_blank" rel="noreferrer">
                {g.profile} <IconArrow />
            </a>
            {user && (
                <p className="gh-meta">
                    <IconUsers /> <b>{user.followers}</b> {g.followers(user.followers)} · <b>{user.following}</b> {g.following}
                </p>
            )}
            <p className="gh-meta">
                <IconPin /> {user?.location ?? t.about.location}
            </p>
            {socialList().map((s) => (
                <p key={s.url} className="gh-meta">
                    <span className="gh-social">{s.label}</span>
                    <a className="gh-link" href={s.url} target="_blank" rel="noreferrer">
                        {s.handle}
                    </a>
                </p>
            ))}
        </aside>
    );
}

// README do perfil (o cartão "Danielolv14 / README.md" do topo da Visão geral)
function ProfileReadme() {
    const html = useMemo(profileReadme, []);
    if (!html) return null;
    return (
        <section className="gh-box gh-profile-readme">
            <p className="gh-readme-path">
                {GITHUB_LOGIN} / README<span>.md</span>
            </p>
            {/* HTML que o próprio GitHub gerou e limpou, arrumado em github.js (sem nada carregado de fora) */}
            <div className="gh-md" dangerouslySetInnerHTML={{ __html: html }} />
        </section>
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

function Overview({ t, g, pins, open }) {
    return (
        <div className="gh-overview">
            <Profile t={t} g={g} />
            <div className="gh-main">
                <ProfileReadme />
                {pins.length > 0 && (
                    <>
                        <h4 className="gh-sub">{g.pinned}</h4>
                        <ul className="gh-pins">
                            {pins.map((repo) => (
                                <li key={repo.url} className="gh-box gh-pin">
                                    <p className="gh-pin-head">
                                        <IconRepo />
                                        <RepoName repo={repo} open={open} />
                                        <Visibility item={repo} g={g} />
                                    </p>
                                    {/* como no GitHub: sem descrição no repositório, o cartão fica sem o texto */}
                                    {repo.description && <p className="gh-desc">{repo.description}</p>}
                                    <p className="gh-foot">
                                        {repo.language && <Language name={repo.language} />}
                                        {repo.stars > 0 && (
                                            <span>
                                                <IconStar /> {repo.stars}
                                            </span>
                                        )}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <Contributions g={g} t={t} />
            </div>
        </div>
    );
}

function Repositories({ t, g, repos, open }) {
    return (
        <ul className="gh-repos">
            {repos.map((repo) => (
                <li key={repo.url} className="gh-repo">
                    <p className="gh-pin-head">
                        <RepoName repo={repo} open={open} big />
                        <Visibility item={repo} g={g} />
                    </p>
                    {repo.description && <p className="gh-desc">{repo.description}</p>}
                    {repo.topics.length > 0 && (
                        <ul className="gh-topics">
                            {repo.topics.map((topic) => (
                                <li key={topic}>{topic}</li>
                            ))}
                        </ul>
                    )}
                    <p className="gh-foot">
                        {repo.language && <Language name={repo.language} />}
                        {repo.stars > 0 && (
                            <span>
                                <IconStar /> {repo.stars}
                            </span>
                        )}
                        {repo.pushed && <span>{`${g.updated} ${dayLabel(repo.pushed, t)}`}</span>}
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
                    {GITHUB_LOGIN}
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
    const pins = pinnedList(t);
    const repos = repoList(t);
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
                            {id === 'repos' && <span className="gh-count">{repos.length}</span>}
                        </button>
                    ))}
                </nav>
                {current ? (
                    <Repo t={t} g={g} item={current} back={() => setOpenId(null)} />
                ) : tab === 'overview' ? (
                    <Overview t={t} g={g} pins={pins} open={setOpenId} />
                ) : (
                    <Repositories t={t} g={g} repos={repos} open={setOpenId} />
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
