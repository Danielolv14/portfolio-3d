# Resultados da prova de conceito (Fase 1a)

21/10/2026. Escopo: áreas **shell**, **bed** e **desk** (o nicho e o chão ficaram de fora), dia e noite, sem a máscara de LEDs. Blender 4.5.10 LTS, GTX 1660 Super com OptiX.

Como reproduzir:

1. Com o servidor de desenvolvimento rodando, exportar a cena:
   ```bash
   node pipeline/export/exportar.mjs
   ```
2. Assar no Blender (`--preview` para a versão rápida):
   ```bash
   blender -b --factory-startup --python pipeline/blender/main.py
   ```
3. Copiar o resultado para o site:
   ```bash
   node pipeline/optimize/optimize.mjs
   ```
4. Abrir http://localhost:5173/?render=poc

## Resumo

| Pergunta | Resultado | Decisão para a Fase 1b |
|---|---|---|
| **O pipeline funciona de ponta a ponta?** | ✅ Sim: código → GLB → Blender → bake → site, sem passo manual | Manter a estrutura |
| **Cor:** o site bate com o Cycles? | ✅ O brilho médio fica a menos de 2 % (cama de dia: 54,0 × 53,4; geral à noite: 40,2 × 39,9). ⚠️ A diferença média por pixel é de 3 a 6 %, acima da meta de 3 % | As diferenças vêm de: brilho especular (piso, metal) não assado; emissivos falsos do código (a cabeceira brilha de propósito em `Bed.jsx` e o Cycles conta isso); telas sem conteúdo. Remover os emissivos falsos e usar cubemap para o especular |
| **Desempenho** | ✅ **25 draw calls** (antes 459), **0 luzes** em tempo real | O FPS medido (240) estava com a GPU ocupada pelo bake; medir de novo na 1b |
| **Resolução do albedo** | ⚠️ Um atlas 4096 por grupo não basta de perto: o rótulo da creatina e os textos dos pôsteres ficam borrados | Dividir o grupo `props` por área (`props-desk`, `props-bed`, `props-niche`, `props-floor`), cada um com o seu atlas, e dar mais área de UV ao que a câmera vê de perto |
| **Resolução e ruído da luz** | ⚠️ Manchas suaves nas paredes e no edredom, e bordas serrilhadas nos objetos pequenos (lightmap 2048 com 512 amostras e OIDN) | Mais densidade de lightmap nos objetos (mesma divisão por área), 1024 amostras no bake final e denoise com os passes de albedo e normal |
| **Emendas entre ilhas de UV** | ⚠️ Visíveis em quinas de objetos pequenos, ligadas à baixa densidade | Resolver com a densidade; manter a margem de 16 px |
| **Faixas (banding)** | ✅ Sem faixas visíveis na codificação 8 bits + gama 2,2 | ⚠️ A escala da noite no grupo furniture chegou a 39 (a luminária da TV encosta nas peças), o que gasta precisão nos escuros. Testar uma escala por percentil menor ou limitar o brilho perto das luzes |
| **Formato das texturas** | PNG: 16,4 MB. **WebP q95: 3,2 MB; WebP q85: 1,8 MB** (gravados pelo próprio Blender). KTX2 não testado | WebP q90 como padrão agora. KTX2 depende do KTX-Software, que não existe no winget |
| **Geometria** | GLB de 11,4 MB → **1,0 MB com Draco** (exportador do Blender; decodificador servido em `public/draco/`) | Manter Draco. O meshopt via gltf-transform precisa do Node 20+ (aqui é o 18) |
| **Tempo de bake** | Preview: **~1 min 50 s**. Final: **9 min 19 s** (montar 6 s, albedo 1 min 47 s, luz de dia 2 min 29 s, luz de noite 2 min 32 s, imagens de referência 2 min 25 s) | Aceitável. Com a divisão por área e 1024 amostras, a estimativa é de 20 a 30 min |

## Luz da noite (decisão do Daniel)

Já assada como decidido: **luminária de cobre ao lado da cama** e **luminária (light bar) em cima da TV** como luzes principais, e o RGB do gabinete só de apoio. A luminária "&" não ilumina mais. O equilíbrio fino (força e cor de cada uma) fica para o ciclo de look dev da Fase 2.

## Problemas encontrados

- O **OptiX** derrubou o Blender uma vez (`EXCEPTION_ACCESS_VIOLATION`) no primeiro bake; rodar de novo funcionou. Se repetir, trocar para CUDA em `bake.json`.
- As **paredes fantasma** tampavam a câmera das imagens de referência. Corrigido com `visible_camera = False`: elas continuam bloqueando e rebatendo a luz.
- A **borda da laje** recebe céu demais de fora e estourava no Bloom. Por ora, o limiar do Bloom no modo assado subiu para 1,6.
- O **tapete felpudo** tem a maior parte das 255 mil faces do grupo `props`. Na 1b, ele vira uma malha simples com o pelo assado de uma versão detalhada (técnica *selected to active*).

## O que muda no plano

1. Grupos de atlas: `shell`, `furniture`, `props-desk`, `props-bed`, `props-niche`, `props-floor`.
2. Remover os emissivos falsos do código antes do bake final.
3. WebP no lugar de PNG; KTX2 quando houver ferramenta.
4. Atualizar o Node local para o 22 LTS (o mesmo do CI) para usar o meshopt e o KTX via gltf-transform.
