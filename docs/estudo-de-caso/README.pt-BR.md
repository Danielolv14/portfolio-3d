# Como fiz o meu quarto virar um portfólio em 3D

**[English](README.md)** · Site: [www.danielolv.dev](https://www.danielolv.dev) · Código: [github.com/Danielolv14/portfolio-3d](https://github.com/Danielolv14/portfolio-3d)

Em vez de uma página de rolagem, o meu portfólio é o meu quarto de verdade, refeito em 3D. O monitor abre os projetos (num perfil no estilo do GitHub), a TV abre as experiências (no estilo do LinkedIn), o celular em cima da cama abre o contato e o porta-retrato abre o "Sobre mim". Este texto conta como ele saiu de um trabalho da faculdade para o que está no ar hoje, e o que eu aprendi no caminho.

![As quatro fases do quarto: em código, o primeiro bake, a maquete e o final](imagens/fases.jpg)

## 1. A ideia

Começou como o LAB01 da disciplina de Desenvolvimento e Integração de Aplicações Web, na PUC Minas: um portfólio com Sobre mim, Projetos, Experiências e Contato. Quase todo mundo faz uma página de rolagem. Eu quis fazer algo que ninguém esquecesse: o lugar onde eu realmente programo, com cada objeto contando uma parte de mim.

## 2. Versão 1: o quarto inteiro em código

A primeira versão foi feita toda em React Three Fiber, a partir de fotos do quarto: paredes, mesa, cama, estante, teclado tecla por tecla, cada objeto com formas simples e texturas desenhadas em `<canvas>`.

Funcionou, e foi entregue para a disciplina. Mas apareceram dois limites:

- **Visual de jogo.** Com luz em tempo real, o quarto não tinha a luz rebatendo nas paredes nem as sombras suaves de um ambiente de verdade. Parecia um jogo antigo, não uma foto.
- **Pesado.** Eram 422 malhas, 8 luzes e 309 objetos fazendo sombra: **459 draw calls** e **37 FPS** num celular simulado (CPU 4 vezes mais lenta).

## 3. Por que os quartos bonitos parecem render

Estudando portfólios em 3D que pareciam uma foto, a resposta era sempre a mesma: **a luz não é calculada no navegador**. Ela é "assada" (baked) antes, num programa 3D como o Blender, com a iluminação global de verdade, e o site só pinta essas texturas de luz. O navegador quase não trabalha, e a imagem fica com cara de render.

O problema: quem faz assim costuma modelar tudo à mão no Blender, e eu tinha um quarto inteiro em código, com cliques, telas e animações que eu não queria perder.

## 4. O pulo do gato: o código como fonte e o Blender como compilador

Eu não troquei o código pelo Blender. Fiz o Blender **compilar** o quarto que já existia:

1. **Marcar a cena.** Cada peça do quarto em React fica dentro de um componente `<Bake group kind>`, que diz se ela é parede, móvel ou objeto e se é fixa, clicável, uma tela ao vivo ou vidro. Isso vai para o GLB junto com a malha.
2. **Exportar.** Um script abre o site com o Playwright e exporta a cena montada para GLB.
3. **Modelar e vestir.** Scripts Python no Blender 4.5 trocam algumas áreas por modelos mais detalhados (a estante de metal, a mesa, a cama), aplicam texturas de foto CC0 do Poly Haven puxadas para a paleta do quarto e trazem modelos prontos do Sketchfab (CC BY), já convertidos para o tamanho real, com menos polígonos.
4. **Assar a luz no Cycles** em três mapas: o **dia** (fim de tarde dourado), a **noite** e uma **máscara dos LEDs**, em que cada canal de cor é uma fonte de luz (a fita atrás da cabeceira, a luminária da TV e o RGB do gabinete). No site, a cor dos LEDs é misturada ao vivo.
5. **Otimizar e publicar.** O resultado volta como GLB com Draco e texturas WebP, numa versão para o computador e outra mais leve para o celular.

O bake completo leva cerca de 50 minutos numa GPU NVIDIA. Para ajustar, uso uma **prévia rápida** (de 40 segundos a 2 minutos) com câmeras fixas, comparando com uma imagem-alvo. O Cycles às vezes cai sozinho ao preparar as malhas, então o script tenta até 3 vezes.

## 5. Decisões que fizeram diferença

- **A camada de interação invisível.** O quarto em código continua montado, só que escondido, na mesma cena. O raycaster do three.js acerta malhas invisíveis, então cliques, etiquetas e hover continuam vindo do código. Quando algo se mexe (a cadeira sai do caminho da câmera), a peça assada copia o movimento: a matriz dela é o mundo atual da peça do código vezes o inverso do mundo dela na hora do bake.
- **Cor nítida e luz separada.** No começo, a cor também era assada num atlas dividido por dezenas de objetos, e os objetos pequenos ficavam borrados. Agora cada objeto usa a própria textura de cor, e o bake guarda só a luz.
- **O mesmo tone mapping dos dois lados.** AgX no Blender e no three.js: a cor que eu aprovo na prévia é a que aparece no site.
- **Telas que são páginas de verdade.** Quando a câmera para na frente do monitor, da TV ou do celular, uma camada HTML é posta exatamente sobre a tela 3D, com os cantos projetados a cada quadro. Antes disso, uma textura em canvas desenha a mesma página, com as cores calibradas para sair igual depois do tone mapping, e a troca não dá salto.
- **Carregar antes de precisar.** O download do quarto começa no `main.jsx`, antes do React e do three.js, com uma barra de progresso pelos bytes do GLB. Cada arquivo leva a versão do bake na URL e fica um ano em cache.

## 6. O conteúdo dentro dos objetos

- **Monitor = Projetos**, no estilo do meu perfil do GitHub como ele está hoje. Antes de cada build, um script busca o perfil, os fixados, o README do perfil, a foto e o gráfico de contribuições. Se o GitHub estiver fora, vale a última cópia salva.
- **TV = Experiências**, no estilo do meu LinkedIn: experiência, formação, certificados e competências, com tema claro de dia e escuro à noite.
- **Celular = Contato**, numa tela inicial no estilo do iPhone. O app E-mail é um formulário de verdade (EmailJS), com uma resposta automática que não repete a mensagem, para o formulário não virar um jeito de mandar spam.
- **A janela é viva:** sol de fim de tarde de dia e cidade chuvosa à noite, desenhados ao vivo.
- **Modo sem 3D**, com o mesmo conteúdo em página comum, para celulares fracos e leitores de tela.

## 7. Antes e depois

| | Versão 1 (em código) | Primeiro bake | Hoje |
| --- | --- | --- | --- |
| Draw calls | 459 | 38 | 162 |
| FPS no celular simulado (CPU 4×) | 37 | 168 | 87 |
| Luz | 8 luzes em tempo real | assada (dia, noite, LEDs) | assada (dia, noite, LEDs) |

O primeiro bake foi o mais leve, mas tudo ali eram formas simples com cores lisas. Hoje o quarto tem modelos e texturas de verdade, cada objeto com a própria cor nítida, e mesmo assim roda bem mais que o dobro de quadros da versão 1 no celular simulado. O GLB tem 11,8 MB no computador e 5,2 MB no celular.

![O quarto hoje, de noite](imagens/5-final-noite.jpg)

## 8. O que eu aprendi (e faria diferente)

- **Uma imagem-alvo antes de modelar.** A fase de maquete, com chanfros e cores lisas, ficou com "cara de massinha" e foi descartada. Só quando eu fixei uma imagem-alvo realista é que as rodadas de ajuste passaram a convergir.
- **O código como fonte da verdade vale a pena.** Refazer o quarto inteiro é um comando, e o layout, os cliques e as telas nunca saíram do React.
- **Tone mapping engana.** Com o AgX, um amarelo puro sob o sol vira creme. A bola de futevôlei só ficou com o amarelo-limão certo com uma cor de entrada mais escura.
- **Olhe os dados, não só a imagem.** Para reproduzir o desenho da minha bola (uma Mikasa FT-5), mapeei as cores da foto numa grade de texto: são 32 triângulos em xadrez (um octaedro com cada face dividida em 4), e não os 8 que eu tinha chutado.
- **Licenças desde o começo.** Os modelos CC BY exigem crédito visível, então o site tem um botão de créditos. E a referência que eu estudei não tem licença: só as técnicas foram estudadas, nada foi copiado.
- **O que ainda falta:** texturas em KTX2 (mais leves na placa de vídeo), o Lighthouse rodando no CI e testes em mais celulares de verdade.

---

**Tecnologias:** React 18, Vite 6, three.js, React Three Fiber, drei, camera-controls, postprocessing, EmailJS, Blender 4.5 (Python e Cycles), Playwright e Vercel.

**Daniel Oliveira de Menezes**: [LinkedIn](https://www.linkedin.com/in/daniel-oliveira14/) · [GitHub](https://github.com/Danielolv14) · [danielolv.dev](https://www.danielolv.dev)
