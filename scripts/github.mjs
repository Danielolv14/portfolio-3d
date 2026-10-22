// Dados reais do GitHub para a tela do monitor (Projetos), buscados no build e não no navegador
// do visitante. Grava src/content/github.json, que vai junto no código do site.
//   node scripts/github.mjs        (roda sozinho antes do `npm run build`, pelo "prebuild")
//
// - Perfil e repositórios: API pública (sem token, 60 pedidos por hora; aqui são 3).
// - Gráfico de contribuições: com GITHUB_TOKEN (variável de ambiente na Vercel, nunca no código),
//   vem o calendário de verdade pela API GraphQL. Sem token, os quadradinhos são montados com a
//   atividade pública: commits enviados nos últimos 90 dias e a criação de cada repositório.
// - Se a API falhar, o JSON salvo antes continua valendo e o build segue.
import { readFileSync, writeFileSync } from 'node:fs';

const USER = 'Danielolv14';
const OUT = 'src/content/github.json';
const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-3d-build' };

async function get(path) {
    const r = await fetch(`${API}${path}`, { headers, signal: AbortSignal.timeout(10000) });
    if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
    return r.json();
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
        totalContributions weeks { contributionDays { date contributionCount } } } } } }`;
    const r = await fetch(`${API}/graphql`, {
        method: 'POST',
        headers: { ...headers, Authorization: `bearer ${TOKEN}` },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(10000)
    });
    const json = await r.json();
    const cal = json.data.user.contributionsCollection.contributionCalendar;
    const days = cal.weeks.flatMap((w) => w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount })));
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
    let calendar;
    try {
        calendar = TOKEN ? await calendarFromGraphQL() : await calendarFromEvents(repos);
    } catch (e) {
        console.warn(`github: calendário indisponível (${e.message})`);
        calendar = null;
    }
    const data = {
        fetchedAt: new Date().toISOString(),
        user: {
            login: user.login,
            avatar: user.avatar_url,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            publicRepos: user.public_repos
        },
        repos,
        calendar
    };
    writeFileSync(OUT, `${JSON.stringify(data, null, 4)}\n`);
    console.log(`github: ${repos.length} repositórios, calendário ${calendar?.source ?? 'sem dados'} -> ${OUT}`);
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
