// Dados da tela do monitor (Projetos no estilo de um perfil do GitHub): o perfil como ele está hoje
// no GitHub (scripts/github.mjs -> src/content/github.json, buscado no build) ligado aos projetos do
// content.js, que têm a página com a descrição, a mídia e os links.
// Usado pela camada HTML (MonitorScreen) e pela textura da tela em repouso (room/textures.js).
import gh from '../content/github.json';
import avatar from '../content/github-avatar.jpg';

// Cores das linguagens (as mesmas do GitHub, que vêm do projeto Linguist, licença MIT)
const LANGUAGE_COLORS = {
    Java: '#b07219',
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    CSS: '#663399',
    HTML: '#e34c26',
    PHP: '#4f5d95',
    Python: '#3572a5',
    'C++': '#f34b7d',
    C: '#555555'
};

export function languageColor(language) {
    return LANGUAGE_COLORS[language] ?? '#8b949e';
}

export const github = gh;
export const githubAvatar = avatar;
export const GITHUB_LOGIN = gh.user?.login ?? 'Danielolv14';

const repoByUrl = new Map((gh.repos ?? []).map((r) => [r.url.toLowerCase(), r]));

// Projeto + dados reais dos repositórios dele (linguagem, estrelas, último envio).
// O que não está no GitHub (MinhaReceita, privado) fica só com o content.js.
export function withRepoData(item) {
    const repos = item.links.map((l) => repoByUrl.get(l.url.toLowerCase())).filter(Boolean);
    const main = repos[0];
    // a primeira tecnologia que é uma linguagem conhecida, se a API não disser
    const language = main?.language ?? item.tech.find((x) => LANGUAGE_COLORS[x.split(' ')[0]])?.split(' ')[0] ?? item.tech[0];
    return {
        ...item,
        repoName: main?.name ?? item.id,
        language,
        stars: repos.reduce((sum, r) => sum + (r.stars || 0), 0),
        pushed:
            repos
                .map((r) => r.pushed)
                .sort()
                .pop() ?? null
    };
}

// Projetos do mais antigo ao mais recente (a linha do tempo pedida desde o começo)
export function projectList(t) {
    return [...t.projects.items].sort((a, b) => a.date.localeCompare(b.date)).map(withRepoData);
}

// Qual projeto do content.js tem este repositório (pelos links ou por `otherRepos`)
function projectOf(url, t) {
    const u = url.toLowerCase();
    return t.projects.items.find((p) => [...p.links.map((l) => l.url), ...(p.otherRepos ?? [])].some((x) => x.toLowerCase() === u)) ?? null;
}

// Um repositório do jeito que o GitHub mostra, com o projeto (se houver) para abrir a página dele
function repoCard(repo, t) {
    return {
        name: repo.name,
        url: repo.url,
        description: repo.description ?? '',
        language: repo.language,
        stars: repo.stars ?? 0,
        pushed: repo.pushed,
        topics: repo.topics ?? [],
        project: projectOf(repo.url, t)
    };
}

// Fixados do perfil, na ordem dele
export function pinnedList(t) {
    return (gh.pinned ?? [])
        .map(({ owner, name }) => (gh.repos ?? []).find((r) => r.url.toLowerCase() === `https://github.com/${owner}/${name}`.toLowerCase()))
        .filter(Boolean)
        .map((r) => repoCard(r, t));
}

// Aba Repositórios: todos os públicos, do envio mais recente para o mais antigo (o padrão do GitHub)
export function repoList(t) {
    return [...(gh.repos ?? [])].sort((a, b) => (b.pushed ?? '').localeCompare(a.pushed ?? '')).map((r) => repoCard(r, t));
}

// Redes do perfil (Instagram, LinkedIn...) com o nome curto que o GitHub mostra ao lado do ícone
export function socialList() {
    return (gh.user?.socials ?? []).map(({ provider, url }) => {
        const path = new URL(url).pathname.replace(/\/$/, '');
        const handle = provider === 'linkedin' ? path.replace(/^\//, '') : path.split('/').pop();
        return { provider, url, handle, label: provider[0].toUpperCase() + provider.slice(1) };
    });
}

// Nomes dos ícones da seção "Languages and Tools" do README (os do serviço de ícones) para texto
const TOOL_NAMES = {
    js: 'JavaScript',
    ts: 'TypeScript',
    cpp: 'C++',
    cs: 'C#',
    html: 'HTML',
    css: 'CSS',
    php: 'PHP',
    mysql: 'MySQL',
    postgres: 'PostgreSQL',
    postgresql: 'PostgreSQL',
    sqlserver: 'SQL Server',
    github: 'GitHub',
    vue: 'Vue.js',
    react: 'React',
    nodejs: 'Node.js',
    spring: 'Spring',
    tailwind: 'Tailwind CSS'
};
const toolName = (id) => TOOL_NAMES[id] ?? id[0].toUpperCase() + id.slice(1);

// README do perfil (HTML que o GitHub gerou) arrumado para o monitor, sem carregar nada de fora:
// - os ícones de "Languages and Tools" (uma imagem só, com a lista na URL) viram etiquetas de texto;
// - os selos com link (LinkedIn, Gmail...) viram botões com o nome; os soltos (seguidores, visitas) saem;
// - os ícones de link dos títulos saem e os links abrem em outra aba.
// Roda no navegador (usa o DOMParser); devolve '' se não houver README.
export function profileReadme() {
    if (!gh.readme || typeof DOMParser === 'undefined') return '';
    const doc = new DOMParser().parseFromString(gh.readme, 'text/html');
    const root = doc.querySelector('article') ?? doc.body;
    root.querySelectorAll('a.anchor, br, .zeroclipboard-container, clipboard-copy').forEach((el) => el.remove());
    root.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('data-canonical-src') ?? img.getAttribute('src') ?? '';
        const link = img.closest('a');
        const icons = /[?&]i=([^&]+)/.exec(src);
        if (icons && /icons/.test(src)) {
            const list = doc.createElement('ul');
            list.className = 'gh-tools';
            for (const id of decodeURIComponent(icons[1]).split(',')) {
                const li = doc.createElement('li');
                li.textContent = toolName(id.trim());
                list.append(li);
            }
            (link ?? img).replaceWith(list);
        } else if (link && !/camo\.githubusercontent/.test(link.href) && img.alt) {
            link.textContent = img.alt;
            link.className = 'gh-chip-link';
        } else {
            (link ?? img).remove();
        }
    });
    // blocos que ficaram vazios (a linha dos selos soltos)
    root.querySelectorAll('div, p').forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector('ul, hr, pre')) el.remove();
    });
    root.querySelectorAll('a[href]').forEach((a) => {
        a.target = '_blank';
        a.rel = 'noreferrer';
    });
    return root.innerHTML;
}

// O README em blocos de texto, na ordem, para a textura do monitor desenhar o começo dele:
// { type: 'h2' | 'h3' | 'code' | 'p' | 'hr' | 'tools' | 'pre', text?, items?, lines? }
export function profileReadmeBlocks() {
    const html = profileReadme();
    if (!html) return [];
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
    const blocks = [];
    for (const el of doc.body.firstElementChild.children) {
        const heading = el.matches('h1, h2, h3, h4') ? el : el.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4');
        const text = el.textContent.trim();
        if (heading)
            blocks.push({ type: heading.tagName === 'H2' || heading.tagName === 'H1' ? 'h2' : 'h3', text: heading.textContent.trim() });
        else if (el.matches('hr')) blocks.push({ type: 'hr' });
        else if (el.matches('ul.gh-tools')) blocks.push({ type: 'tools', items: [...el.children].map((li) => li.textContent) });
        else if (el.querySelector('pre') || el.matches('pre'))
            blocks.push({ type: 'pre', lines: el.textContent.replace(/\n+$/, '').split('\n') });
        else if (
            el.matches('p') &&
            el.children.length === 1 &&
            el.firstElementChild.matches('code') &&
            text === el.firstElementChild.textContent.trim()
        )
            blocks.push({ type: 'code', text });
        else if (text) blocks.push({ type: 'p', text: text.replace(/\s+/g, ' ') });
    }
    return blocks;
}

// Gráfico de contribuições: colunas de 7 dias (domingo em cima), com o nível 0–4 de cada dia.
// O nível vem do próprio GitHub; sem ele (atividade pública), segue os quartis dos dias com atividade.
export function contributionWeeks() {
    const days = gh.calendar?.days ?? [];
    const counts = days
        .map((d) => d.count)
        .filter((n) => n > 0)
        .sort((a, b) => a - b);
    const q = (p) => counts[Math.min(counts.length - 1, Math.floor(p * counts.length))] ?? 1;
    const cuts = [q(0.25), q(0.5), q(0.75)];
    const level = (n) => (n <= 0 ? 0 : n <= cuts[0] ? 1 : n <= cuts[1] ? 2 : n <= cuts[2] ? 3 : 4);
    const weeks = [];
    days.forEach((d, i) => {
        // o primeiro dia da lista é um domingo (scripts/github.mjs); a API GraphQL também começa no domingo
        if (i % 7 === 0) weeks.push([]);
        weeks[weeks.length - 1].push({ ...d, level: d.level ?? level(d.count) });
    });
    // "contribuições" quando os números são os do GitHub (GraphQL ou a página do perfil)
    return { weeks, total: gh.calendar?.total ?? 0, real: ['graphql', 'page'].includes(gh.calendar?.source) };
}
