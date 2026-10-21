# Linha de base: 21/10/2026

O estado do quarto **antes** da versão profissional: quarto feito só em código, com luz em tempo real. É o "antes" do estudo de caso. Código igual ao commit `0f48006`.

## Desempenho

Medido com `node scripts/desempenho.mjs` no servidor de desenvolvimento, Edge com GPU (GTX 1660 Super). Saída completa em [desempenho.txt](desempenho.txt).

| | Computador (1440×900) | Celular simulado (390×844, CPU 4x) |
|---|---|---|
| Tempo até a cena aparecer | 7,9 s (desenvolvimento) | 8,3 s |
| Draw calls por quadro | **459** | **447** |
| Triângulos por quadro | 493 mil | 392 mil |
| Malhas na cena | 422 | 416 |
| Malhas que projetam sombra | 309 | 309 |
| Luzes | 8 | 8 |
| FPS | 172 | **37** |

## Build de produção

| Arquivo | Tamanho | Comprimido (gzip) |
|---|---|---|
| `app.js` (tudo num arquivo só) | 1.516 KB | 477 KB |
| `index.css` | 26 KB | 6,5 KB |

## Capturas

| # | Ângulo | Clima |
|---|---|---|
| 01 | Visão geral | dia |
| 02 | Visão geral | noite |
| 03 | Mesa | dia |
| 04 | Gabinete | noite |
| 05 | Nicho | dia |
| 06 | Porta | dia |
| 07 | Janela | dia |
| 08 | Cama | dia |
| 09 | Celular em retrato | dia |

Os ângulos são os de "Ângulos úteis" no `CLAUDE.md`. As próximas medições usam os mesmos ângulos para dar para comparar lado a lado.
