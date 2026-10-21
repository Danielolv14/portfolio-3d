# Pipeline do bake (código → Blender → site)

O quarto é montado em React (`src/room/`). Este pipeline exporta a cena, assa a luz no Blender (Cycles) e devolve um GLB com texturas para o site. O plano completo está em [`docs/plano/02-pipeline-blender.md`](../docs/plano/02-pipeline-blender.md), e os resultados da prova de conceito em [`docs/plano/resultados-poc.md`](../docs/plano/resultados-poc.md).

## Pré-requisitos

- Blender **4.5 LTS**:
  ```bash
  winget install BlenderFoundation.Blender.LTS.4.5
  ```
- Uma GPU NVIDIA (CUDA ou OptiX). Sem GPU funciona, mas fica muito mais lento. Mude `"dispositivo"` em `config/bake.json`.
- O servidor de desenvolvimento rodando:
  ```bash
  npm run dev
  ```

## Passo a passo

1. **Exportar** a cena em código para `pipeline/.cache/source.glb`:
   ```bash
   node pipeline/export/exportar.mjs
   ```
2. **Assar** (gera `pipeline/.cache/out/`). Com `--preview`, metade da resolução e 64 amostras, ~2 min; sem ele, ~10 min:
   ```bash
   blender -b --factory-startup --python pipeline/blender/main.py -- --preview
   ```
3. **Copiar** para o site (`public/room-poc/`) e ver o peso:
   ```bash
   node pipeline/optimize/optimize.mjs
   ```
4. Abrir http://localhost:5173/?render=poc

Só refazer o GLB, sem assar de novo:

```bash
blender -b --factory-startup --python pipeline/blender/main.py -- --etapa=exportar
```

## Arquivos

| Arquivo | Faz |
|---|---|
| `config/bake.json` | Grupos, resoluções, amostras, luzes de dia e de noite, câmeras de referência |
| `export/exportar.mjs` | Abre `export.html` no Edge e salva o GLB da cena |
| `blender/main.py` | Orquestra as etapas dentro do Blender |
| `blender/cena.py` | Importa, lê as marcações do `<Bake>`, junta por grupo, cria as paredes fantasma |
| `blender/uv.py` | Desdobra cada grupo num atlas (mapa de UV `bake`) |
| `blender/luzes.py` | Monta os rigs de dia e de noite |
| `blender/assar.py` | Assa albedo e luz, tira o ruído (OIDN) e codifica a luz em 8 bits |
| `blender/exportar.py` | Exporta o GLB (Draco) e renderiza as imagens de referência |
| `optimize/optimize.mjs` | Copia para `public/` e mostra o peso |
| `teste/comparar_cor.py` | Compara a cor do site com o Cycles pela mesma câmera |
| `teste/formatos.py` | Compara o peso das texturas em PNG e WebP |

As coordenadas em `bake.json` estão no sistema do site (three.js, y para cima). O `comum.do_site()` converte para o Blender (z para cima).
