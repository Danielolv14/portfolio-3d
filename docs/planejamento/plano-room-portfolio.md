# Síntese e plano: levar o nosso quarto ao nível do Room_Portfolio

Escala de esforço: **P** até meio dia · **M** de 1 a 2 dias · **G** 3 dias ou mais. Hoje é 06/10. Prazos: S01 em 12/10, S02 em 19/10, S03 em 26/10 e apresentação em 02/11.

**Licença.** A referência não tem licença. Tudo abaixo é reimplementação nossa: nenhum código, modelo, textura, vídeo, música ou ROM dela entra no projeto. Números como `fov 35` ou `smoothTime 0.8` são parâmetros de bibliotecas e servem só como ponto de partida.

---

## 1. O que faz a referência ser tão boa

1. **O conteúdo fica dentro do objeto.**
   - Ao clicar no monitor, a câmera vai até ele e o site aparece na tela, em perspectiva e com rolagem de verdade (`desktopiFrame.jsx`: `<Html transform occlude="blending">`, 1511×852 px, `distanceFactor 0.52`).
   - O celular mostra o mesmo site num iframe de 392×809, e as media queries do site interno entregam o layout de celular.
   - A história é "abra o meu computador".
2. **A luz já vem pronta do Blender.**
   - Dia, noite e uma máscara RGB dos LEDs foram assados num atlas 4096². Um shader com 3 leituras de textura mistura tudo (`fragment.glsl`).
   - Resultado: sombras suaves e cantos escurecidos com 0 luzes, 44 draw calls e 518 mil triângulos. O nosso tem 848 draw calls e 8 luzes.
3. **O brilho aparece só onde importa.** O Bloom só pega o que passa de 1:
   - a janela usa `toneMapped={false}` com cor `[2,0.8,0.5]` de dia e `[0.6,0.8,3]` à noite;
   - as telas têm vídeo;
   - os LEDs têm força entre 1,2 e 1,55, que estoura o `blendLighten`.
4. **Parece uma maquete sobre fundo escuro.** O interior é quente (laranja, rosa, vermelho) sobre um gradiente roxo `#1f1635 → #100a1d`, com `fov 35` e bastante espaço vazio em volta. O quarto se destaca do fundo nos dois temas.
5. **A câmera se enquadra sozinha.**
   - Cada objeto tem uma posição de câmera com o ângulo travado (mínimo igual ao máximo, no azimute e no polar) e um zoom limitado a ±10–20%. A tela fica sempre de frente.
   - A aproximação inicial vem de brinde: o `CameraManager` só monta depois do Suspense.
6. **Os objetos respondem.** Há contorno branco no hover (`Outline`), cursor de mão, um interruptor físico com mola (`mass 4, tension 800, friction 35`) e 1 s de transição entre dia e noite.
7. **O quarto "funciona".** O relógio de ponteiros mostra a hora real, a cadeira gira devagar, o laptop toca música, a TV roda um jogo e o quadro de polaroids serve de menu. Cada objeto tem uma pequena função.

## 2. Onde já estamos à frente

- **Conteúdo próprio no mesmo app.**
  - As seções são componentes React (`Sections.jsx`) com PT/EN (`content.js`).
  - Não há segundo deploy nem iframe. O texto é indexável e não depende de outro site no ar.
- **Acessibilidade.**
  - As etiquetas dos objetos são `<button>` de verdade (`room/shared.jsx` L98–110).
  - Menu no topo e tabbar no celular, ambos com `aria-current`.
  - Esc fecha a seção (`App.jsx` L89–95) e o foco vai para o título da seção aberta (L85–87).
  - Há suporte a `prefers-reduced-motion` (`Scene.jsx` L114).
- **Modo sem 3D** (`App.jsx` L215–227). Liga sozinho quando o navegador não tem WebGL (`hasWebGL`, L13–20). A referência não tem alternativa.
- **Celular.**
  - A distância e a direção da câmera se adaptam à proporção da tela (`Scene.jsx` L69–70).
  - O `setFocalOffset` compensa o espaço do painel (L83–88).
  - Na referência, o monitor sai do quadro no retrato e o alvo de toque do celular tem uns 15 px.
- **Tema com uma única fonte da verdade.** O estado `night` alimenta tanto o CSS (`data-mode`) quanto o 3D (`dayNight.mix` com `damp`, `room/Lights.jsx` L32). O tema começa pelo `prefers-color-scheme` e a luminária "&" já funciona como interruptor (`room/Niche.jsx` L182–216).
- **Peso.**
  - O nosso fica pronto com 1,55 MB em 9 requisições.
  - A referência baixa 6,4 MB para ficar pronta e chega a 12,2 MB 3 s depois.
  - As nossas texturas são geradas em canvas. Não há mp3, vídeo nem ROM.
- **Quarto feito a partir das fotos** (`referencias/*.webp`) **e construído em código.** Mudar uma peça é editar JSX, sem refazer bake.
- **Contato funcionando.** O formulário envia de verdade por EmailJS, com validação e campo anti-robô. A referência não tem contato.
- **Direitos.** Não usamos nada de terceiros, e o projeto é MIT.
- **Qualidade do código.**
  - As posições de câmera são dados (`SPOTS`, `Scene.jsx` L13–18), tratados num único efeito com as dependências corretas.
  - O cursor é centralizado com `useCursor`.

**Onde ainda perdemos:**
- No celular com CPU 4x rodamos a 25–28 fps, por causa dos 848 draw calls.
- As telas parecem apagadas.
- De dia, o fundo bege se confunde com as paredes.
- Quase nada se mexe.
- O conteúdo abre num painel, não no objeto.

## 3. Plano de adoção (priorizado)

O que **não** trazer da referência: iframe de outro site, painel Leva em produção, áudio baixado logo na abertura, ROM, músicas ou interface imitando o Spotify, e a falta de um botão de voltar.

| # | Item | Esforço | Risco | Quando |
|---|---|---|---|---|
| 1 | Seções dentro das telas (a) | G (cerca de 5 dias, em 7 partes) | Médio | Monitor na S02; TV e celular na S03 |
| 2 | Desempenho e luz no navegador (f) | P a M | Baixo | Ganhos rápidos já; o resto até 28/10 |
| 3 | Abertura e carregamento (b) | M | Baixo | S03 |
| 4 | Destaque no hover e resposta ao clique (d) | M | Médio | S03 |
| 5 | Troca de tema mais rica (c) | P/M | Baixo | S02 e S03 |
| 6 | Sons opcionais (e) | M | Baixo | S03 |
| 7 | Seção na URL e botão Voltar do navegador | P | Baixo | S03 |
| 8 | Detalhes animados | P cada | Baixo | Se sobrar tempo |
| 9 | Bake no Blender (f) | G | Alto | Depois de 02/11 |

### 1. Seções dentro das telas: monitor = Projetos, TV = Experiências, celular = Contato

**Técnica proposta: camada HTML posicionada sobre a tela.**

Em vez do `<Html transform>` que a referência usa, o próprio App desenha a seção numa camada HTML comum. Ela fica exatamente sobre o retângulo que a tela 3D ocupa quando a câmera para de frente para ela. Parado, o resultado é igual ao da referência, com estas vantagens:

- **Nitidez.** O texto fica em escala 1 (1 px CSS = 1 px), e o zoom do navegador funciona.
- **Eventos isolados.** A camada fica fora da div do Canvas, então clique, roda do mouse e toque não chegam ao R3F nem ao camera-controls. Não é preciso `stopPropagation` em tudo, e o `onPointerMissed` não fecha a tela por engano.
- **Mesma árvore React do App.** `t`, `lang` e o rascunho do formulário continuam acessíveis, sem o `createRoot` separado que o drei cria.
- **Sem transformação 3D no HTML.** Evita os bugs de Safari e iOS com inputs, e não depende do canal alfa sobreviver ao pós-processamento.
- **Não briga com as etiquetas.** No drei, todo `<Html>` sem `occlude="blending"` desfaz o `z-index`, o `position` e o `pointer-events` que o modo blending coloca no canvas (`node_modules/@react-three/drei/web/Html.js` L129–139). As nossas etiquetas são `<Html>`, então as duas coisas brigariam.

O que se perde:
- Durante o voo da câmera, a tela mostra a textura de canvas. O HTML entra com fade quando a câmera para.
- Com a câmera parada não há paralaxe, porque a câmera continua sem responder ao mouse, como hoje.

**1.1 Câmera parada de frente para a tela (M)**

- **O que fazer:**
  1. Dar nome às malhas das telas: `name="screen-projects"` (`room/Desk.jsx` L243), `"screen-experience"` (L279) e `"screen-contact"` (`room/Bed.jsx` L282).
  2. No `CameraRig` (`Scene.jsx` L56–120), quando o modo tela estiver ligado, montar a posição da câmera a partir da própria malha:
     - centro com `getWorldPosition`;
     - normal = eixo +z do plano no mundo;
     - largura e altura com `geometry.parameters`.
  3. Calcular a distância para a tela ocupar uma fração `f` da área útil:
     - `k = 2·tan(fov/2)`, que dá 0,6306 com fov 35;
     - `d = (H/(k·f)) · max(h/H_útil, w/W)`;
     - `f` = 0,88 no monitor, 0,86 na TV e 0,90 no celular.
  4. Centralizar abaixo da topbar com `setFocalOffset(0, -(TOPBAR/2)·k·d/H, 0)`. É a mesma convenção da L88, com o sinal invertido.
  5. No celular, afastar a câmera 0,03·d na direção da base do aparelho, para não olhar exatamente de cima.
  6. Chamar `setLookAt(...).then(() => token === tokenRef.current && onParked(focus))`. A promise resolve no evento `rest` (`camera-controls.module.js` L1427), e o token descarta voos interrompidos.
  7. O `Hotspot` (`room/shared.jsx` L67) ganha a prop `active`: escala alvo 1 e `useCursor(hover && !active)`. Sem isso, a tela pode ficar presa na escala 1,04 e o HTML desalinha.
- **Por quê:** o HTML só encaixa se a tela estiver de frente e parada.
- **Arquivos:** `Scene.jsx`, `room/shared.jsx`, `room/Desk.jsx`, `room/Bed.jsx`.
- **Risco: médio.** A câmera pode atravessar a cadeira ou a barra de luz da TV. Conferir com `window.__view`:
  - monitor: `[-2.09,2.48,-2.85]` → `[-4.343,2.48,-2.85]`
  - TV: `[-2.43,4.16,-2.8]` → `[-4.757,4.158,-2.8]`
  - celular: `[2.563,2.14,-2.723]` → `[2.55,1.092,-2.75]`
- **Pronto quando:**
  - em 1280×800, 1440×900 e 1920×1080, a tela ocupa 85–90% da largura ou da altura útil, centralizada e sem nada na frente;
  - `onParked` dispara uma vez por voo;
  - clicando rápido em monitor → TV → celular, a câmera termina parada no último.

**1.2 Camada da tela e acompanhamento da posição (M)**

- **O que fazer:**
  - Criar `src/screens/ScreenOverlay.jsx` com `<section className="screen screen--{kind}" role="dialog" aria-labelledby>`.
    - Fica dentro de `.stage`, ao lado do Canvas.
    - CSS: `position:absolute; left:0; top:0; z-index:22`. Assim fica acima das etiquetas (z até 20) e abaixo do `.panel` (25) e da topbar (30).
  - Dentro do Canvas, criar `ScreenTracker({ id, elRef })`. Enquanto a tela está aberta, a cada quadro ele:
    - projeta os 4 cantos do plano (`v.applyMatrix4(mesh.matrixWorld).project(camera)`, convertido para px);
    - escreve `transform: translate(x,y)` direto no elemento, sem re-render;
    - só muda largura e altura quando a variação passa de 0,5 px.
  - A camada só aparece quando `parked === focus`. Zerar `parked` no mesmo `setState` que muda `focus`. Senão, ao reabrir a mesma seção, a tela aparece antes de a câmera chegar.
  - **Entrada da tela:** `clip-path: inset(50% 0 50% 0)` → `inset(0)` com opacidade, em 180 ms. Com reduced-motion, sem animação.
  - **Aparência:** `border-radius` igual ao canto da tela 3D e uma sombra interna leve, para parecer vidro.
  - **Formas de sair:**
    - Esc (já existe);
    - botão de fechar real na barra da janela;
    - clique fora (já existe via `onPointerMissed`);
    - um botão fixo "Voltar ao quarto" no canto da tela.
  - **Foco:**
    - Quando a câmera para, o título (`tabIndex=-1`) recebe o foco.
    - Ao fechar, o foco volta para quem abriu. Guardar `document.activeElement` no momento do `setFocus`.
  - **CSS:**
    - `container-type: size` e `user-select: text`;
    - `.screen-scroll { overflow-y:auto; overscroll-behavior:contain; scrollbar-gutter:stable }`;
    - tamanhos de fonte com `clamp(…, cqw, …)`.
- **Arquivos:** `src/screens/ScreenOverlay.jsx` (novo), `Scene.jsx`, `App.jsx`, `styles.css`.
- **Risco: médio-baixo.** Pode haver 1–2 px de desalinhamento nas bordas. No redimensionamento da janela, o efeito da câmera já depende de `aspect` e o tracker acompanha.
- **Pronto quando:**
  - um retângulo de depuração cobre a tela 3D com erro de no máximo 2 px, em 3 tamanhos e com zoom de 125% e 150%;
  - rolar dentro da tela não mexe a câmera;
  - clicar num link não fecha a tela.

**1.3 Monitor = Projetos (M)**

- **O que fazer:**
  - Criar `src/screens/MonitorScreen.jsx`: uma "janela" com barra de título `~/projetos`, botões decorativos com `aria-hidden`, botão de fechar real e `<Projects t={t}/>`.
  - Com `@container (min-width: 900px)`, o cartão de cada projeto passa a ter 2 colunas (mídia ao lado do texto). Os GIFs da S03 vão rodar dentro do monitor.
  - Botão "Ler em 2D", que abre a seção no modo sem 3D.
- **Por quê:** é o pedido principal e o momento mais forte da apresentação.
- **Arquivos:** `src/screens/MonitorScreen.jsx`, `content.js` (`ui.backToRoom`, `ui.read2d`, título da janela), `styles.css`.
- **Risco: baixo**, porque o componente da seção já existe.
- **Pronto quando:**
  - o texto fica legível de 1280 a 2560 px;
  - os links abrem em outra aba sem fechar a tela;
  - o Tab percorre o conteúdo da tela;
  - Esc fecha e devolve o foco a quem abriu.

**1.4 TV = Experiências (P)**

- **O que fazer:** criar `TvScreen.jsx`, com visual de "canal", letra maior (`clamp(16px, 1.6cqw, 28px)`) e `<Experience t={t}/>`.
  - Hoje só há 1 experiência (Teknisa). Ela vira destaque único: cargo em letra grande, período, pontos principais em 2 colunas e as tecnologias.
  - Sem carrossel até existirem mais itens.
- **Arquivos:** `src/screens/TvScreen.jsx`, `styles.css`.
- **Pronto quando:** dá para ler numa simulação de projetor em 1280×720 e não aparece barra de rolagem em 1440×900.

**1.5 Celular = Contato (M)**

- **O que fazer:**
  - Criar `PhoneScreen.jsx` com:
    - barra de status com a hora real, atualizada a cada minuto;
    - os canais como "apps", 4 ícones grandes (os botões já têm `aria-label`);
    - o formulário abaixo, com `<Contact t={t} lang={lang} idPrefix="screen"/>`;
    - a barrinha de baixo servindo de botão de fechar.
  - Inputs com `font-size` de pelo menos 16px.
  - Levar o estado `values` do Contact para o App, para o rascunho não se perder ao fechar com Esc.
- **Arquivos:** `src/screens/PhoneScreen.jsx`, `Sections.jsx`, `App.jsx`, `styles.css`.
- **Risco: médio.** Em 1280×800 a tela tem uns 300 px de largura, então o formulário precisa caber com rolagem.
- **Pronto quando:**
  - o envio real pelo EmailJS funciona de dentro da tela;
  - os erros aparecem e são lidos pelo leitor de tela (`role="alert"`);
  - o botão de copiar o e-mail funciona.

**1.6 Quando não usar as telas, e o Sobre mim (P)**

- **O que fazer:**
  - Ligar o modo tela só com `screenMode = !flat && w >= 900 && h >= 560 && SCREEN_OF[focus]`, onde `SCREEN_OF = { projects:'monitor', experience:'tv', contact:'phone' }`.
  - Fora disso, tudo continua como hoje: painel lateral, folha de baixo no celular (`App.jsx` L193–211) e modo sem 3D.
  - O Sobre mim fica no painel (ver decisão 2).
- **Pronto quando:** em 390×844 e 768×1024 abre a folha e não existe `.screen` na página; no modo 2D nada muda.

**1.7 Telas em repouso com conteúdo de verdade (P/M)**

- **O que fazer:**
  - Redesenhar `codeScreenTexture`, `tvScreenTexture` e `phoneScreenTexture` (`textures.js` L209, L246 e L442) com:
    - o mesmo fundo e a mesma barra de título da versão HTML;
    - os nomes reais dos projetos, o cargo e a hora.
  - Redesenhar quando o idioma mudar.
  - O brilho já sobe acima de 1 à noite (`Desk.jsx` L230).
- **Por quê:** a troca da textura pelo HTML fica invisível, e as telas deixam de parecer apagadas na visão geral.
- **Pronto quando:** comparando o último quadro antes de a câmera parar com o primeiro depois, não há salto de cor nem de layout no cabeçalho.

### 2. Desempenho e luz no navegador (a parte realista de f)

- **O que fazer, para o desempenho:**
  - **`<BakeShadows/>` do drei (P).** Ele desliga a atualização automática do mapa de sombra e faz uma única atualização (`shadowMap.autoUpdate=false` + um `needsUpdate`).
    - O quarto é estático e o sol não se move (só a intensidade e a cor mudam).
    - Hoje o mapa de sombra 2048 é refeito a cada quadro, redesenhando todas as malhas com `castShadow`. Esse é o padrão de `Box`, `Rounded` e `Cyl` (`room/shared.jsx` L39–63).
    - Deve cortar boa parte dos 848 draw calls.
  - **Densidade de pixels no celular (P):** `dpr={compact ? [1, 1.5] : [1, 2]}`.
  - **Desenhar só quando algo muda (M):** `frameloop="demand"` com `invalidate()` em cada animação:
    - `damp` do dia/noite (`room/Lights.jsx` L32) enquanto `|mix − alvo| > 0,001`;
    - escala do `Hotspot` e o hover;
    - relógio, a cada 20 s.
    
    Com a câmera parada numa tela, a placa de vídeo fica parada.
  - **Juntar geometria estática por material (M/G)**, com `mergeGeometries` de `three/examples/jsm/utils/BufferGeometryUtils.js`: paredes, rodapés, piso e prateleiras. Só se a medição mostrar que ainda falta.
  - **Medição:** `window.__stats()` só em desenvolvimento (`gl.info.autoReset=false`, zerado a cada quadro) para contar draw calls por quadro, e fps com CPU 4x no `scripts/captura.mjs`.
- **O que fazer, para ficar mais bonito sem bake:**
  - **Janela que brilha.** O céu da janela (`room/Shell.jsx` L87–130) passa a `meshBasicMaterial toneMapped={false}`, com cor ×1,5–2 de dia e a lua ×3 à noite. O nosso Bloom (`luminanceThreshold 1`, `Scene.jsx` L128) faz o resto.
  - **Cor do LED num só lugar.** Hoje o magenta está separado no `pointLight` (`room/Lights.jsx` L69) e na fita (`room/Desk.jsx` L207). Criar um objeto `led = { color }` em `room/shared.jsx`, no mesmo esquema do `dayNight`.
    - Extra: clicar no gabinete troca a cor (magenta → ciano → laranja).
  - **Efeito maquete.** Testar um fundo de palco mais escuro, com vinheta, também de dia (`.stage`, `styles.css` L277–282), mantendo a interface clara. Decidir comparando capturas.
  - O N8AO continua só no desktop.
- **Por quê:** o que pesa no celular é a quantidade de draw calls (CPU), não os triângulos. E o visual da referência vem do brilho seletivo e do contraste, que dá para ter sem Blender.
- **Arquivos:** `Scene.jsx`, `room/Lights.jsx`, `room/Shell.jsx`, `room/shared.jsx`, `room/Desk.jsx`, `styles.css`.
- **Risco: baixo.** O `demand` pode congelar alguma animação esquecida, então testar uma por uma.
- **Pronto quando:**
  - o desktop cai para uns 500 draw calls por quadro ou menos, só com o `BakeShadows`;
  - o celular com CPU 4x passa de 40 fps depois do `demand`;
  - com a câmera parada e nada animando, são 0 quadros por segundo;
  - a janela e o LED brilham à noite.

### 3. Abertura e carregamento (b) — M

- **Como é hoje:**
  - A pílula "Montando o quarto…" (`App.jsx` L190) some no `onCreated` (`Scene.jsx` L141), antes do primeiro quadro.
  - Depois disso, gerar as texturas e compilar os shaders ainda trava a página.
  - A câmera já sai de `[34,30,34]`, mas o voo acontece durante esse travamento.
- **O que fazer:**
  - **Tela de abertura** em tela cheia (`.intro`), com a marca `</>`, nome, papel e uma barra sem porcentagem. Não inventar porcentagem, porque não há download para medir.
  - **`<Preload all/>`** do drei, para compilar os shaders e enviar as texturas antes.
  - **Componente `FirstFrame`:** um `useFrame` que roda uma vez e chama `onReady` no `requestAnimationFrame` seguinte.
  - **Só então:**
    - a abertura some em 400 ms;
    - a câmera voa até a visão geral em cerca de 1,4 s, saindo de um ponto mais alto e girado uns 30°;
    - a dica aparece quando a câmera para.
  - **Reduced-motion:** sem voo, só o fade.
- **Por quê:** é a primeira impressão. Esconde o travamento e dá o efeito de "maquete aparecendo" da referência, sem o carregador genérico dela.
- **Arquivos:** `App.jsx`, `Scene.jsx`, `styles.css`, `content.js`.
- **Risco: baixo.** Atenção ao StrictMode, que roda os efeitos duas vezes em desenvolvimento.
- **Pronto quando:**
  - com CPU 4x não aparece canvas vazio nem quadro travado;
  - a abertura some até 300 ms depois do primeiro quadro;
  - sem WebGL, o site vai direto ao modo 2D, sem abertura.

### 4. Destaque no hover e resposta ao clique (d) — M

- **O que fazer:**
  - **Contorno no desktop** (`!compact`):
    - `<Selection>` envolvendo `Room` e `Effects`;
    - `<Select enabled={hover && !active}>` dentro do `Hotspot`;
    - `<Outline xRay={false} blur edgeStrength≈3 visibleEdgeColor={cor de destaque}/>`, que já vem no `@react-three/postprocessing` 2.16.3.
    
    Somar ao `scale 1.04` que já existe.
  - **Etiquetas:** continuam sendo `<button>`, por acessibilidade. Depois da primeira interação viram só o pontinho e mostram o nome no hover ou no `:focus-visible` (`.tag`, `styles.css` L319). No celular, ficam como hoje.
  - **Clique:**
    - o objeto dá um "aperto" (1,04 → 0,97 → 1 em uns 250 ms);
    - quando a câmera para, a tela 3D dá um pico de brilho (1,6 → 1,25) antes do HTML entrar.
- **Por quê:** é o próprio objeto que avisa "isto é clicável".
- **Arquivos:** `Scene.jsx`, `room/shared.jsx`, `styles.css`.
- **Risco: médio.** O Outline acrescenta passadas de renderização, então é preciso medir o fps. Em grupos grandes, o contorno pode pegar mais do que deveria. Plano B: só a escala e a etiqueta.
- **Pronto quando:**
  - o hover nos 5 objetos clicáveis contorna só o objeto, sem atravessar paredes;
  - o fps não cai mais de 5;
  - focar a etiqueta pelo teclado mostra o mesmo destaque.

### 5. Troca de tema mais rica (c) — P/M

- **O que fazer:**
  - **Corrigir o salto do fundo.**
    - O `.stage` usa `radial-gradient(var(--bg), var(--bg-deep))` com `transition: background` (`styles.css` L277–282).
    - Gradiente não interpola: o fundo pula na hora, enquanto o 3D leva cerca de 1 s.
    - Correção: registrar `@property --bg` e `--bg-deep` com `syntax:'<color>'` e usar `:root { transition: --bg 1s, --bg-deep 1s }` com a mesma curva do painel, `cubic-bezier(0.2,0.8,0.2,1)`. Essa curva fica perto do `damp` λ=3, que chega a 95% em 1 s.
  - **Luzes em sequência**, usando faixas `smoothstep` do mesmo `dayNight.mix`:
    - céu e sol de 0 a 0,6;
    - LEDs de 0,25 a 0,8;
    - luminárias de 0,45 a 1.
    
    Indo para a noite, o céu escurece e depois as luzes acendem. Indo para o dia, as luzes apagam antes de clarear. As lâmpadas da "&" piscam 2 vezes ao acender (exceto com reduced-motion).
  - **Mola na "&" ao clicar** (escala 0,96 → 1), feita com `damp` no `useFrame`, sem instalar o `@react-spring`.
  - **Guardar `night` e `lang`** no `localStorage`, com try/catch. O `prefers-color-scheme` vale só na primeira visita.
- **Arquivos:** `styles.css`, `room/Lights.jsx`, `room/Niche.jsx`, `room/Shell.jsx`, `App.jsx`.
- **Risco: baixo.** Navegador sem `@property` volta ao salto de hoje.
- **Pronto quando:**
  - num vídeo de 1 s a 60 fps, o fundo CSS e as luzes 3D terminam juntos;
  - ao recarregar, o tema e o idioma continuam os mesmos.

### 6. Sons opcionais (e) — M

- **O que fazer:**
  - **Criar `src/sound.js`** com sons gerados por Web Audio, sem nenhum arquivo:
    - clique: ruído curto filtrado, uns 30 ms;
    - "whoosh" no voo da câmera, uns 400 ms;
    - "toggle" na troca de dia e noite;
    - "liga a tela" quando a câmera para.
  - **Volume:** volume geral em torno de 0,35.
  - **Áudio só depois de ligar:** o `AudioContext` só é criado quando o usuário liga o som, num clique dele.
  - **Sem som no hover.**
  - **Botão de som na topbar** (`.tools`, `App.jsx` L145–172):
    - usa `aria-pressed`, vem desligado e a escolha fica guardada;
    - ícones novos em `Icons.jsx`.
  - **Som ambiente (opcional):** um loop de licença CC0, por exemplo chuva leve à noite, com até 300 KB e baixado só depois de ligar. Nada de música comercial.
- **Por quê:** o clique ganha corpo sem os 6 MB de mp3 da referência.
- **Arquivos:** `src/sound.js` (novo), `App.jsx`, `Icons.jsx`, `content.js`.
- **Risco: baixo.** O Safari exige `resume()` dentro do clique.
- **Pronto quando:**
  - antes de ligar o som, nenhuma requisição é feita e nenhum `AudioContext` existe;
  - o mudo silencia na hora;
  - com a aba em segundo plano, o áudio pausa;
  - um navegador sem Web Audio não mostra erro.

### 7. Seção na URL e botão Voltar do navegador — P

- **O que fazer:**
  - Usar `#projetos`, `#experiencias`, `#contato` e `#sobre` com `pushState`/`popstate`.
  - O botão Voltar do navegador fecha a seção, e dá para pôr o link direto no currículo.
  - No modo 2D, o link rola até a seção.
- **Arquivos:** `App.jsx`, `content.js`.
- **Pronto quando:**
  - abrir `/#projetos` já entra no monitor;
  - o Voltar do navegador fecha a seção;
  - recarregar mantém a seção aberta.

### 8. Detalhes animados — P cada, se sobrar tempo

- **Monitor:** em repouso, cursor piscando ou uma linha sendo "digitada" (o canvas é redesenhado a cada 500 ms, com `invalidate`).
- **LED do gabinete:** "respira" à noite (seno lento em `emissiveIntensity`, `room/Desk.jsx` L189–191).
- **Partículas:** poeira na luz da janela de dia e vapor no difusor (`room/Bed.jsx`, componente `Diffuser`), com poucas partículas do `<Sparkles>` do drei.
- **Cadeira:** balança de leve, ±0,1 rad num ciclo de uns 20 s. Com o `BakeShadows`, a sombra dela não acompanha, então manter o movimento pequeno ou tirar a sombra da cadeira.
- **Relógio:** já mostra a hora real (`room/Desk.jsx` L297–318), não precisa do relógio de ponteiros.

### 9. Bake no Blender (a parte grande de f) — G, depois de 02/11

- **Dá para fazer até a apresentação? Não.** Seria preciso:
  - exportar a cena com `GLTFExporter`;
  - juntar as cerca de 450 malhas e criar o mapa UV da iluminação;
  - fazer 2 ou 3 bakes em 4096 no Cycles;
  - voltar com um GLB e trocar as partes estáticas, hoje feitas em código, por esse GLB com um shader de mistura.
  
  Para quem faz pela primeira vez, isso leva de 1 a 2 semanas, e qualquer ajuste de geometria obriga a refazer o bake.
- **Caminho depois da apresentação:**
  1. Começar assando só a oclusão de ambiente (AO) das partes estáticas. Ela vale para o dia e para a noite e mantém as luzes em tempo real (`aoMap` com `channel = 1`).
  2. Se gostar do resultado, fazer o bake completo:
     - dia, noite e a máscara RGB dos LEDs;
     - um shader nosso, com um único uniform `uNightMix` compartilhado e alimentado pelo `dayNight.mix`;
     - o decodificador Draco em `public/draco/`;
     - texturas webp sem metadados.
- **README:** o item "Blender (planejado para a Sprint 3)" precisa ser movido para depois da apresentação, ou explicar a alternativa no navegador.

## 4. Decisões que o Daniel precisa tomar

1. **Como fazer as telas: camada HTML sobre a tela ou `<Html transform occlude="blending">`, igual à referência?**
   - **Recomendo a camada HTML sobre a tela.** O resultado com a câmera parada é o mesmo, com texto mais nítido.
   - Também não vaza clique para a cena, não briga com as etiquetas nem com o pós-processamento e não tem os bugs do Safari.
   - A perda é ver o conteúdo durante o voo da câmera, e isso é compensado pela textura de repouso igual ao cabeçalho.
   - Se quiser esse efeito depois, basta trocar o `ScreenOverlay`.
2. **Onde fica o Sobre mim?**
   - **Recomendo manter no painel lateral na S02 e na S03.** É texto com foto, e o porta-retrato não é uma tela.
   - Se sobrar tempo, um cartão preso ao lado do porta-retrato, com a mesma técnica.
   - Não colocar no monitor, porque o Projetos perderia o destaque.
3. **Iluminação até 02/11: navegador ou Blender?** **Recomendo o navegador** (itens 2 e 5) e o Blender depois, começando pelo bake de AO.
4. **No celular: folha de baixo ou conteúdo dentro do celular 3D?**
   - **Recomendo manter a folha em todas as seções até 02/11.** Ela já está testada e é acessível.
   - Fica para depois um experimento: no celular em pé, o Contato abre dentro do celular 3D ocupando a tela toda.
   - Com a camada HTML isso é viável, porque os inputs não ficam dentro de uma transformação 3D.

## 5. Ordem de execução sugerida

| Etapa | Entrega | Como testar | Alvo |
|---|---|---|---|
| E1 | `window.__stats` só em desenvolvimento, mais capturas do estado atual | Anotar draw calls por quadro e fps no desktop e com CPU 4x (o ponto de partida é 848) | 07/10 |
| E2 | `BakeShadows`, dpr menor no celular, `@property` no fundo, tema e idioma guardados | Os draw calls caem; o fundo e o 3D trocam juntos; recarregar mantém tema e idioma | 08/10 |
| E3 | Malhas das telas com nome, prop `active` no Hotspot, câmera parando no monitor (ainda sem HTML) | Capturas em 1280×800, 1440×900 e 1920×1080; cliques rápidos sem corrida | 11/10 |
| E4 | `ScreenOverlay` mais `ScreenTracker`, com um retângulo de depuração | Erro de no máximo 2 px; zoom de 125/150%; redimensionar com a tela aberta | 13/10 |
| E5 | Monitor = Projetos, botão "Voltar ao quarto", foco e volta ao painel nas telas pequenas | Novo `scripts/telas.mjs`, baseado no `captura.mjs`: abrir, rolar, clicar em link, Tab, Esc, e celular sem `.screen` | 16/10 |
| E6 | Textura do monitor em repouso igual ao HTML, mais o efeito "liga a tela" | Comparar os quadros antes e depois de a câmera parar: sem salto | 17/10 |
| — | **Preview na Vercel (S02)** | Checklist do README mais `telas.mjs` | 18–19/10 |
| E7 | TV = Experiências | Simulação de projetor em 1280×720 | 20/10 |
| E8 | Celular = Contato, com envio real | Enviar pela tela; erros lidos pelo leitor de tela; o rascunho sobrevive ao Esc | 21/10 |
| E9 | Abertura e carregamento | CPU 4x sem canvas vazio; reduced-motion sem voo | 22/10 |
| E10 | Contorno no hover, etiquetas compactas, "aperto" no clique | fps antes e depois do Outline; destaque pelo teclado | 23/10 |
| E11 | Tema em sequência, janela que brilha, mola na "&", cor do LED num só lugar | Vídeo de 1 s; capturas de dia e de noite | 24/10 |
| E12 | Sons opcionais e seção na URL | 0 requisições com o som desligado; `/#projetos` e o Voltar do navegador | 25/10 |
| — | **README, GIFs e deploy final (S03)** | Rodar a suíte inteira | 26/10 |
| E13 | `frameloop="demand"` com `invalidate` (e juntar geometria, se a medição pedir) | Cada animação continua funcionando; 0 quadros/s parado; CPU 4x acima de 40 fps | 27–28/10 |
| — | Congelar funcionalidades: testes no Safari, iOS e Android, ensaio, plano B (modo 2D e vídeo gravado da navegação para o projetor) | Só correções | 29/10–01/11 |
| Depois | Bake de AO no Blender, depois o bake completo | Comparar draw calls e a aparência | Novembro |

---

**Correções nas referências dos estudos:**
- **Números de linha errados.** As linhas citadas em `Lights.jsx` e `shared.jsx` saíram de uma leitura com arquivos concatenados. O certo é:
  - o `damp` do dia/noite fica em `room/Lights.jsx` L32, não L146;
  - o `pointLight` do RGB fica em L69, não L225;
  - o `Material` fica em `room/shared.jsx` L35, não L56.
- **Achados novos desta revisão:**
  - o salto do gradiente do `.stage` na troca de tema;
  - a briga do `occlude="blending"` com qualquer outro `<Html>` (`Html.js` L129–139).