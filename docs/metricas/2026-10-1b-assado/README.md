# Quarto assado (Fase 1b, primeira versão): 21/10/2026

Quarto inteiro assado no Blender (6 atlas), visto em `?render=poc`, com o quarto em código invisível como camada de interação. Compare com a [linha de base](../2026-10-base/README.md).

| | Linha de base (luz em tempo real) | Assado |
|---|---|---|
| Draw calls por quadro | 459 | **38** |
| FPS no computador | 172 | 238 (limite da tela) |
| FPS no celular simulado (CPU 4x) | 37 | **168** |
| Luzes em tempo real | 8 | 1 (sobra da luminária de cobre no código; sai na próxima etapa) |
| Texturas | geradas em canvas | 7,4 MB em WebP (6 atlas) |
| Tempo de bake | — | 9 min 52 s (final) |

As capturas `01`–`03` estão nesta pasta. O equilíbrio da luz (força e cor) ainda é o primeiro rascunho; o ajuste fino é o ciclo 1 da Fase 2.

## Texturas originais + só a luz assada (21/10)

Os objetos estavam embaçados porque a cor também era assada num atlas dividido por dezenas de objetos. Agora cada objeto usa a própria textura (nítida) e o bake guarda só a luz. **94 draw calls** (antes 38; no começo 459), **118 FPS no celular simulado**, 6,7 MB no total. Capturas 06 e 07.

## Contra o aspecto de massinha (21/10)

Reflexos (mapa 360° do próprio quarto), cor AgX "punch", janela consertada, móveis com um atlas de luz por área e mais amostras (shell 3072, móveis 1536, resto 1024). Bake de ~35 min. Capturas 08 e 09.

## Quadriculado na parede e na porta (21/10)

Era a compressão WebP com perda (q90) nos degradês escuros da luz. Com q98, some, e o download fica em ~10 MB no computador (sem perda seriam 20,7 MB). Também saíram 18 arquivos antigos que sobravam em public/room. Capturas 10 e 11.
