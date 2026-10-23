// Dados reais do GitHub para a tela do monitor (Projetos), buscados no build e não no navegador
// do visitante. Grava src/content/github.json, que vai junto no código do site.
//   node scripts/github.mjs        (roda sozinho antes do `npm run build`, pelo "prebuild")
//
// A tela do monitor imita o perfil do jeito que ele está hoje no GitHub:
// - Perfil, redes, repositórios e o README do perfil: API pública (sem token, 60 pedidos por hora; aqui são 4).
// - Foto: baixada para src/content/github-avatar.jpg (a textura do monitor precisa dela no mesmo site).
// - Fixados: a API REST não tem; os nomes saem da página pública do perfil, na ordem dele.
// - Gráfico de contribuições: com GITHUB_TOKEN (variável de ambiente na Vercel, nunca no código), pela
//   API GraphQL; sem token, da página pública de contribuições (os mesmos números e cores do perfil).
//   Se as duas falharem, os quadradinhos são montados com a atividade pública dos últimos 90 dias.
// - Se a API falhar, o JSON salvo antes continua valendo e o build segue; cada parte que falhar
//   sozinha (fixados, README, foto) fica com o valor salvo antes.
import { readFileSync, writeFileSync } from 'node:fs';

const USER = 'Danielolv14';
const OUT = 'src/content/github.json';
const AVATAR = 'src/content/github-avatar.jpg';
const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-3d-build' };

async function get(path, accept = headers.Accept) {
    const r = await fetch(`${API}${path}`, { headers: { ...headers, Accept: accept }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return accept.includes('html') ? r.text() : r.json();
}

// Página pública do github.com (sem login), como texto
async function page(url) {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 portfolio-3d-build' }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    return r.text();
}

// Nomes dos repositórios fixados, na ordem do perfil: [{ owner, name }]
async function pinnedRepos() {
    const html = await page(`https://github.com/${USER}`);
    const pins = [...html.matchAll(/href="\/([\w.-]+)\/([\w.-]+)"[^>]*><span class="repo">/g)].map(([, owner, name]) => ({ owner, name }));
    if (!pins.length) throw new Error('nenhum fixado na página (o HTML do GitHub mudou?)');
    return pins;
}

// Calendário da página pública de contribuições: cada dia com a contagem e o nível de cor (0–4)
async function calendarFromPage() {
    const html = await page(`https://github.com/users/${USER}/contributions`);
    const tips = new Map([...html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)].map(([, id, tip]) => [id, tip]));
    const days = [...html.matchAll(/data-date="(\d{4}-\d\d-\d\d)" id="([^"]+)" data-level="(\d)"/g)]
        .map(([, date, id, level]) => ({
            date,
            count: Number(/^(\d+) contribution/.exec(tips.get(id) ?? '')?.[1] ?? 0),
            level: Number(level)
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    if (days.length < 300) throw new Error(`só ${days.length} dias na página de contribuições`);
    const total = /([\d,]+)\s+contributions?\s+in the last year/.exec(html.replace(/\s+/g, ' '))?.[1];
    return { source: 'page', total: total ? Number(total.replace(/,/g, '')) : days.reduce((s, d) => s + d.count, 0), days };
}

// Foto do perfil: baixada para o site (mesma origem) em 460 px
async function saveAvatar(url) {
    const r = await fetch(`${url}${url.includes('?') ? '&' : '?'}s=460`, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`foto: HTTP ${r.status}`);
    writeFileSync(AVATAR, Buffer.from(await r.arrayBuffer()));
}

// O que já estava salvo (para uma parte que falhar sozinha não apagar o que havia)
function saved() {
    try {
        return JSON.parse(readFileSync(OUT, 'utf8'));
    } catch {
        return {};
    }
}

// Tenta uma parte; se falhar, avisa e devolve o valor de antes
async function attempt(label, fn, fallback) {
    try {
        return await fn();
    } catch (e) {
        console.warn(`github: ${label} indisponível (${e.message}); mantendo o anterior`);
        return fallback;
    }
}

// 53 semanas x 7 dias, terminando hoje (como o gráfico do perfil): [{ date, count }]
function emptyCalendar(today = new Date()) {
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 52 * 7 - end.getUTCDay());
    const days = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        days.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    return days;
}

async function calendarFromGraphQL() {
    const query = `query { user(login: "${USER}") { contributionsCollection { contributionCalendar {
        totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;
    const r = await fetch(`${API}/graphql`, {
        method: 'POST',
        headers: { ...headers, Authorization: `bearer ${TOKEN}` },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(10000)
    });
    const json = await r.json();
    const cal = json.data.user.contributionsCollection.contributionCalendar;
    // o nível de cor que o próprio GitHub usa (NONE, FIRST_QUARTILE... -> 0 a 4)
    const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
    const days = cal.weeks.flatMap((w) =>
        w.contributionDays.map((d) => ({
            date: d.date,
            count: d.contributionCount,
            level: Math.max(0, LEVELS.indexOf(d.contributionLevel))
        }))
    );
    return { source: 'graphql', total: cal.totalContributions, days };
}

async function calendarFromEvents(repos) {
    const days = emptyCalendar();
    const byDate = new Map(days.map((d) => [d.date, d]));
    const add = (iso, n) => {
        const day = byDate.get(iso.slice(0, 10));
        if (day) day.count += n;
    };
    for (const page of [1, 2, 3]) {
        const events = await get(`/users/${USER}/events/public?per_page=100&page=${page}`);
        for (const e of events) {
            if (e.type === 'PushEvent') add(e.created_at, e.payload.size || 1);
            else if (e.type === 'CreateEvent' || e.type === 'PullRequestEvent') add(e.created_at, 1);
        }
        if (events.length < 100) break;
    }
    for (const repo of repos) add(repo.created, 1);
    return { source: 'events', total: days.reduce((s, d) => s + d.count, 0), days };
}

async function main() {
    const before = saved();
    const user = await get(`/users/${USER}`);
    const list = await get(`/users/${USER}/repos?per_page=100&sort=created`);
    const repos = list
        .filter((r) => !r.fork)
        .map((r) => ({
            name: r.name,
            url: r.html_url,
            description: r.description,
            language: r.language,
            stars: r.stargazers_count,
            topics: r.topics ?? [],
            created: r.created_at,
            pushed: r.pushed_at
        }));
    // calendário: GraphQL (com token) > página pública > atividade pública
    let calendar = null;
    for (const [label, fn] of [
        ['GraphQL', TOKEN && calendarFromGraphQL],
        ['página de contribuições', calendarFromPage],
        ['atividade pública', () => calendarFromEvents(repos)]
    ]) {
        if (!fn) continue;
        calendar = await attempt(`calendário (${label})`, fn, null);
        if (calendar) break;
    }
    const socials = await attempt('redes', () => get(`/users/${USER}/social_accounts`), before.user?.socials ?? []);
    const pinned = await attempt('fixados', pinnedRepos, before.pinned ?? []);
    // README do perfil já em HTML (o GitHub converte o Markdown e limpa o HTML)
    const readme = await attempt(
        'README do perfil',
        () => get(`/repos/${USER}/${USER}/readme`, 'application/vnd.github.html+json'),
        before.readme ?? null
    );
    await attempt('foto', () => saveAvatar(user.avatar_url));
    const data = {
        fetchedAt: new Date().toISOString(),
        user: {
            login: user.login,
            name: user.name,
            avatar: user.avatar_url,
            bio: user.bio,
            location: user.location,
            followers: user.followers,
            following: user.following,
            publicRepos: user.public_repos,
            socials: socials.map((s) => ({ provider: s.provider, url: s.url }))
        },
        pinned,
        readme,
        repos,
        calendar
    };
    writeFileSync(OUT, `${JSON.stringify(data, null, 4)}\n`);
    console.log(`github: ${repos.length} repositórios, ${pinned.length} fixados, calendário ${calendar?.source ?? 'sem dados'} -> ${OUT}`);
}

main().catch((e) => {
    // Sem rede ou com a API fora: o build continua com o JSON salvo antes
    const saved = (() => {
        try {
            return JSON.parse(readFileSync(OUT, 'utf8')).fetchedAt;
        } catch {
            return null;
        }
    })();
    console.warn(`github: API indisponível (${e.message}); usando ${saved ? `os dados de ${saved}` : 'nenhum dado'}`);
    if (!saved) writeFileSync(OUT, `${JSON.stringify({ fetchedAt: null, user: null, repos: [], calendar: null }, null, 4)}\n`);
});
