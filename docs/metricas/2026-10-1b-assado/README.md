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
