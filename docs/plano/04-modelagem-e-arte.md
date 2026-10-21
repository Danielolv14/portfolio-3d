# Fase 2 — Direção de arte e modelagem

Com o pipeline pronto, cada melhoria de arte vira um ciclo curto: **mudar → look dev → bake → capturar → comparar**. Esta fase trabalha em ciclos, do que mais aparece para o que menos aparece.

**Esforço:** G, em 4 ciclos. **Marco:** M3, "cara de referência".

---

## 1. Direção de arte

### Valores e paleta

- **Estrutura de valor primeiro, cor depois.** A imagem precisa de pretos, médios e brancos de verdade. Hoje quase tudo é médio-claro (bege, creme e piso claro).
  - Escuros: gabinete, cadeira, TV, cabeceira de mogno e a faixa de penumbra nos cantos.
  - Médios: madeira da mesa, painel de carvalho, tapete.
  - Claros: nicho branco, lençol, mancha de sol.
- **Uma cor de destaque por clima:** de dia, o âmbar do sol; à noite, o magenta do RGB.
- **Ajustes permitidos (base real com direção de arte):** escurecer um pouco o rejunte e o porcelanato, aprofundar a madeira, dar mais saturação aos tecidos. Nada que deixe o quarto irreconhecível. O Daniel aprova pelas capturas lado a lado.
- **A interface segue o quarto:** os tokens de `styles.css` (`--bg`, `--accent` etc.) são revistos no fim, a partir do render final.

### Moldura de maquete

- **A laje do piso** com espessura, quina chanfrada e lateral um pouco mais escura, como uma maquete.
- **Sombra no fundo:** um plano com sombra suave assada debaixo da laje, para o quarto parecer pousado, não colado na tela.
- **Fundo de dia:** hoje é bege sobre bege. Testar três opções e escolher pelas capturas:
  1. degradê neutro médio com vinheta;
  2. degradê frio e escuro (como a referência), com a interface clara por cima;
  3. o bege atual, mais escuro nas bordas.

### Composição

- **Três camadas de altura com algo para ver em todas:** chão (tapete, bola, tênis, mochila), meio (mesa, cama, criado-mudo) e alto (TV, nicho, pôsteres, janela).
- **Nenhuma área grande lisa:** paredes com textura sutil, tapete com pelo e edredom com matelassê real.
- **Linhas que levam o olho:** cabos, a borda da mancha de sol e as listras da persiana apontando para os objetos clicáveis.

## 2. Auditoria: acabar com o "genérico e feio"

Pedido do Daniel (21/10): no geral, a modelagem está genérica e feia. O primeiro passo da Fase 2 é medir isso objeto por objeto, para não depender de impressão.

1. **Capturas de perto de cada objeto** (script automático: um ângulo por objeto, de dia, com a mesma luz).
2. **Nota de 1 a 5** em quatro critérios:
   - **forma**: proporção e silhueta batem com o objeto real?
   - **detalhe**: tem as partes que fazem o objeto ser reconhecido (puxador, costura, botões)?
   - **acabamento**: quinas chanfradas, nada de caixa crua?
   - **material**: a superfície parece madeira, tecido ou metal de verdade?
3. **Tudo abaixo de 4 entra na lista de refazer**, começando pelos heróis.
4. A planilha fica em `docs/metricas/auditoria-objetos.md` e é refeita no fim de cada ciclo, para mostrar a evolução (vira material do estudo de caso).

### Quem modela e como

O código em React chegou ao limite para formas detalhadas: caixas, cilindros e perfis não fazem uma pelúcia ou um tênis convincentes. Por isso, para os objetos que pedem mais:

- **Modelagem por script Python no Blender**, escrita pelo Claude e versionada em `pipeline/blender/modelos/`. Funciona muito bem para peças rígidas (teclado, cadeira, gabinete, luminárias, puxadores, molduras) e para tecidos (simulação). Cada modelo é revisado por render de perto antes de entrar.
- **Modelagem à mão** em `art/*.blend` só para o que o script não alcança bem (rostos de pelúcia, tênis, mochila). Pode ser o Daniel aprendendo Blender, o que também rende história para o estudo de caso (pergunta P2).
- No pipeline, o objeto do código vira só um **marcador de posição** com o mesmo nome. O passo `35_arte.py` troca o marcador pelo modelo detalhado. O layout continua no código.

## 3. Técnicas de modelagem (todas por script, no pipeline)

| Técnica | Onde | Como |
|---|---|---|
| **Chanfro automático** | Todas as peças rígidas | `20_chanfrar.py`: Bevel por ângulo + Weighted Normal ([02](02-pipeline-blender.md)) |
| **Simulação de pano** | Edredom, lençol, travesseiros, almofada, boné | Ver abaixo |
| **"Inflar" com pressão** | Pelúcias, almofadas, pufe | Formas simples do código ganham volume macio com pano + pressão interna |
| **Curvas** | Cabos (monitor, PC, luminárias, carregador), alça da mochila, cadarço | Curvas de Bézier com espessura, geradas a partir de pontos em `bake.json` |
| **Detalhe alto → malha simples** (bake *selected to active*) | Pelo do tapete, costura do matelassê, trama da cadeira, teclas | A versão cheia de detalhe só existe no Blender. O detalhe é assado na textura da peça simples, e o site recebe a imagem, não os polígonos |
| **Materiais procedurais** | Madeiras, tecidos, porcelanato, granito | Veio de madeira, trama e variação de rugosidade no Blender, assados no albedo. Substituem várias texturas de canvas |

### Tecidos por simulação

`30_tecidos.py`:

1. Cria um plano subdividido do tamanho do edredom acima do colchão.
2. Colchão, travesseiros e cabeceira viram colisores.
3. Roda a simulação de pano por um número fixo de quadros, com as mesmas configurações, para sair sempre igual.
4. Aplica, adiciona espessura (*Solidify*) e suaviza.
5. O matelassê vem de um padrão de costura assado da versão detalhada.

Travesseiros e almofada: um cubo achatado + pano com pressão = forma estufada com rugas naturais.

## 4. Inventário dos objetos

Prioridade pelo que mais aparece: **H** = herói (a câmera chega perto), **M** = visto da visão geral, **F** = fundo.

| Objeto | Arquivo | Prior. | Hoje | Plano |
|---|---|---|---|---|
| Cama: edredom, lençol, travesseiros, almofada | `Bed.jsx` | H | Caixas com textura de matelassê | Pano simulado + matelassê assado do detalhe |
| Cabeceira de mogno | `Bed.jsx` | M | Perfil extrudado, com emissivo falso de dia | Chanfro; remover o emissivo falso (a luz rebatida vem do bake) |
| Celular (Contato) | `Phone.jsx` | H | Bom (iPhone 17) | Só bake; tela continua ao vivo |
| Monitor + braço (Projetos) | `Desk.jsx` | H | Bom | Chanfro, cabo, reflexo do cubemap no vidro |
| Gabinete camuflado + LED | `Desk.jsx` | H | Bom | LED no canal B; adesivos como decalque no albedo |
| Teclado AK820 e mouse | `Keyboard.jsx`, `Mouse.jsx` | H | Bons | Teclas por detalhe assado; RGB no canal B |
| Cadeira Elements Vector | `Chair.jsx` | M | Boa, cromada | Peça `dyn-`, metal com cubemap, mancha de sombra própria |
| TV + light bar (Experiências) | `Desk.jsx` | H | Boa | **Luminária principal da noite** (light bar, canal G) |
| Mesa de nogueira e gaveteiro | `Desk.jsx` | M | Caixas | Chanfro, veio procedural, puxadores com metal |
| Relógio LCD | `Desk.jsx` | F | Hora real | Continua ao vivo como `emit-` |
| Nicho branco (4 níveis) | `Niche.jsx` | M | Caixas | Chanfro, sombra de contato de cada objeto |
| Luminária "&" | `Niche.jsx` | M | Boa | Só brilho decorativo à noite (não ilumina mais o quarto); entra na nova estante |
| Porta-retrato (Sobre mim) | `Niche.jsx` | H | Bom | Vidro com reflexo |
| Pelúcias, robô, Stormtrooper, troféu, JBL | `Niche.jsx` | M | Formas simples | Pelúcias "infladas"; resto conforme a pergunta P2 |
| Porta | `Shell.jsx` | M | Boa | Batente chanfrado, maçaneta metal |
| Janela + persiana | `Shell.jsx` | H | Boa | Vidro emissivo, persiana projetando listras de sol |
| Pôsteres | `Shell.jsx`, `Bed.jsx` | M | Arte própria minimalista | Moldura com vidro e reflexo; arte em resolução maior |
| Tapete felpudo | `Bed.jsx` | M | Camadas com textura | Pelo assado do detalhe |
| Bola de futevôlei | `Bed.jsx` | M | Esfera com textura | Gomos com relevo |
| Piso de porcelanato, rodapé de granito | `Shell.jsx` | M | Textura de canvas | Procedural; rejunte com leve relevo |
| Mochila e tênis | `Floor.jsx` | F | Formas simples | Conforme a pergunta P2 (à mão ou simplificados com chanfro) |

## 5. Mais detalhe (sempre com base no quarto real)

Uma rodada só para densidade, **validada com o Daniel e as fotos**, porque é base real:

- cabos e filtro de linha debaixo da mesa;
- carregador do celular na cama;
- objetos do dia a dia no criado-mudo e na mesa (garrafa, fone, livros);
- objetos que contam a história do Daniel (ideias em [07](07-ideias.md)).

## 6. Ciclos da Fase 2

| Ciclo | Foco | Pronto quando |
|---|---|---|
| 1 | Auditoria de todos os objetos; luz e paleta: rigs finais, fundo, laje de maquete | Planilha de notas feita; painel de look dev aprovado pelo Daniel, de dia e de noite |
| 2 | Heróis: cama com tecidos, mesa e setup, janela com a **vista em camadas** ([03](03-iluminacao.md#7-a-janela-e-o-lado-de-fora)) | Capturas de perto nos ângulos mesa, cama e janela sem nada "de caixa" |
| 3 | **Estante "Sobre mim"** com os objetos pessoais ([09](09-estante-sobre-mim.md)), pelúcias, porta | Ângulos nicho e porta aprovados; todos os objetos com nota ≥ 4 |
| 4 | Densidade e acabamento: cabos, detalhes, texturas finais | Painel lado a lado com o Room_Portfolio em que o nosso não perde |

Cada ciclo termina com capturas nos 8 ângulos em `docs/metricas/` e um commit próprio.
