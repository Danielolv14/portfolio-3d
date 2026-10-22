// Dados da tela do monitor (Projetos no estilo de um perfil do GitHub): os projetos do content.js
// com o que o build buscou na API do GitHub (scripts/github.mjs -> src/content/github.json).
// Usado pela camada HTML (MonitorScreen) e pela textura da tela em repouso (room/textures.js).
import gh from '../content/github.json';

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

// Gráfico de contribuições: colunas de 7 dias (domingo em cima), com o nível 0–4 de cada dia.
// Os níveis seguem os quartis dos dias com atividade, como no GitHub.
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
        weeks[weeks.length - 1].push({ ...d, level: level(d.count) });
    });
    return { weeks, total: gh.calendar?.total ?? 0, real: gh.calendar?.source === 'graphql' };
}
