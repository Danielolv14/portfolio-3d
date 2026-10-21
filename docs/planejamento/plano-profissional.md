# Plano da versão profissional

Começou em 21/10/2026, depois que o trabalho da faculdade foi entregue e avaliado. Não há prazos. A meta é qualidade de **projeto de referência**: um quarto 3D com cara de render, que as pessoas vejam e queiram replicar.

Decisões de 21/10:
- **Visual:** bake no Blender por script. O quarto continua sendo feito em código, e um pipeline automático gera a luz assada.
- **Fidelidade:** a base é o quarto real, com liberdade de direção de arte (tons, contraste, detalhes).
- **Replicar:** vitrine com estudo de caso. O repositório é caprichado em inglês e português, com um texto explicando como foi feito.

O porquê técnico está em [estudo-visual-room-portfolio.md](estudo-visual-room-portfolio.md).

---

## Fase 1 — Pipeline de bake (o coração do salto visual)

Ideia: a cena em código vira a "fonte". Um comando exporta, assa no Cycles e devolve um GLB pronto. Mudou um móvel? Roda o comando de novo.

```
código (R3F) ──exporta──▶ quarto.glb ──Blender headless + Cycles──▶ quarto-baked.glb + dia.webp + noite.webp + leds.webp ──▶ site
```

1. **Instalar o Blender 4.2 LTS** (a GTX 1660 Super roda o Cycles por CUDA).
2. **Separar o que é estático do que mexe.**
   - Estático (vai para o bake): paredes, piso, móveis, nicho e decoração.
   - Dinâmico (fica como hoje): telas, celular, cadeira (se girar), relógio, luminária "&" e etiquetas.
   - Marcar com `userData.bake` nos componentes de `src/room/`.
3. **Exportar a cena:** um script (`scripts/bake/exportar.mjs`) abre o site no Edge, roda o `GLTFExporter` só nas partes estáticas e salva `bake/quarto.glb`.
4. **Assar no Blender:** um script Python (`scripts/bake/bake.py`), rodado com `blender -b -P`, faz:
   - **Chanfro automático** (modificador Bevel por ângulo, bem pequeno) nas peças rígidas;
   - converte cores e texturas em materiais do Cycles;
   - desdobra tudo num atlas UV único;
   - monta as luzes de **dia** (sol pela janela e céu) e de **noite** (luminária, RGB e monitor);
   - assa dia, noite e uma **máscara RGB dos LEDs** (R = RGB do gabinete, G = luminária "&", B = monitor e TV), com denoise;
   - exporta o GLB comprimido (Draco) e as texturas em webp.
5. **No site:** um material próprio com 3 texturas mistura dia e noite (`dayNight.mix`) e soma a cor dos LEDs, que continua ajustável. As partes estáticas trocam para a malha assada; as luzes de tempo real ficam só para os objetos dinâmicos.
6. **Medir antes e depois:** draw calls (hoje ~495), peso do download, FPS no celular e capturas lado a lado.

Primeiro faço um protótipo só com paredes e piso, para validar o pipeline, e depois passo para o quarto inteiro.

## Fase 2 — Direção de arte e modelagem

- **Paleta com contraste:** valores mais escuros e mais claros, uma cor de destaque e um fundo que destaque o quarto de dia (hoje é bege sobre bege).
- **Janela como fonte de luz:** emissiva acima de 1, com Bloom.
- **Tecidos de verdade:** edredom, travesseiros e almofada com simulação de pano no Blender, por script, assados junto.
- **Detalhes orgânicos e densidade:** pelúcias, planta, livros e pequenos objetos nas camadas média e alta.
- **Estampas e texturas** em tecidos e tapete.

## Fase 3 — Experiência

- Tela de abertura e carregamento, com o voo de entrada.
- TV = Experiências (como o monitor e o celular).
- Contorno no hover e "aperto" no clique.
- Pequenas animações: relógio de ponteiros, cadeira, LED.
- Sons opcionais.
- Seção na URL e botão Voltar do navegador.
- Desempenho no celular: `frameloop="demand"` e texturas KTX2, se precisar.

## Fase 4 — Vitrine

- **README novo**, em inglês e português, sem o template da disciplina, com GIF ou vídeo de abertura, demo online e a arquitetura em diagrama.
- **Estudo de caso, "Como foi feito":** do quarto em código ao bake automático, as telas HTML e o celular. É o que faz as pessoas quererem replicar.
- **SEO e compartilhamento:** imagem Open Graph, título e descrição em dois idiomas.
- **Domínio próprio** (opcional), analytics simples e Lighthouse.
- **Organização:** mover wireframes, protótipos e o plano da faculdade para uma pasta de histórico.

## Pendências fora do código

- **EmailJS:** criar a conta e configurar as variáveis na Vercel. Sem isso o formulário não envia.
- **Vercel:** há dois projetos (`portfolio-3d` e `portfolio-3d-wyhb`). Manter só um.
