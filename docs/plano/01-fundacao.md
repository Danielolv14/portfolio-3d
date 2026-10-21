# Fase 0 — Fundação

Antes de construir o pipeline, deixar o repositório e o deploy prontos para uma fase longa de trabalho. Nada aqui muda o visual. Muda a base em cima da qual tudo será feito.

**Esforço total:** M. **Marco:** M0, "casa arrumada".

> **Situação em 21/10/2026:** feita, menos o que depende do painel da Vercel (apagar o projeto duplicado e liberar o acesso do conector) e a atualização opcional da stack (React 19 / R3F 9), que fica para quando o pipeline pedir.

---

## 0.1 Deploy confiável

**Problema:** em 21/10 o site no ar (`portfolio-3d-wyhb`) servia uma versão antiga, sem o celular. Ou a Vercel não está ligada à `main`, ou o último deploy falhou.

- Conferir em *Settings → Git* se o projeto está ligado a `Danielolv14/portfolio-3d`, branch de produção `main`.
- Apagar o projeto duplicado `portfolio-3d` (dá 404).
- Liberar o acesso do conector da Vercel ao time `danielolv14s-projects`, para o Claude conseguir ver deploys e logs sozinho.
- Cada Pull Request ganha um link de prévia, e é por ele que se aprova uma mudança visual antes de ir para a `main`.

**Pronto quando:** um push na `main` aparece no site em até 2 minutos.

## 0.2 Build com cache correto

**Problema:** o `vite.config.js` gera nomes fixos (`app.js`, `index.css`) e junta tudo num arquivo só (`inlineDynamicImports`). Com nome fixo, o navegador pode ficar com a versão velha em cache. Com tudo junto, o primeiro download fica maior que o necessário.

- Voltar aos nomes com hash (`app.[hash].js`), que a Vercel serve com cache permanente.
- Separar o three.js e o React Three Fiber num pedaço próprio (*chunk*), que quase nunca muda.
- Carregar o 3D sob demanda (`React.lazy`): a interface e o conteúdo aparecem antes, e o quarto chega em seguida.
- Os arquivos grandes (GLB, KTX2) vão em `public/room/` com o hash no nome, gerado pelo pipeline.

**Pronto quando:** o build gera arquivos com hash e o primeiro JavaScript necessário fica abaixo de 250 KB comprimidos.

## 0.3 Organização do repositório

Estrutura alvo, ao fim da Fase 1:

```
portfolio-3d/
├── src/
│   ├── app/            App.jsx, estado global, rotas
│   ├── scene/          Canvas, câmera (CameraRig), efeitos, carregamento
│   ├── room/           o quarto em código (fonte do bake; não é mais o que o site desenha)
│   ├── baked/          BakedRoom, BakedMaterial, ligação dos nós do GLB com hotspots e telas
│   ├── screens/        conteúdo dentro do monitor, TV e celular
│   ├── sections/       Sobre mim, Projetos, Experiências, Contato
│   ├── content/        textos PT/EN e dados
│   └── export/         página que exporta a cena (só desenvolvimento)
├── pipeline/
│   ├── README.md       como rodar o bake
│   ├── config/         bake.json: grupos, resoluções, amostras, luzes
│   ├── export/         exportar.mjs (cena → GLB)
│   ├── blender/        scripts Python que rodam dentro do Blender
│   └── optimize/       compressão (gltf-transform, KTX2)
├── art/                arquivos .blend feitos à mão, se a pergunta P2 for "sim" (Git LFS)
├── public/room/        saída do pipeline: room.[hash].glb e texturas .ktx2
├── docs/
│   ├── plano/          este plano
│   ├── estudo-de-caso/ o texto "como foi feito" (Fase 4)
│   ├── metricas/       capturas e números de antes e depois
│   └── historico/      tudo da fase da faculdade: wireframes, protótipos, plano E1–E13
└── scripts/            capturas, desempenho, utilitários
```

Passos:

- Mover `docs/wireframes`, `docs/prototipos`, `docs/planejamento/plano-room-portfolio.md` e `prompt-continuacao-nuvem.md` para `docs/historico/`.
- Separar `src/` nas pastas acima **sem mudar comportamento**: só mover arquivos e ajustar imports, num commit próprio.
- Apagar `scripts/artifact-page.mjs` e os scripts de wireframe se não forem mais usados.

## 0.4 Qualidade de código

- **ESLint + Prettier** com a configuração atual de estilo (4 espaços, aspas simples), mais `npm run lint`.
- **GitHub Actions:** em cada push e PR, roda `lint` e `build`, e reporta o tamanho do bundle.
- **Dependências:** `npm audit` mostrou 4 vulnerabilidades (3 moderadas, 1 alta). Ver se vêm só de ferramentas de desenvolvimento e atualizar o que for seguro.
- **Atualizar a stack com calma:** three 0.164 → versão atual, R3F 8 → 9 e drei 9 → 10 pedem React 19. Fazer isso **antes** do pipeline, numa etapa própria e com capturas de comparação, porque depois o custo de mexer é maior. (Opcional, mas recomendado.)

## 0.5 Preparar o quarto em código para ser exportado

O pipeline precisa saber o que fazer com cada parte do quarto. **Como ficou:** em vez de renomear centenas de malhas, cada área é embrulhada num `<Bake>` (em `src/room/shared.jsx`), que grava a marcação no `userData`. O exportador do three.js leva o `userData` para o GLB, e o Blender lê como propriedade do objeto. A marcação mais próxima vale para tudo o que estiver dentro.

| Marcação | Significa | Onde |
|---|---|---|
| `group: shell` | Vai para o atlas da estrutura | `Shell` (paredes, piso, porta, janela, pôster do CS) |
| `group: furniture` | Atlas dos móveis | Mesa, painel, gabinete, monitor, TV, nicho, cama, criado-mudo, pôsteres dos filmes |
| `group: props` | Atlas dos objetos | Periféricos, cadeira, tudo nas prateleiras, celular, tapete, bola, mochila, tênis |
| `kind: hotspot` + `id` | Objeto clicável (o `Hotspot` marca sozinho) | projects, experience, about, contact, lamp |
| `kind: dyn` + `id` | Assada, mas em malha separada porque se mexe | cadeira |
| `kind: live` | Continua desenhada pelo código, não é assada | o céu atrás da janela |
| `kind: glass` | Vidro com reflexo em tempo real | vidro da janela |
| `kind: skip` | Não exportar | áreas de clique invisíveis |
| nome `screen-*` | Tela com a camada HTML (já existia) | monitor, TV, celular |
| pelo material | Brilho (`emit`), metal e vidro são detectados sozinhos | emissivo > 0, metalness ≥ 0,8, transparente |

**Conferência:** `node scripts/inventario.mjs` (com o servidor rodando) conta as malhas por grupo e tipo e falha se alguma ficar sem grupo. Em 21/10: 422 malhas (65 shell, 135 furniture, 222 props), todas com grupo; 20 emissivas, 30 de metal e 9 de vidro detectadas pelo material.

- Marcar as partes que hoje usam truques de luz falsa, para remover depois do bake. Exemplo: o brilho emissivo da cabeceira em `Bed.jsx`, que imita a luz rebatida da janela. (Fica para a Fase 1b.)

## 0.6 Linha de base

- Rodar `scripts/desempenho.mjs` e `scripts/captura.mjs` nos **8 ângulos padrão** (visão geral de dia e de noite, mesa, gabinete, nicho, porta, janela, cama), mais celular retrato.
- Salvar em `docs/metricas/2026-10-base/`: capturas, draw calls, triângulos, FPS (computador e CPU 4x), tamanho do download e Lighthouse.
- Essas imagens são o "antes" do estudo de caso.

## Checklist de pronto da Fase 0

- [x] Push na `main` publica sozinho (conferido em 21/10)
- [ ] Projeto duplicado `portfolio-3d` removido e conector da Vercel com acesso ao time (painel da Vercel, com o Daniel)
- [x] Build com hash e chunks; 3D carregado sob demanda (JS inicial: 477 → 93 KB gzip)
- [x] Pastas reorganizadas, histórico da faculdade em `docs/historico/`
- [x] Lint, Prettier e CI rodando; `npm audit` sem vulnerabilidades (Vite 6.4.5, drei 9.122.0)
- [x] Todas as malhas com grupo de bake (`scripts/inventario.mjs`)
- [x] Linha de base registrada em `docs/metricas/2026-10-base/` (459 draw calls, 37 FPS no celular simulado)
