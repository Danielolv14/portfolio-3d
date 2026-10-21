# Desenho da luz

A luz é a principal ferramenta de direção de arte. É ela que separa "modelo 3D" de "render bonito". Este documento define **como** o quarto vai ser iluminado no Blender. Os valores exatos saem do ciclo de *look dev* (seção 6) e ficam em `pipeline/config/bake.json`.

---

## 1. Dois climas

| | **Dia: fim de tarde** (recomendado, pergunta P6) | **Noite: aconchego com neon** |
|---|---|---|
| Sensação | Sol baixo e dourado entrando pela janela, quarto quente e calmo | Quarto escuro, ilhas de luz quente e o rosa do RGB |
| Luz principal | Sol a ~25–30° de altura, entrando pela janela da parede B | **Luminária de cobre do criado-mudo** (quente, ao lado da cama) e **luminária da TV** (a light bar em cima da TV, fria, banhando o painel de madeira) |
| Luz secundária | Céu azulado pela janela (sombras levemente frias) | Lua azul fraca pela janela, telas e RGB |
| Contraste | Mancha de sol forte no chão; cantos em penumbra | Alto: áreas quase pretas entre as fontes |
| Paleta da luz | Âmbar contra azul-acinzentado | Âmbar contra magenta contra azul |

O contraste **quente contra frio** dentro da mesma imagem é o que dá profundidade. Nada de luz branca neutra vinda de todos os lados, como hoje.

## 2. Geometria da luz no quarto

- A janela fica na **parede B** (z = −5), entre x = −2,5 e 0,3, acima da cama. A câmera da visão geral olha de +x e +z, então vê a parede B de frente.
- **O sol deve entrar pela janela e desenhar uma mancha no chão e na lateral da cama, visível da câmera principal.** A direção exata é ajustada no look dev. Ponto de partida: raios andando para +z e um pouco para +x, com altura de 25–30°.
- **A persiana** (já existe no modelo) corta o sol em listras. As **listras de luz no chão** são um detalhe que faz muita diferença e só sai bem com o Cycles.
- **Paredes fantasma (T2):** as duas paredes da frente e o teto, que o site não desenha, existem no Blender durante o bake. Assim a luz só entra pela janela e rebate dentro do quarto, como num quarto de verdade. Sem elas, o céu entraria pelos lados abertos e lavaria tudo. Elas não são exportadas.
- **Portal na janela:** uma *area light* do tipo portal na abertura ajuda o Cycles a achar a luz do céu, o que dá menos ruído com menos amostras.
- **Vidro da janela:** invisível para os raios de sombra no bake. No site ele volta como `glass-window`, com reflexo.

## 3. Rig de dia

| Luz | Tipo no Blender | Valor inicial | Observação |
|---|---|---|---|
| Céu | *Sky Texture* (Nishita), sol a 28° | força 1,0 | Dá a luz azulada e a cor do sol |
| Sol | *Sun lamp* alinhado com o céu | 4–6 W/m², ângulo 1,5° | O ângulo controla a maciez da borda da sombra |
| Portal | *Area light* com portal | — | Só ajuda a amostragem |
| RGB do gabinete | Emissão | fraco (0,5) | Fica no canal B da máscara, então é ajustável ao vivo |

## 4. Rig de noite

**Decisão do Daniel (21/10):** à noite, a luz fica focada na **luminária ao lado da cama** e na **luminária em cima da TV**. A luminária "&" da prateleira deixa de ser fonte principal, porque a estante vai ser refeita como o "Sobre mim" ([09](09-estante-sobre-mim.md)). Ela pode continuar acesa como detalhe, bem fraca.

A luz de noite é dividida em duas partes: a **base**, assada no lightmap da noite, e as **fontes ajustáveis**, assadas na máscara, uma por canal, e somadas no site.

**Base (lightmap da noite):**

| Luz | Tipo | Cor (aprox.) | Observação |
|---|---|---|---|
| Céu noturno | Cor de fundo do mundo | `#1a2238`, bem fraca | Só para os cantos não ficarem pretos puros |
| Lua | *Sun lamp* | `#9fb2ff`, fraca | Recorte azul da janela no chão |
| Relógio LCD | Emissão | fraquinha | Detalhe |

**Fontes ajustáveis (máscara RGB):**

| Canal | Fonte | Cor padrão | O que dá para fazer no site |
|---|---|---|---|
| **R** | **Luminária de cobre do criado-mudo** (principal, quente) | 2400 K `#ff9a4d` | Acender e apagar com o interruptor; um leve tremor ao ligar |
| **G** | **Luminária da TV** (light bar com o LED para baixo; principal, fria) + telas | `#eef3ff` | Acompanhar a cor do conteúdo aberto na TV e no monitor |
| **B** | RGB do gabinete + teclado (apoio) | `#ff3fd2` | Trocar a cor do RGB (ideia de interação) |

A luminária "&" fica na base da noite, como um brilho fraco e decorativo.

Cada fonte é assada sozinha, branca e com força 1. No site: `luz += máscara × cor × potência`. A conta é física, então a cor rosa ilumina a parede de rosa do jeito certo.

## 5. Cor, exposição e tone mapping

- **Fluxo linear do começo ao fim:** o Cycles assa valores lineares em float. O tone mapping só acontece no fim, no site.
- **AgX nos dois lados:** o Blender 4.5 usa AgX por padrão, e o three.js tem `AgXToneMapping`. Usar o mesmo nos dois faz o render do look dev e o site combinarem. Esse é o teste "Cor" da prova de conceito.
- **Exposição por clima:** `uExposure` diferente de dia e de noite, animado na troca. Assim a noite não precisa ser assada "clara demais".
- **Brilho (Bloom) só no que passa de 1:** lâmpadas, LEDs, o vidro da janela de dia e as telas à noite. Limiar do Bloom continua em 1.
- **Teste em tons de cinza:** toda captura final também é vista em preto e branco. Se as formas não se leem sem cor, falta contraste de valor, e se corrige na luz, não na saturação.

## 6. Ciclo de look dev (ajustar a luz sem assar)

Assar leva tempo, mas ajustar luz precisa ser rápido. Por isso existe um modo só de render:

```bash
npm run lookdev
```

- Usa a mesma cena montada pelo pipeline (etapas 00–60).
- Renderiza **imagens** do Cycles (não bake) pelos 8 pontos de câmera do site, em 640 px, com 128 amostras e denoise. Leva 1–3 minutos.
- Monta um painel `pipeline/.cache/lookdev.html` com as imagens lado a lado, de dia e de noite.
- Ajustar = editar os valores das luzes no `bake.json` e rodar de novo.
- Quando o painel estiver bonito, roda o bake.

## 7. A janela e o lado de fora

Ideia do Daniel (21/10): a vista de hoje parece **uma imagem parada**. Vira uma **paisagem viva, com profundidade**.

**Vista em camadas com paralaxe.** Atrás da janela, 4–5 planos em distâncias diferentes, que se deslocam entre si quando a câmera gira. Assim a vista parece um lugar de verdade, não um adesivo.

| Camada | Distância | Conteúdo |
|---|---|---|
| Perto | logo atrás do vidro | Galho de árvore ou parapeito do prédio vizinho, em silhueta |
| Meio | média | Prédios e casas baixos, com janelas que acendem à noite |
| Longe | grande | Horizonte de Belo Horizonte com a **Serra do Curral** estilizada (pergunta P12) |
| Céu | fundo | Degradê do céu, sol ou lua, nuvens |

**Céu vivo:**
- nuvens em movimento lento (shader com ruído, barato);
- de dia, o sol do tamanho e na posição coerentes com a luz assada (a mancha no chão "vem" dele);
- à noite, estrelas cintilando, a lua e as janelas dos prédios acendendo aos poucos, uma a uma, durante a transição;
- de vez em quando, um avião piscando ou pássaros passando (raro, para surpreender).

**Luz coerente:**
- **de dia**, o vidro vira uma fonte acima de 1 (âmbar quente) e o Bloom faz o halo de luz entrando;
- **à noite**, o brilho da cidade dá um leve tom alaranjado no horizonte.

**Como é feita:** as camadas são renderizadas no Blender pelo próprio pipeline (prédios e serra gerados por script), ou pintadas em canvas. É tudo nosso, nada baixado. No site, são planos com textura e um shader de nuvens, com custo de poucas draw calls.

Se o Daniel preferir, a vista pode lembrar a **vista real da janela dele** (pergunta P12).

## 8. Transição entre dia e noite

Hoje tudo muda junto. A versão nova vira uma **sequência** de cerca de 1,5 s:

1. O sol baixa: `uNight` vai de 0 a 1 e a exposição se ajusta.
2. Com um pequeno atraso, a luminária da cabeceira acende (canal R, com uma leve tremida) e logo depois a luminária da TV (canal G).
3. O RGB do gabinete ganha força por último.

No sentido contrário, as luzes se apagam primeiro e o sol volta depois. O interruptor da luminária "&" tem uma animação de mola (ver [05](05-experiencia.md)).

**Opcional:** um terceiro clima, **pôr do sol**, como um segundo lightmap de dia, e o clima inicial escolhido pelo **horário local do visitante**. Fica na [lista de ideias](07-ideias.md).

## 9. Reflexos

- Metal (cadeira cromada, maçaneta, botão do teclado) e vidro (janela, telas desligadas, porta-retrato) refletem o **cubemap assado** do quarto, de dia e de noite, misturados pelo `uNight`.
- O porcelanato do piso pode ganhar um brilho suave opcional. Fica para avaliar no look dev, porque reflexo em tempo real custa caro no celular.
