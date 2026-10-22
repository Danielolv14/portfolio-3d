# A estante "Sobre mim"

Ideia do Daniel (21/10): o nicho (onde ficam a luminária "&" e o porta-retrato) vira **a parte do quarto que conta quem ele é**. Cada objeto na estante representa algo dele (séries, jogos, esportes, música, fé, cidade, conquistas), como a Pokébola do Room_Portfolio mostra que o autor gosta de Pokémon.

Entra na **Fase 2** (objetos) e na **Fase 3** (interação), como a trilha **3b — Estante**.

---

## 1. Conceito

- **A estante é o "Sobre mim".** Hoje o porta-retrato abre um painel de texto. Na versão nova, a câmera para de frente para a estante e cada objeto conta uma parte da história.
- **Objetos com significado, não decoração.** Cada objeto tem uma frase: "por que isso está aqui".
- **Quatro níveis, quatro temas** (sugestão, ajustada com as respostas do Daniel):

| Nível | Tema | Exemplos (a confirmar) |
|---|---|---|
| Topo | **O que eu faço**: tecnologia e carreira | Robô (já existe), um mini servidor ou rack, a caneca da PUC, o crachá da Teknisa |
| 2º | **O que me move**: música e DJ | Luminária "&" (já existe), JBL (já existe), mini toca-discos ou controladora, fone |
| 3º | **Quem eu sou**: foto e conquistas | Porta-retrato (já existe), troféu (já existe), Stormtrooper (já existe, Star Wars) |
| Base | **O que eu curto**: séries, jogos, esportes | Pelúcias (já existem), objetos das séries e jogos favoritos, bola, item do time |

## 2. Interação

1. **Clique no porta-retrato ou em "Sobre mim" no menu:** a câmera para de frente para a estante (modo estante), como faz no monitor.
2. **Passar o mouse num objeto:** ele ganha contorno e uma etiqueta com o nome ("Stormtrooper").
3. **Clicar no objeto:** a câmera chega um pouco mais perto e abre um **cartão** ao lado, com título, uma frase pessoal e, quando fizer sentido, um link (ex.: a série no catálogo, a playlist, o time).
4. **Setas ou Tab** passam de um objeto para outro; **Esc** volta.
5. **"Ler tudo":** abre o texto completo do Sobre mim (formação, objetivos, PT/EN), que continua existindo para quem quer ler direto e para o modo sem 3D.

No modo sem 3D e no celular, a estante vira uma **grade de cartões** com a ilustração de cada objeto e a frase.

## 3. Regras para os objetos

- **Modelados por nós** (script no Blender ou à mão), nunca baixados.
- **Sem logos nem arte oficial.** O objeto lembra o tema pela forma e pela cor, como fan art estilizada:
  - um capacete estilizado, não o logo de Star Wars;
  - uma bola vermelha e branca genérica, não o logotipo de Pokémon;
  - as cores do time, não o escudo oficial.
- **Escala e estilo iguais ao resto do quarto:** formas limpas, chanfradas, materiais assados.
- **Base real:** o que existe no quarto de verdade fica. O que for acrescentado é escolhido pelo Daniel e marcado como "acrescentado" no inventário.

## 4. O que o Daniel precisa mandar (pergunta P8)

Uma lista curta, com uma frase por item:

- 3–5 **séries ou filmes** favoritos;
- 2–3 **jogos**;
- **esportes** e **time**;
- **música**: estilos, artistas e o lado DJ;
- **hobbies** e coisas do dia a dia;
- **valores** ou algo que define ele (fé, família, cidade);
- **conquistas** de que se orgulha (o troféu é de quê?).

Com a lista, o plano escolhe 10–14 objetos (o espaço da estante comporta isso sem ficar poluído) e mostra um esboço antes de modelar.

**Respostas de 21/10 (P8, parcial).** A estante agora é aberta, de metal preto com prateleiras de carvalho (decisão 14, `pipeline/blender/modelos/nicho.py`). Objetos escolhidos, todos modelados por nós e sem logos nem arte oficial (cada um ganha uma frase do Daniel):

| Tema | Objeto | Como fica sem marca |
|---|---|---|
| Dev | Patinho de borracha | Patinho amarelo ("explico o bug pro pato") |
| Dev | Livros de arquitetura | Pilha com lombadas só com os títulos (Clean Code, Clean Architecture, DDD) |
| Dev | Caneca de café | Caneca com `while (alive) code();` |
| Dev | Crachá do estágio | Crachá só com texto, sem o logo da empresa |
| DJ | Credenciais de show | Crachás/pulseiras "BACKSTAGE" dos shows do DRUDS e do Braichi |
| DJ | Pen drives | Ao lado da XDJ, no cantinho DJ (`modelos/frente.py`) |
| Séries | Harry Potter | Varinha num suporte e óculos redondos |
| Séries | Game of Thrones | Ovo de dragão decorativo |
| Séries | Breaking Bad | Chapéu preto (pork pie) e um frasco de laboratório azul |

No chão: o **tênis Dunk "White Lobster"** dele (silhueta e cores, sem o símbolo da marca) e a **bola de futevôlei Mikasa amarela** (sem logo). Fora da estante, já modelados: **XDJ-RX3** e **PS5** (formas, sem marca). Os objetos orgânicos e pessoais (roupa de cama, pelúcias, mochila, tênis, bola, objetos da estante) esperam as fotos que o Daniel manda.

## 5. Ordem de construção

| Passo | Entrega | Esforço |
|---|---|---|
| 1 | Lista do Daniel → seleção de objetos e frases (PT/EN) em `content` | P |
| 2 | Esboço da composição da estante (captura com caixas no lugar dos objetos) | P |
| 3 | Modelagem dos objetos novos e revisão dos atuais | G |
| 4 | Modo estante: câmera, hover, cartões e teclado | M |
| 5 | Grade de cartões para o modo sem 3D e o celular | M |
