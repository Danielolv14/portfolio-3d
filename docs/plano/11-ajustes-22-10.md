# Ajustes pedidos em 22/10 (depois da primeira publicação do quarto realista)

Plano para executar numa próxima sessão. O quarto realista está no ar desde 22/10 (commit `36e9904`). Leia antes: `CLAUDE.md` (decisões 14 e 15), `pipeline/README.md` (prévia rápida) e `docs/plano/10-modelos-prontos.md`.

## Situação (22/10, execução automática)

| Item | Feito | Observação |
|---|---|---|
| A1 DJ e KRK | ✅ | XDJ e monitores girados 180° (de frente para o DJ, -z); monitores em `cz + 0,2`; fone espelhado para o lado do DJ. Câmera `dj` no `bake.json`. |
| A2 Escala | ✅ | `ESCALA_MODELOS = 2.6` uniforme em `importar_modelo`/`importar_terceiro`; sem o ×1,6 dos Funkos e do trailer. A poltrona ficou com fator 0,85 (na escala real ela dominava a visão geral). A JBL ficou boa deitada com a rotação atual, sem fator. |
| A3 Dunk e Funko HP | ✅ | **A causa não era cor por vértice** (os dois não têm `COLOR_0`): eram "sopa de triângulos" (3 vértices por face), e o atlas do bake virava milhares de ilhas sem pixels. `base._soldar_se_solto()` solda os vértices na importação (Dunk 41 123 → 6 858; Funko 74 980 → 12 502). O conversor não mudou. |
| A4 Poltrona | ✅ | Poltrona em `(3,8; 0; 2,75)`, mesinha em `(2,3; 0; 3,85)`; o log do `frente.py` confere as caixas ("separadas"). |
| A5 Creatina | ✅ | Removida do `Bed.jsx` (e a textura `creatineTexture` e o uso na página de exportação). |
| A6 Fita da mesa | ✅ | Peça `fita_mesa` e o LED `fita-mesa` removidos. |
| A7 Luz quente | ✅ | Canal B em âmbar (`#ffb36b` nos materiais, `corSite [1, 0.72, 0.47]`). Teclado RGB não mudou. |
| A8 Parede grafite | ✅ | Parede A e rodapé em grafite; o dia continuou legível sem mexer no preenchimento. |
| A9 Bake | ver o histórico do git | Bake completo + conferência no site. |
| B1 Monitor GitHub | ✅ | `MonitorScreen` + `monitor.css` + `github.js`; dados no build por `scripts/github.mjs` (`prebuild`). Sem token, o gráfico usa a atividade pública (eventos dos últimos 90 dias + criação dos repositórios). |
| B2 TV LinkedIn | ✅ | `TvScreen` + `tv.css`, ligada em `SCREEN_COMPONENTS`; enquadramento `experience` no `SCREEN_VIEW` do Scene. Textura em repouso redesenhada e calibrada (de dia o branco da textura sai `#e6e6e6`, então o CSS claro usa esse tom). |

**Como trabalhar (economiza créditos):** fazer todos os ajustes do **Ciclo A** com a prévia rápida (`npm run previa -- --sem-exportar --vistas=...`, ~40 s por rodada), mostrar ao Daniel e só no fim rodar **um** bake completo (~75 min, em segundo plano). O **Ciclo B** (telas) não depende do Blender.

---

## Ciclo A: o quarto (Blender, um bake só no fim)

### A1. Cantinho DJ: controladora e caixas de som viradas para o lado certo

- **Problema:** a XDJ e os dois KRK estão virados ao contrário. A frente deles (lado dos pratos e dos alto-falantes) aponta para a câmera (+z), e o DJ fica do lado de dentro do quarto (-z).
- **Fazer:** em `pipeline/blender/modelos/frente.py`, na chamada `pronto("xdj", ...)`, girar 180° (`rotacao=(0, math.pi, 0)`). Nos monitores, `(0, math.pi - lado * 0.25, 0)`, para continuarem virados para o meio, agora de frente para o DJ. Conferir se o fone e os pen drives ficam do lado do DJ (z menor que o do aparador); se não, espelhar o `dz` deles. O aparador continua com as portas para a câmera.
- **Conferir:** criar a câmera `"dj"` no `bake.json` (`cameras`), por exemplo `posicao [2.0, 3.2, 1.0]`, `alvo [-0.2, 1.3, 4.3]`, e rodar a prévia `--vistas=dj,geral`.

### A2. Tamanho de todos os modelos importados ("grandes, esquisitos")

- **Causa:** `importar_modelo`/`importar_terceiro` usam escala **não uniforme**, `(3.2, 2.15)`: 3,2 unidades por metro na horizontal e 2,15 na vertical. Os objetos ficam largos e achatados. Os Funkos e o trailer ainda levam ×1,6 (`nicho.py`), e a poltrona usa `(2.5, 2.0)` (`frente.py`).
- **Fazer:**
  1. Em `modelos/base.py`, criar `ESCALA_MODELOS = 2.6` (média entre 3,2 e 2,15) e usar escala **uniforme** como padrão em `_importar_glb` (`escala=(2.6, 2.6)`).
  2. Tirar o ×1,6 dos Funkos e do trailer e o `(2.5, 2.0)` da poltrona.
  3. Ajustar objeto por objeto, com um fator só quando precisar, comparando com as referências do quarto: tampo da mesa em y = 1,56 (72 cm), largura da cama 2,95 e altura da prateleira de 1,25 entre níveis.
- **Tamanhos de referência (real → unidades com 2,6):**
  - XDJ: 0,73 m → 1,9
  - KRK: 0,285 m de altura → 0,74
  - poltrona: ~1,0 m → 2,6, verificar
  - Funkos: 0,18 m → 0,47
  - trailer: 0,22 m → 0,57
  - JBL: 0,213 m → 0,55
  - controle: 0,16 m → 0,42
  - Dunk: 0,30 m → 0,78
  - enciclopédias: 0,55 m → 1,43
- **A "caixinha" (JBL) ficou pequena e esquisita:** depois da escala uniforme, conferir de perto (`--vistas=nicho`). Se continuar pequena, usar fator 1,3. "Esquisita" pode ser a orientação: ela deve ficar deitada sobre os pezinhos, com o logo virado para o quarto (hoje a rotação é `(0, 1.62, 0)`; testar `(0, 1.57 ± 0.3, 0)` e conferir se não está de lado). Se o Daniel quis dizer os KRK ("sons"), eles entram no A1.
- **Trailer:** o Daniel gostou, então só tirar o ×1,6 se ficar estranho ao lado dos Funkos.

### A3. Detalhes pretos no Dunk e no Funko do Harry Potter

- **Suspeita principal:** o modelo original traz **cor por vértice** (`COLOR_0`). O `simplificar_materiais` (`exportar.py`) só cria `cor_base` branca quando a malha não tem cor por vértice, e o `GLTFLoader` do site multiplica a textura por essa cor, que pode ser preta. Na prévia do Blender eles aparecem certos; o problema é só no site.
- **Fazer:** em `pipeline/blender/converter.py`, em `juntar_malhas()`, apagar as cores por vértice de cada malha importada (`for a in list(o.data.color_attributes): o.data.color_attributes.remove(a)`) e rodar `npm run terceiros -- --forcar`.
- **Se não resolver:** conferir no site se algum material desses modelos tem `metalness` 1 (metal escuro sem reflexo) e forçar `Metallic = 0` nos materiais deles no conversor.
- **Conferir:** no site local, capturar de perto o Dunk (perto da porta) e a base da estante.

### A4. Poltrona dentro da mesinha ("banquinho")

- **Fazer:** depois do A2, reposicionar sem encostar. Ponto de partida: poltrona em `(3.9, 0, 2.95)`, girada `(0, -0.785, 0)`; mesinha em `(2.3, 0, 3.85)` e o controle em cima dela, acompanhando.
- **Conferir sem olhar:** em `frente.py`, depois de montar, calcular a caixa (bounding box) da poltrona e da mesinha e registrar no log se elas se cruzam.

### A5. Limpar o "negócio preto e azul" do criado-mudo

- **O que é (interpretação):** o pacote de **creatina** (preto com a faixa azul) em cima do criado-mudo, `src/room/Bed.jsx`, `Nightstand()`, por volta da linha 416. Se o Daniel quis dizer outra coisa, perguntar com uma captura de perto (`--vistas=cama`).
- **Fazer:** envolver a creatina com `<Bake peca="creatina">` dentro do bloco `objetos_criado` e pôr `"creatina"` no terceiro item do `SUBSTITUI["cama"]` (`modelos/__init__.py`). Para tirar de vez também do quarto em código, apagar o componente (a camada de interação não precisa dele).

### A6. Tirar a luz rosa embaixo do gabinete/mesa ("não tem")

- **Fazer:** em `mesa.py`, apagar a peça `fita_mesa` (a fita de LED embaixo do tampo); em `bake.json`, apagar o LED `fita-mesa` da lista `leds`.

### A7. Fans do gabinete e fita da cama em luz quente

- **Fazer:** a cor do canal B passa de rosa para **quente** (âmbar suave, ~2700 K, `#ffb877` ≈ `[1.0, 0.72, 0.47]`):
  - no `bake.json`, `corSite` de `rgb-gabinete`, `fita-cabeceira` e `rgb-interno`; o site lê a cor da primeira fonte do canal;
  - nos materiais que brilham: `led_rgb`, `led_botao` (`mesa.py`), `led_fita` (`cama.py`) e os anéis dos fans (`c["led"]` do gabinete). Trocar `emissao="#ff3fd2"` por `"#ffb36b"` e a cor de base escura por `"#2a1a0a"`.
- **Não mexer:** o RGB do teclado (mapa próprio, colorido); confirmar com o Daniel se ele quer quente também. O acento rosa da interface à noite também fica.
- **Conferir:** prévia `--rigs=noite --vistas=geral,mesa_pc,cama`. A noite deve ficar aconchegante e ainda legível; se escurecer, subir `fita-cabeceira` e `luminaria-cabeceira`.

### A8. Parede do computador em grafite, como a da cama

- **Fazer:** em `estrutura.py`, a `parede_a` passa a usar o mesmo material `grafite` da parede B, e o `rodape_a` passa para `rodape_grafite`. A porta clara e o painel ripado de carvalho viram os contrastes dessa parede. A estante preta fica menos visível no grafite: se sumir, clarear um pouco as prateleiras ou o metal.
- **Atenção:** com as duas paredes escuras, o quarto escurece. Na prévia, conferir o dia e subir o `preenchimento` (rig `dia`, hoje 450) ou a exposição se precisar.

### A9. Fechar o ciclo

1. Prévias finais (dia e noite: `geral`, `mesa_pc`, `cama`, `nicho`, `porta`, `dj`) → mandar ao Daniel → ajustar.
2. Bake completo em segundo plano: `npm run bake > pipeline/.cache/log-ajustes.txt 2>&1`.
3. Conferir no log que **não** aparece "could not be saved" (`exportar._imagens_rgb` cuida dos tons de cinza).
4. Conferir o site local com `node scripts/captura.mjs ...`: dia, noite, `--secao=Projetos`, `--secao=Contato`.
5. Atualizar `docs/creditos.md` se entrar modelo novo.
6. Commit no padrão do Daniel, **sem coautoria**, e push. Conferir no ar: o `versao` do `https://www.danielolv.dev/room/manifest.json` tem que ser igual ao local.

---

## Ciclo B: as telas com identidade (sem Blender)

Especificação completa em [`08-telas.md`](08-telas.md), seções 1 e 2 (é só inspiração: sem logos do GitHub/LinkedIn, ícones e fontes de licença livre).

### B1. Monitor = Projetos, no estilo GitHub

- Arquivos: `src/screens/MonitorScreen.jsx` (+ CSS), dados em `src/content/content.js` (`PROJECTS`).
- Visual: fundo escuro `#0d1117`, cabeçalho de perfil (foto, nome, bio), abas "Visão geral / Repositórios", **lista de repositórios** como cartões (nome, descrição, linguagem com bolinha de cor, estrelas) e o **gráfico de contribuições** (grade de quadradinhos verdes).
- Dados reais no build (decisão P13): um script de build busca na API pública do GitHub (`api.github.com/users/Danielolv14/repos`, sem token dá 60 pedidos por hora, suficiente no build) e grava um JSON. Se falhar, usa os dados do `content.js`. O token na Vercel continua opcional.
- Manter o que já funciona: a camada HTML sobre a tela 3D (decisão 2), "Ler em 2D" e "Voltar ao quarto".

### B2. TV = Experiências, no estilo LinkedIn

- Novo `src/screens/TvScreen.jsx`; em `src/screens/screens.js`, ligar `experience → tv` no `SCREEN_COMPONENTS` (hoje a TV ainda abre no painel).
- Visual: capa (banner), foto redonda sobreposta, nome, título ("Estagiário Full Stack · Teknisa"), local (Belo Horizonte), e a seção **Experiência** com cartões (logo quadrado genérico, cargo, empresa, período, descrição e competências). Navegação por setas ou cliques, como o monitor.
- Conferir a câmera parando de frente para a TV (`screen-experience`) no computador; no celular continua a folha de baixo (decisão 4).

### B3. Fechar

`npm run check`, capturas das duas telas, commit e push (o site publica sozinho).

---

## Pendente para depois: situação em 23/10

- ✅ **GLB leve para o celular** (22/10, `73e9889`): texturas de no máximo 1024 px no computador e um `room-mobile.glb` (512 px, sem relevo) para o celular, que não abria o site.
- ✅ **Indicador de carregamento** (23/10): "Montando o quarto… 63%", com a barra andando pelos bytes do GLB e pelas texturas de luz (`src/baked/progresso.js`, `Carregando` no `App.jsx`). Ele só some quando o quarto aparece de fato (antes sumia quando o canvas era criado, e o fundo ficava vazio).
- ✅ **Carregamento mais rápido** (23/10):
  - o download do quarto começa na abertura da página (`src/baked/carregamento.js`, chamado no `main.jsx`), em paralelo com o JavaScript, e não depois do three.js;
  - as texturas de luz leves vêm junto e o computador troca pelas inteiras depois;
  - a foto 360° dos reflexos fica para depois do primeiro quadro;
  - os arquivos levam `?v=<versão do bake>` e o `vercel.json` manda o navegador guardar `/room/*` por um ano (o `manifest.json` nunca vem do cache);
  - as malhas dos modelos prontos caíram para cerca de um terço (limite de `faces` no conversor e em `importar_modelo`).
- ✅ **Janela viva** (23/10): o Daniel trocou BH por **sol de fim de tarde de dia e cidade chuvosa à noite** (`src/room/WindowView.jsx`: céu, duas camadas de prédios em profundidades diferentes para a paralaxe, chuva caindo e gotas no vidro). O sol do bake ficou mais baixo, forte e dourado, e entra pela janela até o tapete.
- ✅ **Estante** (23/10): saíram o troféu, as chaves, o suporte verde e o Stormtrooper (do código também); a mochila e o boné em cima da cama também saíram. Entraram, por script: chapéu pork pie e frasco com líquido azul (Breaking Bad), ovo de dragão no suporte (GOT), varinha (HP), caneca com `</>` e, pendurados, o crachá do estágio e a credencial BACKSTAGE. O porta-retrato (Sobre mim) ficou. O Daniel vai procurar mais modelos prontos para a estante.
- ✅ **Prateleira do porta-retrato e bola nova** (23/10, à tarde): a prateleira ficou só com o porta-retrato e a caneca (saíram chapéu, frasco, ovo de dragão, varinha, crachá e credencial). A bola virou a **Mikasa FT-5** do Daniel: 32 triângulos em xadrez (o desenho foi tirado da foto dele, mapeando as cores), escritos MIKASA / FT-5 / Footvolley ball, "Goalmaster" em dourado e SOFT BILT / NYLON WOUND / WATER PROOF / SIZE 5. Vistas novas na prévia: `bola` e `prateleira`.
- ❌ **Frases e gostos para a estante (P8): descartado** pelo Daniel (23/10). A estante fica só com os objetos, sem cartões.
- ⏳ Robô, moto e garrafinha (outras prateleiras) e o console PS5 por script: esperar os modelos que o Daniel vai procurar.
