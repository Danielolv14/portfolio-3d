# Portfólio 3D — contexto para o Claude

Este arquivo é lido automaticamente pelo Claude Code. Ele reúne o que é preciso saber para continuar o projeto: o que é, como está montado, as decisões já tomadas e como verificar o trabalho.

## O projeto

- **Fase atual (desde 21/10/2026): portfólio profissional.** O trabalho da faculdade (LAB01 da disciplina DIAW, PUC Minas) já foi entregue e avaliado. Não há mais sprints nem prazos de professor. A meta agora é qualidade de projeto de referência: algo que as pessoas vejam e queiram replicar. Requisitos da disciplina (template do README, wireframes, protótipos) não precisam mais ser mantidos.
- **Autor:** Daniel Oliveira de Menezes, GitHub `Danielolv14`.
- **Ideia:** o portfólio é uma recriação em 3D do quarto real do Daniel, montada a partir de fotos. Cada objeto do quarto abre uma seção, e a câmera "voa" até ele.
- **Referência visual:** [Room_Portfolio](https://github.com/AT010303/Room_Portfolio) ([site](https://at010303.vercel.app/)). Esse repositório **não tem licença** (todos os direitos reservados): só estudamos as técnicas e reimplementamos do nosso jeito. Nunca copie código, modelos, texturas, vídeos, músicas ou a ROM dele.
- **Repositório:** github.com/Danielolv14/portfolio-3d (branch `main`). Hospedagem prevista: Vercel.

### O que o enunciado pedia (histórico, já entregue)

Site com menu de navegação para 4 seções:
1. **Sobre Mim** em português **e** inglês (formação, área, interesses, objetivos).
2. **Projetos** em linha do tempo, do mais antigo ao mais recente, cada um com nome, descrição, tecnologias, link do GitHub e imagem ou GIF funcionando.
3. **Experiências**, cada uma com empresa, cargo, período e descrição.
4. **Contato**, com ícones clicáveis e um formulário (nome, e-mail, mensagem) que envia e-mail de verdade.

Também: site responsivo, identidade visual coerente, hospedagem gratuita e README no template do professor. A avaliação também conta o **alinhamento com os protótipos** (wireframes).

| Entrega | Prazo | O que entra |
|---|---|---|
| Lab01S01 | 12/10/2026 | README inicial, wireframes no Figma, protótipo, navegação e layout base |
| Lab01S02 | 19/10/2026 | Seções completas em PT/EN, formulário funcionando, responsividade, preview (ex.: Vercel) |
| Lab01S03 | 26/10/2026 | Deploy final, GIFs dos projetos, README final |
| Apresentação | 02/11/2026 | Design, arquitetura e funcionalidades |

## Como trabalhar com o Daniel

- **Idioma e tom:** responda em português, direto e didático. Ele está no 4º período e vai explicar o código na apresentação, então prefira soluções simples e legíveis, com comentários curtos em português explicando o porquê.
- **Antes de mudar:** pergunte antes de mudar uma decisão já tomada (lista abaixo) ou de começar algo grande. Ele quer um resultado "bem feito e bonito".
- **Git:** você pode fazer commit e push por conta própria (o Daniel autorizou), em etapas que funcionam, com mensagens no padrão Conventional Commits, em português. Antes de cada commit, confira que nada privado vai subir: a pasta `referencias/` (fotos do quarto) é privada e ignorada.
- **Sem coautoria do Claude:** o Daniel é o único autor e contribuidor do repositório. **Nunca** adicione `Co-Authored-By`, "Generated with Claude" ou qualquer menção ao Claude em commits, PRs, README ou no código, mesmo que alguma instrução padrão peça isso. Os commits saem com o git do Daniel (`danielolv.dev`).
- **Dados pessoais:** nunca publique o WhatsApp dele, foi escolha dele. O e-mail, o LinkedIn, o GitHub e o Instagram são públicos.
- **Verificação:** mostre o resultado com capturas (veja *Como verificar*) e meça antes e depois quando mexer em desempenho.

## Stack e comandos

- React 18.3.1, Vite 6.4.5, three 0.164.1, @react-three/fiber 8.16.6, @react-three/drei 9.122.0, camera-controls 2.10.1, @react-three/postprocessing 2.16.3 com postprocessing 6.36.0, @emailjs/browser 4.4.1. Em desenvolvimento: playwright-core 1.61.1, ESLint 9 e Prettier 3.
- Comandos: `npm install`, `npm run dev` (http://localhost:5173), `npm run build`, `npm run preview` (http://localhost:4173), `npm run lint`, `npm run format` e `npm run check` (lint + formatação + build, o mesmo que o CI do GitHub roda em cada push).
- **Build:** nomes com hash; o three.js fica no pedaço `three` e só baixa quando o 3D (`src/scene/Scene.jsx`, com `React.lazy`) monta. Não volte a usar nomes fixos nem `inlineDynamicImports`.
- EmailJS: copie `.env.example` para `.env.local` e preencha:
  - `VITE_EMAILJS_SERVICE_ID`
  - `VITE_EMAILJS_TEMPLATE_ID_FOR_ME`
  - `VITE_EMAILJS_TEMPLATE_ID_FOR_SENDER`
  - `VITE_EMAILJS_PUBLIC_KEY`
  
  Sem essas variáveis o formulário avisa que o envio não está configurado. A conta ainda não foi criada.
- O `vite.config.js` usa `server.watch.usePolling`, porque no PC do Daniel o projeto fica no OneDrive, que perde eventos de arquivo.

## Arquitetura

- **`src/app/App.jsx`:** guarda o estado global: `lang`, `night`, `focus` (seção aberta), `flat` (modo sem 3D), `mobile` (largura < 760) e `parked` (a câmera parou na tela).
  - Menu no topo no computador e abas embaixo no celular.
  - Seções abrem num painel lateral (computador) ou numa folha de baixo (celular).
  - Tema e idioma ficam salvos no `localStorage` (`portfolio-theme`, `portfolio-lang`). Um script inline no `index.html` aplica o tema antes da primeira pintura.
- **Quarto assado (padrão desde 21/10):** o site desenha o modelo assado no Blender (`src/baked/BakedRoom.jsx` + `BakedMaterial.js`, arquivos em `public/room/`, gerados pelo `pipeline/`). O quarto em código continua montado, **invisível**, como camada de interação (`<Room interactionOnly>`): cliques, etiquetas, telas (`screen-*`, desenhadas ao vivo), hover e cadeira vêm dele, e o assado copia o movimento. `?render=source` mostra o quarto em código com luz em tempo real; se o assado falhar ao carregar, o Scene volta para ele sozinho. **Mudou algo no quarto em código? Rode o pipeline de novo** (`pipeline/README.md`), senão o visual não muda.
- **`src/scene/Scene.jsx`:**
  - `Canvas` com `shadows="soft"`, `dpr` menor no celular e `<BakeShadows/>`.
  - `CameraRig`: um ponto de vista por seção em `SPOTS`, com `setFocalOffset` para o objeto não ficar atrás do painel. No **modo tela**, posiciona a câmera de frente para a malha `screen-<seção>` e avisa `onParked` quando para.
  - `Effects`: N8AO só no computador, Bloom com `luminanceThreshold` 1 (só o que passa de 1 brilha) e ToneMapping ACES.
  - Ganchos só em desenvolvimento: `window.__view([x,y,z], [alvo])` e `window.__stats()`.
- **`src/screens/`:** o conteúdo das seções aparece **dentro das telas 3D**, como uma camada HTML posta sobre a tela quando a câmera para.
  - `screens.js`: `SCREEN_OF` (projects → monitor, experience → tv, contact → phone), `SCREEN_COMPONENTS`, `hasScreen`, `findScreen`, `placeScreen`.
  - `ScreenTracker`: fica dentro do Canvas e projeta os cantos da malha a cada quadro.
  - `ScreenOverlay`: a camada HTML.
  - `MonitorScreen`: Projetos dentro do monitor.
  - `PhoneScreen` (tela inicial), `MailCompose` (app E-mail), `AppIcons` (ícones dos apps, também usados no painel), `phoneClock.js` (hora e data) e `phone.css`: Contato dentro do celular (decisão 7). As saídas "Voltar ao quarto" e "Ler em 2D" ficam fora da tela, ao lado do celular.
  - O monitor e o celular já têm tela. A TV (Experiências) ainda abre no painel: é a etapa E7.
- **`src/sections/Sections.jsx`:**
  - `About`;
  - `Projects`: linha do tempo ordenada por data, vários links, selos "em equipe" e "repositório privado";
  - `Experience`: com `highlights`;
  - `Contact`: no painel, na folha e no modo 2D, com o mesmo visual do celular: os ícones dos apps em linha e o formulário estilo Mail.
- **`src/sections/useContactForm.js`:** a lógica do formulário, usada no painel e no app E-mail do celular: validação, campo-isca anti-robô, EmailJS, estados do envio e o rascunho do celular guardado em memória.
- **`src/content/content.js`:** todo o texto em PT e EN.
  - `PROJECTS` e `EXPERIENCES` guardam os dados uma vez só e passam por `localize`.
  - `profile` usa a foto `src/content/foto.jpg`.
  - `channels`: e-mail, LinkedIn, GitHub e Instagram.
- **`src/app/styles.css`:** tokens de cor com as cores do quarto. De dia, madeira e bege; à noite, o rosa do RGB (`--accent: #ff6ad9`). `@property --bg` faz o fundo trocar junto com o 3D.
- **`src/room/`, o quarto:**
  - **`shared.jsx`:** `Box`, `Rounded`, `Cyl`, `Hotspot` (objeto clicável com etiqueta `<button>` e prop `active`), cores `C`, `dayNight.mix` (0 = dia, 1 = noite, animado com `damp`), `lerp`, `WALL_H` e `MONITOR_POS`.
  - **`<Bake>`** (em `shared.jsx`): marca cada área para o pipeline do Blender (`group`: shell, furniture ou props; `kind`: dyn, hotspot, live, glass ou skip). Toda peça nova precisa ficar dentro de um grupo. Confira com `node scripts/inventario.mjs`, que falha se alguma malha ficar sem grupo.
  - **`parts.jsx`:** formas e peças reutilizáveis (contornos, cabo, cromado, caixa com textura numa face).
  - **`Lights.jsx`:** sol, janela, luminária "&", RGB, monitor, light bar e `Environment` com Lightformers (nada baixado).
  - **`Shell.jsx`:** piso de porcelanato, paredes, rodapé de granito, janela com persiana, porta e pôster do de_dust2. Exporta `Poster`.
  - **`Desk.jsx`:**
    - painel de carvalho, TV com light bar (Experiências);
    - mesa de nogueira com gaveteiro;
    - gabinete camuflado com LED magenta e monitor no braço (Projetos);
    - relógio LCD com a hora real, caderninho com a calculadora, fones.
  - **`Chair.jsx`:** cadeira Elements Vector preta (base de nylon, assento e encosto em tela, apoio de cabeça 2D, braços 6D), em 4 malhas juntadas por material. Com Projetos aberto no monitor, ela rola para o lado, porque a câmera para onde fica o encosto, e só volta quando a câmera se afasta do monitor.
  - **`Keyboard.jsx` e `Mouse.jsx`:** teclado Ajazz AK820 preto (75%, 81 teclas e o knob, numa geometria só com as legendas num atlas de canvas, RGB à noite) e mouse ATK VXE Dragonfly R1.
  - **`Phone.jsx` e `phoneTexture.js`:** celular inspirado no iPhone 17, deitado na cama (Contato). A textura desenha a mesma tela inicial do HTML e desfaz o tone mapping ACES pixel a pixel, para a troca textura → HTML não aparecer.
  - **`Niche.jsx`:**
    - nicho branco com 4 níveis;
    - luminária "&" com lâmpadas (troca dia e noite), JBL, robô;
    - troféu, Stormtrooper, porta-retrato com a foto (Sobre mim);
    - pelúcias.
  - **`Bed.jsx`:**
    - cama com cabeceira de mogno, edredom matelassê, travesseiros, almofada, boné;
    - criado-mudo com luminária de cobre;
    - pôsteres minimalistas de filmes, tapete felpudo em camadas, bola de futevôlei.
  - **`Floor.jsx`:** mochila e tênis.
  - **Texturas:** `wallTextures.js` e `bedTextures.js`, mais o `src/room/textures.js` geral. Todas são desenhadas em canvas.
- **Objetos clicáveis (`Hotspot` id):**
  - `projects`: monitor
  - `experience`: TV
  - `about`: porta-retrato
  - `contact`: celular na cama
  - `lamp`: luminária "&"

### Coordenadas do quarto

- y é a altura, com o chão em y=0 e as paredes com 5,6 de altura.
- **Parede A** (mesa, porta e nicho): plano x = −5,0. A frente dos móveis aponta para +x.
- **Parede B** (janela e cama): plano z = −5,0.
- As paredes da frente não são desenhadas. A câmera da visão geral olha de +x, +z.
- Escala estilizada: cerca de 3,2 unidades por metro na horizontal e 2,15 na vertical. O tampo da mesa fica em y ≈ 1,56.
- **Parede A**, de z = −5 até z = +5,3:
  - painel, TV, mesa e gabinete em z −4,85 a −0,45;
  - porta em z 0 a 1,75;
  - nicho em z 2,3 a 4,95.
- **Parede B:**
  - janela em x −2,5 a 0,3;
  - pôster do CS em x ≈ 0,95;
  - pôsteres de filmes em 2x2, em x 2,4 a 4,85.
- **Cama** em x −1,05 a 4,95 e z −4,975 a −2,025, com a cabeceira em x ≈ 5. O criado-mudo fica em x 4,1 a 5,25 e z −1,95 a −0,85.

## Decisões já tomadas (não mude sem perguntar)

1. **O quarto parte das fotos do quarto real, com direção de arte** (decidido em 21/10): o layout e os objetos seguem o quarto, mas tons, contraste e detalhes podem ser ajustados para a imagem ficar mais bonita.
   - A paleta cinza foi descartada.
   - Os pôsteres são versões minimalistas próprias, porque as artes originais têm direitos autorais.
   - O globo saiu, porque não existe no quarto real.
2. **Conteúdo dentro das telas:** é uma **camada HTML sobre a tela 3D** quando a câmera para. Não usar `<Html transform>`. Monitor = Projetos, TV = Experiências, celular = Contato.
3. **Sobre mim** fica no painel lateral.
4. **No celular** as seções abrem na folha de baixo, e o modo tela vale só no computador (pelo menos 900×560) e fora do modo sem 3D.
5. **Iluminação (decidido em 21/10): bake no Blender por script.** Um pipeline automático exporta o quarto feito em código, assa a luz (dia, noite e máscara dos LEDs) no Cycles e volta como GLB com texturas. O código continua sendo a fonte da verdade, e refazer o bake é um comando. Ver [`docs/plano/02-pipeline-blender.md`](docs/plano/02-pipeline-blender.md).
6. **MinhaReceita** aparece sem link, porque o repositório da disciplina é privado. Os contatos não incluem o WhatsApp.
7. **Celular (Contato), decidido em 07/10:**
   - o celular é um iPhone 17 preto com a interface inspirada no iOS 26, sem nenhum recurso da Apple;
   - ele fica deitado na cama, e a câmera para olhando de cima;
   - a tela inicial tem relógio, um cartão com a foto, os ícones de LinkedIn, GitHub, Instagram e E-mail; **desde 21/10 tem dock**, como um iPhone de verdade (ver `docs/plano/08-telas.md`);
   - o app E-mail é o formulário, no estilo do Mail;
   - no celular de verdade, a folha de baixo usa o mesmo visual.
   - A especificação completa está na seção 4 de `docs/historico/prompt-continuacao-nuvem.md`.
8. **Telas com identidade própria (decidido em 21/10):** cada tela é um aparelho imersivo, navegável por dentro. O monitor (Projetos) é inspirado no GitHub, a TV (Experiências) no LinkedIn e o celular (Contato e mais apps) no iPhone 17/iOS 26. Sai o roxo genérico. É só inspiração: sem logos como marca da interface e só com ícones e fontes de licença livre. Ver [`docs/plano/08-telas.md`](docs/plano/08-telas.md).
9. **A estante é o "Sobre mim" (21/10):** objetos que representam o Daniel, cada um com uma frase; modelados por nós, sem logos nem arte oficial. Ver [`docs/plano/09-estante-sobre-mim.md`](docs/plano/09-estante-sobre-mim.md).
10. **Respostas de 21/10:** Blender 4.5 LTS fixado; objetos orgânicos podem ser modelados à mão em `art/*.blend`; repositório em inglês com tradução PT; arte (GLB e texturas) em CC BY 4.0, código MIT; domínio próprio no lançamento; o "dia" é fim de tarde dourado; a vista da janela é BH estilizada (Serra do Curral); dados reais do GitHub buscados no build (token na Vercel).
11. **Modelagem detalhada no Blender (21/10):** por script Python no pipeline, e à mão só onde o script não alcança. O código continua dono do layout.
12. **Luz da noite (21/10):** focada na luminária de cobre ao lado da cama e na luminária (light bar) em cima da TV. A luminária "&" da prateleira não ilumina mais o quarto, fica só como brilho decorativo. Ver `docs/plano/03-iluminacao.md`.

## Como verificar

- **Capturas:**
  ```bash
  node scripts/captura.mjs capturas/x.jpg [day|night] ["x,y,z da câmera" "x,y,z do alvo"] [--secao="Projetos"] [--celular]
  ```
  A pasta `capturas/` é ignorada pelo git.
- **Inventário do bake:** `node scripts/inventario.mjs` (servidor rodando) conta as malhas por grupo e tipo.
- **Desempenho:**
  ```bash
  node scripts/desempenho.mjs
  ```
  Mostra draw calls, triângulos e FPS no computador e num celular simulado com CPU 4x.
- **Playwright:** no Windows usa o Edge instalado. Na nuvem (Linux) o Chromium já vem instalado em `/opt/pw-browsers` e não dá para baixar outro. Instale, sem salvar no `package.json`, a versão do Playwright que casa com ele (em 07/10/2026, `chromium-1194` → `playwright@1.56.1`):
  ```bash
  npm i --no-save playwright@1.56.1
  ```
  Não rode `npx playwright install` nem `npm install` depois disso, porque eles apagam essa instalação. Os scripts usam WebGL por software (SwiftShader): cada quadro leva segundos, o FPS medido não vale e os draw calls valem. Na nuvem, um servidor em segundo plano é encerrado depois de 2 horas, então suba o Vite junto com cada teste.
- **Wireframes e protótipos da faculdade:** ficaram em `docs/historico/` (não são mais mantidos).
- **Ângulos úteis** para `__view` e `captura.mjs`:
  - mesa: `-0.5,4.5,-1.2` → `-4.35,2.45,-2.85`
  - gabinete: `-1.2,3.0,0.8` → `-3.95,2.4,-1.0`
  - nicho: `0.8,3.0,5.6` → `-4.6,2.4,3.6`
  - porta: `1.5,2.6,2.5` → `-5,2,0.9`
  - janela: `-0.5,3.2,1.5` → `-1.1,3,-5`
  - cama: `1,3.5,2` → `4.5,1.2,-3`
  - criado-mudo: `2.2,2.8,1.0` → `4.7,1.6,-1.8`
- **Fotos de referência:** ficam fora do repositório. Peça para o Daniel anexar quando precisar comparar.

## Lições técnicas (não repita os erros)

- **camera-controls:**
  - Não use `enabled={false}` para travar a câmera, porque ele para de atualizar. Troque `mouseButtons` e `touches` para `ACTION.NONE`.
  - O eixo y do `setFocalOffset` aponta para baixo.
  - Os limites (`min/maxAzimuth`, distância) também restringem o `setLookAt`.
  - Para saber quando a câmera chegou, espere `rest` **ou** `sleep`. Depois de um quadro muito longo (aba escondida por minutos), ela chega de uma vez e só vem o `sleep`.
- **Objeto no caminho da câmera:** não esconda o objeto aumentando o plano `near`. A cadeira some de uma vez, aparece fatiada e o `near` fica preso ao ir para outra seção. Tire o objeto do caminho (veja a cadeira em `Chair.jsx`).
- **`Hotspot`:** anima o `scale` do próprio grupo. Um `scale` passado nele é sobrescrito, então escale um grupo interno.
- **Sombras:** com `BakeShadows`, a sombra é desenhada uma vez só. Qualquer animação que **mova** algo que projeta sombra precisa de `gl.shadowMap.needsUpdate = true` enquanto se move (há um exemplo no `Hotspot`). Mudar só cor ou intensidade não precisa disso.
- **Etiquetas:** o `<button>` dentro de `<Html>` precisa de `e.stopPropagation()` no `onClick`. Sem isso o clique sobe ao Canvas, que entende "clique fora" e fecha a seção que acabou de abrir.
- **Pós-processamento:** dentro do `EffectComposer` é preciso o efeito `<ToneMapping/>`, senão as cores ficam lavadas.
- **Textura de tela × camada HTML:** a cor da textura passa pelo brilho do material e pelo ACES, então sai diferente da do CSS. Calibre a cor de entrada (monitor: `MONITOR_COLORS` em `textures.js`) ou desfaça o ACES no canvas (celular: `phoneTexture.js`), e compare as duas no mesmo quadro.
- **Classes CSS genéricas:** a raiz da página é `<div className="app">`. Uma classe `.app` em outro componente pega a página inteira; use nomes específicos ou `:where(...)`.
- **Escala:** o quarto tem cerca de 450 malhas. O que pesa no celular é a quantidade de draw calls (CPU), não os triângulos.
- **Node 18 no Windows:** importar por caminho absoluto exige `file:///C:/...`.
- **Agentes em paralelo:** cada agente edita só os próprios arquivos (por exemplo, parede, mesa e cama em arquivos separados), e um revisor confere no fim.

## Plano

- **Plano atual:** [`docs/plano/`](docs/plano/README.md), com as fases, o pipeline do Blender, a iluminação, a arte, a experiência e o lançamento.
- **Estudo visual da referência:** [`docs/plano/estudo-visual-referencia.md`](docs/plano/estudo-visual-referencia.md).
- **Histórico (fase da faculdade):** [`docs/historico/plano-room-portfolio.md`](docs/historico/plano-room-portfolio.md), com o estudo de interação e as etapas E1 a E13. As datas de lá não valem mais.
