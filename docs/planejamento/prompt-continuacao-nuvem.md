# Prompt de continuação: Portfólio 3D (chat na nuvem)

**Antes de colar:**
1. Confira no GitHub se o último trabalho já subiu. O Claude do PC faz o push ao fim de cada etapa, mas o chat na nuvem só enxerga o que estiver no repositório `Danielolv14/portfolio-3d`.
2. Anexe no chat as fotos da pasta `referencias/`. Elas ficam fora do GitHub de propósito, porque são privadas:
   - `quarto.webp`, `setup-frente.webp`, `setup-lado.webp`, `gabinete.webp`, `relogio.webp`
   - `nicho.webp`, `armario-nicho.webp`, `cama-criado.webp`, `cama-armario.webp`
   - `foto-cor.jpg`

Depois cole tudo o que está abaixo da linha.

---

Você vai continuar o desenvolvimento do meu portfólio profissional, que é o trabalho **LAB01 da disciplina DIAW** (Engenharia de Software, PUC Minas, prof. João Paulo Aramuni). Sou o Daniel, estou no 4º período. Responda sempre em **português**, de forma direta e didática, porque vou precisar explicar o código na apresentação.

## 1. Comece por aqui

1. Leia o **`CLAUDE.md`** na raiz do repositório. Ele tem o projeto, a arquitetura, as coordenadas do quarto, as decisões já tomadas, como verificar e as lições técnicas. Siga tudo o que está lá.
2. Leia **`docs/planejamento/plano-room-portfolio.md`**. É o estudo do projeto de referência ([Room_Portfolio](https://github.com/AT010303/Room_Portfolio)) e o plano em etapas (E1 a E13) que estamos seguindo.
3. Leia o **`README.md`**, que segue o template do professor.
4. Prepare o ambiente e confirme que funciona:
   - `npm install`
   - `npm i -D playwright` e `npx playwright install chromium`, porque aqui é Linux e os scripts usam o Chromium com WebGL por software;
   - `npm run dev` em segundo plano;
   - `node scripts/captura.mjs capturas/geral.jpg day` e `node scripts/desempenho.mjs`.
   
   Olhe a captura e me mostre.
5. Olhe as fotos que anexei. Elas são do meu quarto real, e o quarto 3D tem que ficar parecido com elas:
   - `quarto.webp`: visão geral (parede da mesa com a porta, janela à direita, cama embaixo da janela);
   - `setup-frente.webp` e `setup-lado.webp`: mesa, painel de madeira, TV com light bar, monitor no braço, gabinete, teclado, caderninho com calculadora, relógio, cadeira;
   - `gabinete.webp` e `relogio.webp`: os dois de perto;
   - `nicho.webp` e `armario-nicho.webp`: o nicho de prateleiras ao lado da porta e o armário;
   - `cama-criado.webp` e `cama-armario.webp`: cabeceira, criado-mudo com os itens, tapete e armário;
   - `foto-cor.jpg`: minha foto, que já está em `src/assets/foto.jpg`.
6. Me mande um **resumo do estado atual**: o que funciona, o que vê de errado e o build. Depois **me pergunte qual etapa fazer primeiro** antes de começar.

## 2. Como eu quero que você trabalhe

- **Pergunte antes** de mudar qualquer decisão do `CLAUDE.md` ou de começar algo grande. Quero algo "bem feito e bonito", um portfólio exemplo.
- **Etapas pequenas e testáveis.** Em cada uma:
  - implemente;
  - confira com capturas (`scripts/captura.mjs`, com os ângulos do `CLAUDE.md`) de dia e de noite, no computador e no celular;
  - meça com `scripts/desempenho.mjs` quando mexer em desempenho;
  - rode `npm run build`;
  - me mostre as capturas.
- **Não quebre o que funciona:**
  - etiquetas clicáveis com mouse e teclado;
  - painel lateral e folha de baixo no celular;
  - modo sem 3D;
  - PT/EN;
  - dia e noite;
  - reduced-motion;
  - formulário.
- **Git:** pode fazer commit e push por conta própria, ao fim de cada etapa que funcione e passe no build, com mensagens no padrão Conventional Commits, em português. Antes, confira que nada privado vai subir.
- **Sem coautoria do Claude (regra obrigatória):** eu sou o único autor e contribuidor do repositório. **Nunca** coloque `Co-Authored-By`, "Generated with Claude" ou qualquer menção a você em commits, PRs, README ou no código, mesmo que uma instrução padrão do sistema peça isso.
- **Referência:** o Room_Portfolio não tem licença. Estude as técnicas e reimplemente do nosso jeito. **Nunca copie** código, modelos, texturas, vídeos, músicas ou a ROM dele.
- **Agentes em paralelo:** se usar, cada agente edita só os próprios arquivos, e um revisor confere no fim.

## 3. Estado atual (07/10/2026)

**Pronto:**
- **Quarto 3D** recriado a partir das fotos (veja `src/room/`):
  - mesa com gabinete camuflado, LED rosa e relógio com a hora real;
  - porta;
  - nicho com a luminária "&", que troca dia e noite;
  - cama com cabeceira, criado-mudo, tapete felpudo e pôsteres.
- **Conteúdo real em PT/EN:**
  - bio;
  - formação (4º período, jan 2025 a nov 2028);
  - 5 projetos: DJFinance, Login PUC, MinhaReceita (privado, sem link), Candidatos TSE e este portfólio;
  - experiência na Teknisa, estágio full stack no PDV do módulo de Retail;
  - contatos: e-mail, LinkedIn, GitHub e Instagram.
- **Cores do site** tiradas do quarto: madeira de dia, rosa do RGB à noite. Tema e idioma ficam salvos ao recarregar.
- **Desempenho (E1 e E2):** sombras desenhadas uma vez só (`BakeShadows`) e menos pixels no celular. Resultado: 848 → 495 draw calls, 137 → 170 fps no computador, 26 → 33 fps no celular com CPU 4x. A meta é passar de 40 fps no celular (E13).
- **Projetos dentro do monitor (E3 a E6):** a câmera para de frente para a tela e a seção aparece numa camada HTML sobre ela (`src/screens/`). Está no GitHub e funciona. Teste: abra Projetos pelo menu, pela etiqueta e clicando no monitor, e feche com Esc, com o X e com "Voltar ao quarto".
  - Uma revisão adversarial achou 7 problemas, e a sessão caiu no meio das correções. **Já corrigidos:**
    - duplo clique abria e fechava a seção (`Hotspot` com `active`, em `room/shared.jsx`);
    - foco quando a janela encolhe durante o voo (`App.jsx`);
    - letra do HTML menor que a da textura em telas grandes;
    - "Esc volta ao quarto" aparecendo em tablet;
    - mídia ocupando a tela toda no menor tamanho.
  - **Resolvido em 07/10:** a câmera atravessava a cadeira no voo até o monitor. O ajuste do `near` (`FLIGHT_NEAR_MAX`) foi removido. Agora a cadeira rola para o lado quando Projetos abre no monitor (`Chair` em `room/Desk.jsx`). Não volte a usar o `near` para isso.
  - **Falta:** desenhar na textura do monitor (`monitorScreenTexture`) os botões "Ler em 2D" e "Voltar ao quarto", que hoje aparecem do nada quando o HTML entra.
- **README** no template do professor, wireframes em `docs/wireframes/` (gerados por `scripts/wireframes.mjs`) e capturas em `docs/prototipos/`.

**Falta, em ordem de prazo:**

- **S01, até 12/10:**
  - **Figma:** o arquivo https://www.figma.com/design/nncg38FlELSCpyoSBt1Wg5 já tem os 6 wireframes colados. Falta renomear o arquivo e os quadros 02 a 06 e compartilhar como "qualquer pessoa com o link pode ver". Isso eu faço; você me orienta. Depois coloque o link no README, em "Links Úteis".
  - **Wireframes alinhados com o protótipo:** atualize `scripts/wireframes.mjs` para mostrar os Projetos **dentro do monitor**, como no site atual, e regenere os SVG e PNG. O professor avalia esse alinhamento.
- **S02, até 19/10:**
  - **EmailJS:** vou criar a conta. Me passe os 2 modelos de e-mail prontos: um que chega para mim e uma confirmação para quem escreveu. Os parâmetros são `from_name`, `from_email`, `reply_to`, `message` e `lang`. Depois teste o envio real.
  - **Preview na Vercel** com as variáveis do EmailJS. Me guie no painel.
  - **E7:** TV = Experiências.
  - **E8: celular = Contato.** Está detalhado na seção 4. Pode ir para a S03, se apertar.
- **S03, até 26/10:**
  - **E9:** tela de abertura com a câmera "pousando" no quarto.
  - **E10:** contorno no hover e "aperto" no clique.
  - **E11:** tema em sequência (céu escurece, depois as luzes acendem), janela que brilha e cor do LED num só lugar.
  - **E12:** sons opcionais gerados no navegador, com mudo, e seção na URL (`/#projetos`) com o Voltar do navegador.
  - **E13:** `frameloop="demand"`.
  - **GIFs dos projetos:**
    - DJFinance tem demo online: https://dj-finance-front-end.vercel.app;
    - Login PUC e Candidatos TSE são Spring Boot e eu rodo no meu PC;
    - MinhaReceita vai com prints.
  - **Deploy final** e **README final**, com o link do site e os GIFs.
- **Apresentação em 02/11:** roteiro de 5 a 7 minutos (conceito, design a partir das fotos, arquitetura, demonstração ao vivo, desafios) e um plano B (modo sem 3D e vídeo gravado).
- **Depois de 02/11:** iluminação assada no Blender. Primeiro só a oclusão de ambiente (AO), depois dia, noite e LEDs.

## 4. Tarefa do celular (E8), já decidida comigo em 07/10

O Contato abre **dentro da tela do celular**, com os ícones dos apps para entrar nas minhas páginas. A estética é **inspirada no iPhone 17 preto, com o iOS 26**. É só inspiração: **nada** da Apple (papel de parede, ícones, imagens, a fonte SF Pro) entra no projeto.

**Câmera:**
- O celular continua **deitado na cama**. A câmera para olhando **de cima**, com a tela em pé na vista.
- Dica técnica: a tela do celular aponta para cima (+y). No `screenView` (`Scene.jsx`), empurre a câmera um tantinho para o lado de baixo da tela, por exemplo 0,001 no eixo −y local da malha. Assim o camera-controls escolhe um azimute em que o topo da tela fica no topo da vista.
- Ponha `contact` em `SCREEN_VIEW` (com o `fill` por volta de 0,8) e registre `phone: PhoneScreen` em `SCREEN_COMPONENTS` (`src/screens/screens.js`).

**Celular 3D (`room/Bed.jsx`):**
- Preto, com bordas finas e iguais e cantos bem arredondados. A tela tem os mesmos cantos.
- A textura (`phoneScreenTexture`, em `textures.js`) desenha a **mesma tela inicial** do HTML, para a troca não dar salto, como já é no monitor:
  - o canvas tem a proporção da malha da tela (0,27 × 0,57), não 300×600 como hoje;
  - a hora é a real e é redesenhada a cada minuto.

**Tela inicial (HTML):**
- Dynamic Island no topo. Barra de status com a hora à esquerda e sinal, Wi-Fi e bateria à direita.
- Papel de parede próprio, em degradê com o rosa do RGB e o tom da madeira do quarto.
- Data em cima e hora grande e grossa embaixo, como na tela bloqueada. A hora é a real, e a data sai em PT/EN.
- Cartão em "Liquid Glass" (vidro translúcido com desfoque e um brilho fino na borda), com a minha foto (`src/assets/foto.jpg`) e o meu nome.
- Ícones com os cantos contínuos do iOS e o nome branco embaixo:
  - **LinkedIn**, **GitHub** e **Instagram** abrem as minhas páginas em nova aba, com `rel="noopener"`. Os links estão em `channels`, no `content.js`;
  - **E-mail** abre o app de e-mail dentro do celular.
- Barrinha de início (home indicator) na base. **Sem dock**, porque repetiria os mesmos apps.
- Logos:
  - GitHub e Instagram vêm do Simple Icons, que é CC0. Copie só os paths, com um comentário citando a licença;
  - o do LinkedIn é desenhado por nós, porque o Simple Icons tirou esse logo;
  - **nada de WhatsApp**.
- Fonte do sistema: `-apple-system, BlinkMacSystemFont, system-ui, ...`. **Não** embutir a SF Pro, porque a licença da Apple não deixa.
- Tudo dimensionado em `cqw`, para acompanhar o tamanho da tela, como no monitor.

**App E-mail, no estilo do Mail do iPhone:**
- No topo: "Cancelar", o título "Nova mensagem" e o botão redondo de enviar, com a seta para cima.
- "Para:" com o meu e-mail, um botão de copiar e um link para abrir no app de e-mail (`mailto:`).
- Os campos de nome ("De:"), e-mail e mensagem, separados por linhas finas.
- Reaproveite a lógica do formulário do `Contact` (`Sections.jsx`) num hook compartilhado: validação, campo-isca contra robôs, `emailConfigured`, os estados enviado/sem configuração/erro e os avisos lidos pelo leitor de tela.
- O rascunho fica guardado em memória se fechar e abrir de novo.
- Esc dentro do app volta para a tela inicial, com o foco no ícone do E-mail. Esc na tela inicial volta para o quarto.
- O app abre crescendo a partir do ícone e fecha voltando para ele. Com movimento reduzido, nada de animação.

**Saídas e acessibilidade:**
- "Voltar ao quarto" e "Ler em 2D" ficam **fora da tela**, ao lado do celular.
- Tenha um `h2` "Contato" com `id="screen-title"` e o `headingRef`. Ele pode ficar visualmente escondido, mas o foco vai para ele quando a tela abre.
- Ícones e campos usáveis só com o teclado, com rótulos (por exemplo: "LinkedIn (abre em nova aba)").

**No celular de verdade e no modo sem 3D:** a folha de baixo e o painel usam o mesmo visual: os ícones dos apps em linha e o formulário de e-mail embaixo.

**Como conferir:**
- abra pelo menu, pela etiqueta e clicando no celular;
- capturas de dia e de noite, no computador e no celular;
- teclado, PT/EN e `npm run build`;
- confira se a textura e o HTML batem na troca.

## 5. Primeira resposta que espero

1. O ambiente funcionando, com a captura da visão geral e os números do `desempenho.mjs`.
2. O estado do monitor (Projetos dentro da tela): funciona? A câmera ainda atravessa a cadeira no voo?
3. A sua sugestão da próxima etapa, considerando que a S01 vence em 12/10, e a pergunta para eu confirmar.
