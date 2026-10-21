# Fase 4 — Vitrine e lançamento

O que transforma um site bonito num **projeto de referência**: as pessoas entendem como foi feito, conseguem rodar e querem fazer o seu. Termina com o lançamento no LinkedIn.

**Esforço:** M. **Marco:** M5, "lançado".

---

## 1. README (a porta de entrada do repositório)

- **Inglês como principal** (`README.md`) e **português** (`README.pt-BR.md`), com links cruzados no topo (pergunta P3).
- Sem o template da disciplina. Estrutura:
  1. **Vídeo ou GIF de abertura** com o quarto de dia virando noite e a câmera voando até o monitor;
  2. uma frase do que é + link da demo;
  3. **"How it's built"**: o diagrama do pipeline (código → Blender → site) em Mermaid e 3 imagens do processo (cena exportada, look dev, resultado);
  4. **números de antes e depois**: draw calls, FPS e peso, com as capturas de `docs/metricas/`;
  5. como rodar o site e como rodar o bake;
  6. estrutura de pastas;
  7. créditos e licença.
- Imagens leves (webp) e o vídeo em mp4 curto (até 8 s), hospedado no próprio GitHub.

## 2. Estudo de caso, "Como foi feito"

O texto que faz as pessoas quererem replicar. Fica em `docs/estudo-de-caso/` (EN e PT) e vira um **artigo no LinkedIn** e, se quiser, no dev.to.

Roteiro:

1. **A ideia:** um portfólio que é o meu quarto de verdade.
2. **Versão 1:** o quarto inteiro feito em código (React Three Fiber), a partir das fotos. O que funcionou e o limite que apareceu: luz em tempo real, 495 draw calls, visual "de jogo".
3. **O estudo da referência:** por que salas de portfólio parecem render (o bake).
4. **O pulo do gato:** manter o código como fonte e usar o Blender como compilador. O pipeline passo a passo.
5. **Decisões técnicas:** albedo + lightmaps, máscara de LEDs com cor ao vivo, KTX2, AgX nos dois lados, paredes fantasma.
6. **Conteúdo dentro dos objetos:** a camada HTML sobre as telas e o celular com o app de e-mail.
7. **Antes e depois:** imagens com controle deslizante e os números.
8. **O que eu faria diferente.**

## 3. SEO e compartilhamento

- **Imagem de compartilhamento (Open Graph)** de 1200×630, renderizada **no Cycles** pelo pipeline: o melhor ângulo do quarto, com o nome.
- Título e descrição em dois idiomas (`hreflang`).
- **Conteúdo legível por buscadores:** o modo sem 3D pré-renderizado em HTML no build. O Google lê os projetos e experiências mesmo sem rodar o 3D.
- `sitemap.xml`, `robots.txt`, favicon e ícone para celular.

## 4. Domínio e infraestrutura

- **Domínio próprio** (pergunta P5), configurado na Vercel com HTTPS.
- **Vercel Web Analytics** (sem cookies) para ver visitas e de onde vêm.
- **Lighthouse** rodando no CI com metas mínimas (README do plano, seção 1).
- **Monitorar erros** de WebGL no navegador (um `try/catch` que cai no modo sem 3D e registra o motivo).

## 5. Licença e créditos

- **Código:** MIT (já é).
- **Arte** (GLB e texturas assadas): CC BY 4.0, pergunta P4.
- `docs/creditos.md`: fontes (licença OFL), sons (CC0), ferramentas (Blender, three.js, gltf-transform) e a referência estudada (Room_Portfolio, só como inspiração de técnica).
- Revisar o repositório para garantir que **nada** da referência ou de terceiros sem licença está presente, e que a pasta `referencias/` não subiu.

## 6. Lançamento

**Checklist antes de divulgar:**

- [ ] EmailJS configurado: conta, 2 modelos (mensagem para o Daniel e confirmação para quem enviou), variáveis na Vercel e um teste real de envio
- [ ] Domínio no ar com HTTPS
- [ ] Testado em Chrome, Edge, Firefox e Safari (computador), e em Android e iPhone reais
- [ ] Modo sem 3D testado com WebGL desligado
- [ ] Lighthouse dentro das metas
- [ ] README EN/PT e estudo de caso publicados
- [ ] Vídeo de 30 s para o post (gravado pelo próprio pipeline de capturas)

**Post no LinkedIn:** vídeo curto + o gancho ("fiz o meu quarto em código e ensinei o Blender a iluminar ele sozinho") + link do site + link do estudo de caso. O texto do post é escrito na hora do lançamento.
