# Estudo: por que o nosso bake não fica como o Room_Portfolio

21/10/2026. Pedido do Daniel: "o resultado está longe do que eu quero; estude por que não está dando certo e, se for o caso, refaça do zero". Este estudo compara o nosso pipeline com a referência por **evidência** (capturas, contagens e experimentos), não por impressão.

## 1. O que a referência faz (e nós não)

| | Room_Portfolio | O nosso (até 21/10) |
|---|---|---|
| Onde o quarto é modelado | No Blender, à mão, malhas inteiriças | No código (React), com caixas e cilindros |
| UV do bake | Feito com intenção, poucas ilhas grandes | Automático sobre peças "soltas": **quase uma ilha por face** |
| O que é assado | Cor + luz juntas, num atlas 4096 | Só a luz, em 9 atlas 2048 (as texturas originais ficam à parte) |
| Materiais | Quase só **cores lisas**; textura só onde conta | Texturas "realistas" desenhadas em canvas (madeira, piso, parede) |
| Quinas | Todas chanfradas | Quase todas vivas |
| Câmera | **Presa:** 90° de giro, nunca na altura dos olhos, close-up só de frente para as telas (que são HTML) | Livre: chega perto e na altura dos olhos de qualquer objeto |
| Paleta | Composta para ser bonita (parede vermelha de destaque, branco, madeira) | Cópia do quarto real (bege sobre bege) |

## 2. Evidências

### 2.1 O render do Blender é bonito; o site não

A imagem do Cycles do **nosso próprio quarto, sem mudar nada**, sai limpa: sem manchas, sem quadriculado, com sombras suaves. O mesmo quarto no site sai manchado e serrilhado. **Conclusão: a cena e a luz estão boas; o problema está na passagem do Blender para o site (o bake).**

### 2.2 Quase uma ilha de UV por face

Contagem de ilhas no atlas de luz (`cena.blend`, 21/10):

| Grupo | Faces | Ilhas |
|---|---|---|
| shell (paredes, piso, porta, janela) | 2.142 | **1.823** |
| furniture-bed | 65.528 | 16.508 |
| furniture-niche | 9.212 | 9.142 |
| props-niche | 74.387 | 42.329 |
| cadeira | 27.016 | **27.016** |

**Por quê:** as geometrias do three.js (`BoxGeometry` etc.) mandam cada face com os seus próprios vértices. No Blender, nada está "grudado", e o desdobramento automático não consegue juntar faces vizinhas. Cada face vira uma ilha e precisa de margem em volta.

**Consequências, exatamente as que o Daniel viu:**
- pouca resolução de luz: o atlas se gasta em margens;
- **emenda em toda aresta**: degraus e quadriculado onde uma face encontra a outra;
- **manchas**: o denoise trabalha sobre milhares de pedacinhos isolados.

O plano previa "juntar vértices duplicados" na etapa de limpeza, e isso ficou de fora do pipeline. Foi o erro de base.

### 2.3 Estilo: o mesmo quarto, com cores lisas e chanfros

Experimento (`pipeline/teste/estilo.py`): mesma cena e mesma luz, mas texturas trocadas pela cor média delas e chanfro em todas as peças. O resultado fica mais "maquete" e mais limpo, mas perde a identidade (pôsteres e rótulos). **Conclusão: o estilo ajuda, mas não é a causa principal; a causa principal é o 2.2.**

### 2.4 A câmera presa esconde o que o bake não sustenta

Na referência, o usuário nunca vê um objeto de perto, a não ser as telas, que são HTML nítido. A resolução de qualquer bake (o nosso ou o dela) tem um limite; a referência simplesmente não deixa a câmera chegar lá.

## 3. Resultado do teste: soldar os vértices

`cena.soldar()` junta os vértices repetidos (`remove_doubles`) e marca as arestas com mais de 30° como vivas, antes do UV:

| Grupo | Ilhas antes | Ilhas depois |
|---|---|---|
| shell | 1.823 | **562** |
| furniture-desk | 1.748 | **352** |
| furniture-niche | 9.142 | **1.134** |
| furniture-bed | 16.508 | **6.278** |
| props-niche | 42.329 | **14.466** |
| cadeira | 27.016 | **4.250** |

Mesmo no preview (metade da resolução, 64 amostras), parede e porta saem com sombreado contínuo. **O bake final com a solda é o novo ponto de partida.**

Ainda sobram muitas ilhas nos objetos pequenos, porque peças diferentes se encostam e se atravessam (caixas sobrepostas no código). Isso só se resolve com malhas modeladas de verdade.

## 4. Diagnóstico final

O que separa o nosso quarto do Room_Portfolio, em ordem:

1. **Bake sobre geometria solta** (resolvido em parte pela solda).
2. **A fonte da geometria:** caixas e cilindros do código, que se atravessam, não têm chanfro e não têm topologia pensada para UV. Limita o bake e a beleza das formas. A referência foi modelada no Blender.
3. **Câmera livre** demais para o que qualquer bake sustenta.
4. **Estilo misturado:** texturas "realistas" de canvas em formas simples, que dão o aspecto de "massinha".
5. **Paleta** sem uma cor de destaque.

## 5. Proposta: refazer do zero o que precisa, aproveitar o resto

O que **fica** (funciona e é bom): o site (telas imersivas, seções, modo sem 3D, interação), o pipeline de bake (luz de dia e de noite, máscara de LEDs, reflexos, retry, WebP q98) e a câmera e os pontos de vista (com limites novos).

O que **é refeito do zero**: **a modelagem do quarto passa a ser feita no Blender**, por scripts Python versionados (`pipeline/blender/modelos/`), um por objeto, e não mais com caixas do React.

- Malhas inteiriças, chanfradas, sem peças atravessando.
- **UV de luz feito à mão no script** (poucas ilhas grandes), em vez do automático.
- Estilo **maquete estilizada**, como a referência: cores lisas e bem escolhidas, textura só onde conta (pôsteres, telas, capas, estampas).
- Tecidos (edredom, travesseiros) por simulação de pano.
- O quarto em código fica só com o que é interação: áreas de clique, telas e etiquetas.

**Câmera** com limites como a referência: giro limitado, sem altura dos olhos, zoom curto. Close-up só nas telas e na estante.

**Como fazer sem arriscar:**
1. **Fatia vertical:** remodelar só a parede da mesa (painel, TV, mesa, gabinete, monitor, cadeira) no novo método.
2. Comparar com a referência.
3. Só depois de aprovado, refazer o resto do quarto (cama, nicho, chão, estrutura), área por área.
