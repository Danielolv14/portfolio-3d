# As três telas: monitor, TV e celular

Ideia do Daniel (21/10): cada tela do quarto vira um **aparelho de verdade**. A pessoa "entra" na tela e navega dentro dela, e cada uma tem a identidade da plataforma que ela lembra. **Some o roxo genérico** que hoje é igual em tudo.

| Tela | Seção | Inspiração | Sensação |
|---|---|---|---|
| Monitor | Projetos | **GitHub** (tema escuro) | "Abri o GitHub dele" |
| TV | Experiências | **LinkedIn** | "Abri o perfil dele" |
| Celular | Contato (e mais) | **iPhone 17 / iOS 26** | "Peguei o celular dele" |

Entra na **Fase 3**, como a trilha **3a — Telas imersivas**.

---

## 0. Regras que valem para as três

1. **Inspirado, não cópia.** Layout, ritmo e paleta lembram a plataforma, mas sem o logo dela como marca da interface, sem fontes proprietárias e sem nada que faça alguém achar que é o site real. O endereço na barra é sempre do Daniel (ex.: `danieloliveira.dev/projetos`).
2. **Só recursos com licença livre:**
   - ícones **Octicons** (MIT, do próprio GitHub) no monitor;
   - ícones **Lucide** (ISC) na TV e no celular;
   - fontes **Mona Sans** (OFL) no monitor e **Inter** (OFL) na TV e no celular.

   Os logos de LinkedIn, GitHub e Instagram aparecem só como **link para o perfil**, como a marca permite.
3. **Mesma mecânica de hoje:** camada HTML encaixada sobre a malha `screen-*` quando a câmera para (`ScreenOverlay` + `ScreenTracker`). Nada de `<Html transform>`.
4. **Textura de repouso igual ao HTML:** de longe, a tela mostra uma imagem idêntica à primeira tela da interface. Ao chegar, a troca é invisível (como já é no monitor).
5. **Um conteúdo, várias telas:** os dados continuam em `src/content/`. A interface de cada aparelho só muda a apresentação. O modo sem 3D e a folha de baixo do celular usam os mesmos dados.
6. **PT e EN** em tudo; navegação por teclado dentro de cada tela; Esc sai da tela.
7. **Cada tela tem a sua navegação interna** (abas, páginas, voltar), com uma pequena pilha de rotas própria. A URL do site acompanha (`/projetos/djfinance`).

## 1. Monitor = Projetos, inspirado no GitHub

**Moldura:** uma janela de navegador escura (barra de abas e endereço) ocupando a tela do monitor. Tema **escuro do GitHub**: fundos `#0d1117` e `#161b22`, bordas `#30363d`, texto `#e6edf3`, links `#4493f8`, verde `#238636` nos botões principais.

**Páginas:**

| Página | O que mostra | Lembra |
|---|---|---|
| **Perfil** (inicial) | Coluna da esquerda com foto, nome, bio, local, links e "seguir"; à direita, **projetos fixados** em cartões e o **gráfico de contribuições** (os quadradinhos verdes) | Página de perfil do GitHub |
| **Repositórios** | Lista com busca e filtro por linguagem, ordenada do mais antigo ao mais recente (exigência que já existia) | Aba Repositories |
| **Projeto** | Cabeçalho com nome, selo "Público" ou "Privado" e tópicos; barra de linguagens colorida; o **README** do projeto renderizado com GIF ou imagem, descrição, tecnologias, "o que eu fiz" e links | Página de um repositório |
| **Linha do tempo** | Os projetos como atividade ao longo do tempo | Aba Activity |

**Dados reais (opcional, recomendado):**
- **No build** (não no navegador do visitante), um script busca na API do GitHub os repositórios públicos do Daniel: estrelas, linguagens, data do último commit, tópicos e o gráfico de contribuições.
- O resultado vira um JSON estático. Se a API falhar, usa a última versão salva.
- O gráfico de contribuições usa a API GraphQL, que precisa de um token na Vercel (variável de ambiente, nunca no código).
- O que não está no GitHub (MinhaReceita, privado) vem do `content.js` com o selo "Privado".

**Detalhes que dão imersão:** o cursor vira o do sistema dentro da tela; abas abrem com a animação de carregamento do navegador; o link "Ver no GitHub" abre o repositório real numa aba nova.

## 2. TV = Experiências, inspirada no LinkedIn

Hoje as Experiências abrem num painel. Passam a abrir **dentro da TV**, com a câmera parando de frente para ela, como no monitor (era a etapa E7).

**Moldura:** a TV vira uma "smart TV" mostrando um perfil profissional. Paleta clara do LinkedIn: fundo `#f4f2ee`, cartões brancos, azul `#0a66c2` nos destaques e texto `#191919`. **De noite**, o tema escuro do LinkedIn (`#1b1f23`), acompanhando o quarto.

**Páginas:**

| Página | O que mostra |
|---|---|
| **Perfil** (inicial) | Capa (uma faixa com arte própria), foto redonda, nome, título ("Estudante de Engenharia de Software · Estagiário Full Stack"), local e o botão "Conectar", que leva ao LinkedIn real |
| **Experiência** | Lista com o logo da empresa (monograma próprio, se o logo real não puder ser usado), cargo, período, local e descrição; clicar abre os destaques (`highlights`) |
| **Formação** | PUC Minas, curso, período |
| **Competências** | Tecnologias agrupadas, com o número de projetos em que cada uma aparece (calculado dos dados de Projetos) |
| **Certificados e cursos** | Se o Daniel tiver (pergunta P11) |
| **Atividade** (opcional) | Prévia dos posts, como o próprio post de lançamento do portfólio |

**Navegação:** abas no topo, como no perfil, e foco visível. A TV é grande e larga (16:9), então o layout é o do LinkedIn no computador.

## 3. Celular = Contato e mais, inspirado no iPhone 17 / iOS 26

Hoje existe a tela inicial com relógio, um cartão com foto, os 4 ícones e o app E-mail. A ideia é virar um **celular de verdade**, onde se entra nos apps.

**Fluxo:**

1. **Tela bloqueada:** hora e data grandes, notificação "Nova mensagem do Daniel 👋". Deslizar para cima ou clicar desbloqueia.
2. **Tela inicial:** widgets e apps em grade, com o efeito de vidro (*Liquid Glass*) do iOS 26 feito em CSS.
3. **Apps** abrem com a animação de zoom saindo do ícone. Gesto ou botão para voltar à tela inicial.

**Apps propostos** (cada um usa dados que já existem ou são simples):

| App | O que faz |
|---|---|
| **E-mail** | O formulário de contato (já existe) |
| **Contatos** | O cartão do Daniel com botão para baixar o contato (`.vcf`) |
| **LinkedIn, GitHub, Instagram** | Uma prévia dentro do celular e o botão para abrir o perfil real |
| **Fotos** | Uma galeria pequena de fotos do Daniel escolhidas por ele (eventos, viagens, PUC). Precisa das fotos (pergunta P10) |
| **Música** | O que o Daniel ouve ou toca (liga com o lado DJ), com links para playlists |
| **Mapas** | Belo Horizonte, MG, num mapa desenhado por nós |
| **Ajustes** | Controla o próprio site: dia/noite, idioma e som. É uma forma divertida de mostrar as configurações |
| **Notas** | Um "sobre mim" curto, como se fosse uma nota |
| **Clima** (widget) | Tempo atual de BH pela API Open-Meteo (gratuita, sem chave), com o último valor salvo se falhar |

**Detalhes do iOS 26 que fazem diferença:** Dynamic Island com animação quando o e-mail é enviado; a barra de início em baixo; vibração simulada (leve tremida) no envio; ícones com o brilho de vidro.

**Decisão a rever:** em 07/10 ficou "sem dock". Um iPhone de verdade tem dock (pergunta P9).

**Continua valendo:** nenhum recurso da Apple (sem SF Pro, papéis de parede, ícones ou sons oficiais).

**No celular de verdade** (tela pequena), o aparelho ocupa a tela inteira como um "celular dentro do celular". A folha de baixo usa a mesma interface.

## 4. Ordem de construção

| Passo | Entrega | Esforço |
|---|---|---|
| 1 | Base comum: pilha de navegação por tela, URL acompanhando, teclado e Esc | M |
| 2 | Monitor no estilo GitHub (perfil, repositórios, página do projeto) | G |
| 3 | Dados do GitHub no build | M |
| 4 | TV com Experiências dentro dela, no estilo LinkedIn | G |
| 5 | Celular: tela bloqueada, tela inicial com widgets, apps (E-mail já existe) | G |
| 6 | Texturas de repouso das três telas iguais à primeira tela do HTML | M |
| 7 | Modo sem 3D e folha de baixo usando as novas interfaces | M |

Pode começar **antes do pipeline do Blender**: as telas são HTML e funcionam igual no quarto atual e no assado.
