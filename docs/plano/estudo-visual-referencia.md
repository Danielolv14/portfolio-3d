# Estudo visual: por que o Room_Portfolio é tão bonito

Estudo de 21/10/2026, feito abrindo o repositório da referência ([AT010303/Room_Portfolio](https://github.com/AT010303/Room_Portfolio), commit `fd7313e`): os modelos `.glb`, as texturas e o shader. O estudo anterior ([plano-room-portfolio.md](plano-room-portfolio.md)) olhou a **interação**. Este olha só a **aparência**: modelagem, luz e cor.

**Licença.** A referência não tem licença. Nada dela entra no projeto. Aqui só descrevemos a técnica.

---

## Resumo em uma frase

O quarto da referência **não é renderizado no navegador**. Ele foi renderizado no Blender (Cycles, com luz física) e a imagem pronta foi "colada" de volta nos objetos. O navegador só mostra uma foto 3D. Por isso ele parece um render de Blender: ele **é** um render de Blender.

---

## 1. O que tem dentro dos arquivos

| | Referência | O nosso |
|---|---|---|
| Malhas do quarto | **2** (`roomFurniture` e `deskShelfStuf`) + cadeira e alguns planos | ~450 |
| Triângulos | ~520 mil | bem menos (primitivas simples) |
| Normais nos vértices | **nenhuma** (só posição e UV) | sim, todas |
| Luzes na cena | **0** | 7 luzes + `Environment` |
| Materiais | 1 shader próprio para tudo | ~73 `meshStandardMaterial` |
| Sombras | pintadas na textura | 1 mapa de sombra 2048² + N8AO |
| Texturas | 3 atlas de 4096² (dia, noite, máscara RGB) | desenhadas em canvas |
| Draw calls | ~44 | ~495 |

O detalhe mais revelador é a **falta de normais**. Sem normais, o three.js não consegue calcular luz nenhuma. A cor de cada pixel vem só da textura.

## 2. Como funciona o "bake" (o segredo principal)

1. O autor modelou o quarto inteiro no Blender.
2. Colocou as luzes no Blender: sol pela janela, luz ambiente, LEDs.
3. Renderizou com o **Cycles**, que simula a luz quicando de verdade (*path tracing*).
4. Em vez de salvar uma imagem da câmera, mandou o Blender "assar" (*bake*) o resultado na superfície de cada objeto. Todos os objetos foram desdobrados (UV) num único quadrado de 4096×4096. Esse quadrado é o **atlas**.
5. Fez isso duas vezes: **dia** e **noite**.
6. Fez um terceiro bake, a **máscara de luz** (`roomTextureLightMap`): o canal vermelho marca onde a fita LED do quadro ilumina, o verde marca a luz da mesa e o azul marca a do PC.
7. No site, um shader de 15 linhas faz o seguinte:
   - `cor = mistura(dia, noite, NightMix)`: a transição de 1 s entre dia e noite é só isso.
   - Para cada canal da máscara, clareia a cor com a cor do LED (`blendLighten`). Por isso dá para trocar a cor dos LEDs ao vivo sem refazer o bake.

O que o Cycles entrega de graça e que o navegador não consegue em tempo real:
- **Luz rebatida (iluminação global):** a parede vermelha tinge o chão de rosa, e o sol da janela faz uma mancha quente no piso que clareia a parede de baixo para cima.
- **Sombras suaves de contato em tudo:** debaixo de cada livro, caneca e pé de móvel.
- **Cantos escurecidos (oclusão de ambiente) de verdade**, não a aproximação de tela do N8AO.
- **Degradê de luz nas paredes:** a parede nunca tem uma cor só. Ela vai de clara (perto da luz) a escura (longe). Isso dá profundidade.

Custo no navegador: quase zero. Não há luz nem sombra para calcular, por isso roda liso até em celular fraco.

## 3. Modelagem

- **Toda aresta é chanfrada (bevel).** Nada no mundo real tem quina perfeita. O chanfro pega um filete de luz e é isso que faz o objeto "parecer de verdade". No nosso, 51 dos objetos são `Box` com quina viva, contra 35 `Rounded`.
- **Formas orgânicas:** pufe, almofadas e edredom com volume e dobras, folhas da planta recortadas, cadeira gamer com curvas. Isso só se faz bem com modelagem (subdivisão, escultura e simulação de tecido), não com caixas e cilindros.
- **Densidade boa de pequenos objetos:** livros, cubo mágico, pokébola, canecas, porta-lápis, xadrez e polaroids. Eles estão distribuídos em **camadas de altura**: chão (pufe, planta), meio (mesa, cama, rack) e alto (prateleiras, relógio, quadro). O olho sempre tem algo para ver.
- **Padrões em tecido:** edredom estampado, pufe com manchas. Quebram as áreas grandes de cor lisa.

## 4. Direção de arte (cor e contraste)

- **Contraste de valor:** a parede branca e a parede vermelha escura ficam lado a lado, com piso de madeira laranja e móveis pretos. Há pretos e brancos de verdade na imagem.
- **Quente contra frio:** o interior é todo quente (laranja, rosa, vermelho) sobre um fundo roxo-escuro frio (`#1f1635 → #100a1d`). O quarto "salta" do fundo como uma maquete iluminada.
- **Uma cor de destaque forte:** a parede vermelha dá personalidade à imagem inteira.
- **Brilho só onde importa:** a janela tem cor acima de 1 (`[2, 0.8, 0.5]` de dia, `[0.6, 0.8, 3]` à noite) com `toneMapped={false}`, e o Bloom transforma isso num brilho. Os LEDs também passam de 1.

## 5. Comparando com o nosso (capturas de 21/10)

O nosso quarto já tem a câmera certa (fov 35, maquete sobre fundo) e muitos detalhes fiéis ao quarto real. O que nos separa da referência, em ordem de impacto:

1. **A luz é "achatada" de dia.** Tudo recebe quase a mesma luz: paredes bege lisas, piso claro e fundo bege. Falta o degradê (claro perto da janela, escuro nos cantos) e as sombras de contato. À noite isso melhora muito, porque as luzes pontuais criam contraste.
2. **De dia, o quarto se confunde com o fundo.** Bege sobre bege, com pouco contraste de valor.
3. **Quinas vivas** em boa parte dos móveis.
4. **A janela é uma imagem chapada**, não uma fonte de luz que brilha.
5. **Objetos orgânicos** (edredom, pelúcias, travesseiros) são formas geométricas simples.

## 6. O que dá para fazer antes de 02/11, sem Blender

Mantém a decisão de melhorar a luz no navegador agora e fazer o bake depois. Em ordem de custo e benefício:

| # | O quê | Por que ajuda | Esforço |
|---|---|---|---|
| 1 | **"Bake pintado" nas texturas de canvas:** desenhar nas texturas da parede e do piso um degradê de luz (mancha quente da janela no chão, cantos e rodapé mais escuros, sombra suave atrás dos móveis grandes) | Imita a luz rebatida e a oclusão do Cycles. Custo zero no desempenho | P–M |
| 2 | **Baixar a luz de preenchimento** (`hemisphereLight` e `Environment`) e **subir a luz-chave da janela**, para criar lados claros e escuros | Cria contraste e volume. Hoje a luz uniforme apaga as formas | P |
| 3 | **Sombras de contato:** `ContactShadows` do drei, ou planos com degradê radial debaixo de cama, mesa, criado-mudo, tênis e mochila | Os objetos "pousam" no chão em vez de flutuar | P |
| 4 | **Janela que brilha:** vidro com `meshBasicMaterial`, `toneMapped={false}` e cor acima de 1. Quente de dia, azul à noite | O Bloom passa a desenhar um halo de luz real (já previsto em E11) | P |
| 5 | **Chanfro em todas as caixas visíveis:** trocar `Box` por `Rounded` com raio pequeno (0,01–0,03) nos móveis e molduras | Filete de luz nas quinas, "cara de objeto real". Não aumenta draw calls | P–M |
| 6 | **Fundo de dia com mais contraste:** um bege mais escuro ou um degradê, para o quarto claro se destacar | O efeito "maquete" fica mais forte | P |
| 7 | Mais **estampa e textura** em tecidos (edredom, tapete, almofadas) e mais **pequenos objetos** nas camadas média e alta | Quebra áreas lisas e dá algo para o olho explorar | M |

Os itens 1 a 4 sozinhos já resolvem boa parte da diferença percebida. São o que a luz do Cycles faz, aproximado à mão.

## 7. Depois de 02/11: o caminho para chegar ao nível dela

O salto real só vem com o fluxo da referência:

1. Exportar o quarto (já pronto em código) para o Blender, ou remodelar as peças principais lá, com bevel e subdivisão.
2. Desdobrar UVs num atlas e fazer o bake no Cycles: **dia**, **noite** e **máscara dos LEDs** (RGB magenta, monitor, luminária "&").
3. Voltar com um `.glb` comprimido (Draco) e texturas `.webp`, e trocar as partes estáticas por essa malha com um shader de mistura dia/noite. Os objetos clicáveis, as telas e o celular continuam como hoje.
4. Resultado esperado: visual de render e draw calls caindo de ~495 para poucas dezenas.

Ponto de atenção: qualquer mudança de geometria depois do bake obriga a refazer o bake. Por isso é a última etapa, com o quarto já "congelado".
