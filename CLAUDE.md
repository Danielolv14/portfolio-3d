# Portfólio 3D — contexto para o Claude

Este arquivo é lido automaticamente pelo Claude Code. Ele reúne o que é preciso saber para continuar o projeto: o que é, como está montado, as decisões já tomadas e como verificar o trabalho.

## O projeto

- **Trabalho:** LAB01 – Portfólio Profissional (15 pontos, −1 ponto por dia de atraso), da disciplina DIAW (Desenvolvimento e Integração de Aplicações Web) do curso de Engenharia de Software da PUC Minas, com o prof. João Paulo Carneiro Aramuni.
- **Aluno:** Daniel Oliveira de Menezes, 4º período, GitHub `Danielolv14`.
- **Ideia:** o portfólio é uma recriação em 3D do quarto real do Daniel, montada a partir de fotos. Cada objeto do quarto abre uma seção, e a câmera "voa" até ele.
- **Referência visual:** [Room_Portfolio](https://github.com/AT010303/Room_Portfolio) ([site](https://at010303.vercel.app/)). Esse repositório **não tem licença** (todos os direitos reservados): só estudamos as técnicas e reimplementamos do nosso jeito. Nunca copie código, modelos, texturas, vídeos, músicas ou a ROM dele.
- **Repositório:** github.com/Danielolv14/portfolio-3d (branch `main`). Hospedagem prevista: Vercel.

### O que o enunciado pede

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

- React 18.3.1, Vite 5.4.10, three 0.164.1, @react-three/fiber 8.16.6, @react-three/drei 9.106.0, camera-controls 2.10.1, @react-three/postprocessing 2.16.3 com postprocessing 6.36.0, @emailjs/browser 4.4.1. Em desenvolvimento: playwright-core 1.61.1.
- Comandos: `npm install`, `npm run dev` (http://localhost:5173), `npm run build`, `npm run preview` (http://localhost:4173).
- EmailJS: copie `.env.example` para `.env.local` e preencha:
  - `VITE_EMAILJS_SERVICE_ID`
  - `VITE_EMAILJS_TEMPLATE_ID_FOR_ME`
  - `VITE_EMAILJS_TEMPLATE_ID_FOR_SENDER`
  - `VITE_EMAILJS_PUBLIC_KEY`
  
  Sem essas variáveis o formulário avisa que o envio não está configurado. A conta ainda não foi criada.
- O `vite.config.js` usa `server.watch.usePolling`, porque no PC do Daniel o projeto fica no OneDrive, que perde eventos de arquivo.

## Arquitetura

- **`src/App.jsx`:** guarda o estado global: `lang`, `night`, `focus` (seção aberta), `flat` (modo sem 3D), `mobile` (largura < 760) e `parked` (a câmera parou na tela).
  - Menu no topo no computador e abas embaixo no celular.
  - Seções abrem num painel lateral (computador) ou numa folha de baixo (celular).
  - Tema e idioma ficam salvos no `localStorage` (`portfolio-theme`, `portfolio-lang`). Um script inline no `index.html` aplica o tema antes da primeira pintura.
- **`src/Scene.jsx`:**
  - `Canvas` com `shadows="soft"`, `dpr` menor no celular e `<BakeShadows/>`.
  - `CameraRig`: um ponto de vista por seção em `SPOTS`, com `setFocalOffset` para o objeto não ficar atrás do painel. No **modo tela**, posiciona a câmera de frente para a malha `screen-<seção>` e avisa `onParked` quando para.
  - `Effects`: N8AO só no computador, Bloom com `luminanceThreshold` 1 (só o que passa de 1 brilha) e ToneMapping ACES.
  - Ganchos só em desenvolvimento: `window.__view([x,y,z], [alvo])` e `window.__stats()`.
- **`src/screens/`:** o conteúdo das seções aparece **dentro das telas 3D**, como uma camada HTML posta sobre a tela quando a câmera para.
  - `screens.js`: `SCREEN_OF` (projects → monitor, experience → tv, contact → phone), `SCREEN_COMPONENTS`, `hasScreen`, `findScreen`, `placeScreen`.
  - `ScreenTracker`: fica dentro do Canvas e projeta os cantos da malha a cada quadro.
  - `ScreenOverlay`: a camada HTML.
  - `MonitorScreen`: Projetos dentro do monitor.
  - Hoje só o monitor tem tela. TV (Experiências) e celular (Contato) ainda abrem no painel. O celular é a próxima etapa (E8, decisão 7).
- **`src/Sections.jsx`:**
  - `About`;
  - `Projects`: linha do tempo ordenada por data, vários links, selos "em equipe" e "repositório privado";
  - `Experience`: com `highlights`;
  - `Contact`: canais, formulário com validação, campo-isca anti-robô e EmailJS.
- **`src/content.js`:** todo o texto em PT e EN.
  - `PROJECTS` e `EXPERIENCES` guardam os dados uma vez só e passam por `localize`.
  - `profile` usa a foto `src/assets/foto.jpg`.
  - `channels`: e-mail, LinkedIn, GitHub e Instagram.
- **`src/styles.css`:** tokens de cor com as cores do quarto. De dia, madeira e bege; à noite, o rosa do RGB (`--accent: #ff6ad9`). `@property --bg` faz o fundo trocar junto com o 3D.
- **`src/room/`, o quarto:**
  - **`shared.jsx`:** `Box`, `Rounded`, `Cyl`, `Hotspot` (objeto clicável com etiqueta `<button>` e prop `active`), cores `C`, `dayNight.mix` (0 = dia, 1 = noite, animado com `damp`), `lerp` e `WALL_H`.
  - **`Lights.jsx`:** sol, janela, luminária "&", RGB, monitor, light bar e `Environment` com Lightformers (nada baixado).
  - **`Shell.jsx`:** piso de porcelanato, paredes, rodapé de granito, janela com persiana, porta e pôster do de_dust2. Exporta `Poster`.
  - **`Desk.jsx`:**
    - painel de carvalho, TV com light bar (Experiências);
    - mesa de nogueira com gaveteiro;
    - gabinete camuflado com LED magenta e monitor no braço (Projetos);
    - relógio LCD com a hora real, periféricos, cadeira cromada. Com Projetos aberto no monitor, a cadeira rola para o lado, porque a câmera para onde fica o encosto. Ela só volta quando a câmera se afasta do monitor.
  - **`Niche.jsx`:**
    - nicho branco com 4 níveis;
    - luminária "&" com lâmpadas (troca dia e noite), JBL, robô;
    - troféu, Stormtrooper, porta-retrato com a foto (Sobre mim);
    - pelúcias.
  - **`Bed.jsx`:**
    - cama com cabeceira de mogno, edredom matelassê, travesseiros, almofada, boné;
    - celular (Contato);
    - criado-mudo com luminária de cobre;
    - pôsteres minimalistas de filmes, tapete felpudo em camadas, bola de futevôlei.
  - **`Floor.jsx`:** mochila e tênis.
  - **Texturas:** `wallTextures.js` e `bedTextures.js`, mais o `src/textures.js` geral. Todas são desenhadas em canvas.
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

1. **O quarto segue as fotos do quarto real**, com as cores do quarto.
   - A paleta cinza foi descartada.
   - Os pôsteres são versões minimalistas próprias, porque as artes originais têm direitos autorais.
   - O globo saiu, porque não existe no quarto real.
2. **Conteúdo dentro das telas:** é uma **camada HTML sobre a tela 3D** quando a câmera para. Não usar `<Html transform>`. Monitor = Projetos, TV = Experiências, celular = Contato.
3. **Sobre mim** fica no painel lateral.
4. **No celular** as seções abrem na folha de baixo, e o modo tela vale só no computador (pelo menos 900×560) e fora do modo sem 3D.
5. **Iluminação:** é melhorada no navegador até 02/11. O bake no Blender fica para depois da apresentação.
6. **MinhaReceita** aparece sem link, porque o repositório da disciplina é privado. Os contatos não incluem o WhatsApp.
7. **Celular (Contato), decidido em 07/10:**
   - o celular é um iPhone 17 preto com a interface inspirada no iOS 26, sem nenhum recurso da Apple;
   - ele fica deitado na cama, e a câmera para olhando de cima;
   - a tela inicial tem relógio, um cartão com a foto, os ícones de LinkedIn, GitHub, Instagram e E-mail, e não tem dock;
   - o app E-mail é o formulário, no estilo do Mail;
   - no celular de verdade, a folha de baixo usa o mesmo visual.
   - A especificação completa está na seção 4 de `docs/planejamento/prompt-continuacao-nuvem.md`.

## Como verificar

- **Capturas:**
  ```bash
  node scripts/captura.mjs capturas/x.jpg [day|night] ["x,y,z da câmera" "x,y,z do alvo"] [--secao="Projetos"] [--celular]
  ```
  A pasta `capturas/` é ignorada pelo git.
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
- **Wireframes:**
  ```bash
  node scripts/wireframes.mjs
  ```
  Gera os SVG em `docs/wireframes/`, que dá para colar ou arrastar no Figma. Depois, para gerar os PNG do README:
  ```bash
  node scripts/wireframes-png.mjs
  ```
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
- **Objeto no caminho da câmera:** não esconda o objeto aumentando o plano `near`. A cadeira some de uma vez, aparece fatiada e o `near` fica preso ao ir para outra seção. Tire o objeto do caminho (veja a cadeira em `Desk.jsx`).
- **`Hotspot`:** anima o `scale` do próprio grupo. Um `scale` passado nele é sobrescrito, então escale um grupo interno.
- **Sombras:** com `BakeShadows`, a sombra é desenhada uma vez só. Qualquer animação que **mova** algo que projeta sombra precisa de `gl.shadowMap.needsUpdate = true` enquanto se move (há um exemplo no `Hotspot`). Mudar só cor ou intensidade não precisa disso.
- **Etiquetas:** o `<button>` dentro de `<Html>` precisa de `e.stopPropagation()` no `onClick`. Sem isso o clique sobe ao Canvas, que entende "clique fora" e fecha a seção que acabou de abrir.
- **Pós-processamento:** dentro do `EffectComposer` é preciso o efeito `<ToneMapping/>`, senão as cores ficam lavadas.
- **Escala:** o quarto tem cerca de 450 malhas. O que pesa no celular é a quantidade de draw calls (CPU), não os triângulos.
- **Node 18 no Windows:** importar por caminho absoluto exige `file:///C:/...`.
- **Agentes em paralelo:** cada agente edita só os próprios arquivos (por exemplo, parede, mesa e cama em arquivos separados), e um revisor confere no fim.

## Plano

O plano completo, com o estudo do Room_Portfolio e as etapas E1 a E13, está em [`docs/planejamento/plano-room-portfolio.md`](docs/planejamento/plano-room-portfolio.md).
