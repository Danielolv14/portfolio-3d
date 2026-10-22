# Modelos prontos (decisão 15: realismo)

Desde 22/10, o quarto busca o realismo da imagem-alvo (`docs/plano/alvo/`). Os objetos com forma complicada vêm de **modelos 3D prontos com licença livre**; quando não existir um bom, o objeto é modelado por script ou trocado por outro.

## Licenças aceitas

| Licença | Pode usar? | O que exige |
|---|---|---|
| **CC0** (Poly Haven, ambientCG) | Sim | Nada (crédito opcional, mas damos) |
| **CC BY 4.0** (Sketchfab) | Sim | Crédito ao autor (nome, link e licença) na página de créditos e no README |
| CC BY-SA | Só se for inevitável | O modelo modificado precisa sair com a mesma licença |
| CC BY-NC, BY-ND, "Standard"/pagos | **Não** | NC proíbe uso comercial (portfólio de trabalho é zona cinza); ND proíbe modificar |

Cada modelo usado entra em `docs/creditos.md`, com autor, link e licença.

## Já baixados (Poly Haven, CC0; `node pipeline/polyhaven.mjs`)

| Objeto | Modelo | Onde está no quarto |
|---|---|---|
| Poltrona | `mid_century_lounge_chair` | Frente, ao lado do tapete (`modelos/frente.py`) |
| Enciclopédias | `book_encyclopedia_set_01` | Prateleira de cima da estante (`modelos/nicho.py`) |
| Patinho de borracha | `rubber_duck_toy` | Estante, no lugar do patinho do código |
| Óculos redondos (Harry Potter) | `round_spectacles` | Estante |

Texturas CC0 (Poly Haven): `oak_veneer_01`, `beige_wall_001`, `marble_01`, `poly_wool_herringbone`, `curly_teddy_natural`, `brown_leather`.

## Para o Daniel baixar (Sketchfab, CC BY; precisa de login)

Em cada link: **Download 3D Model → glTF** (o formato convertido). Descompacte o zip em `art/terceiros/<pasta>/` (a pasta fica fora do git).

| Pasta | Objeto | Modelo (autor) | Faces | Link |
|---|---|---|---|---|
| `xdj` | XDJ-RX3 | Pioneer XDJ RX3 (astens_), escaneado | 190 mil (vou reduzir) | https://sketchfab.com/3d-models/93084c9866e34df2adece3324dd1cc25 |
| `monitor_krk` | Monitores de áudio | KRK Classic 5 Studio Monitor Speaker (TheGiwi) | 98 mil | https://sketchfab.com/3d-models/5c03f6b1082a4decb33ae7511209271a |
| `dualsense` | Controle do PS5 | Playstation 5 Dualsense (AHarmlessPotato) | 112 mil | https://sketchfab.com/3d-models/878c1f882808477ab81c2fe86d5a3936 |
| `stormtrooper` | Capacete Stormtrooper | Stormtrooper Imperial Helmet (oscar_creativo) | 793 mil (vou reduzir) | https://sketchfab.com/3d-models/a0a6465bb3774a0f944120f37955bc36 |
| `jbl` | Caixa de som JBL | JBL Charge 3 speaker (Oleksii.Rozumnyi) | 92 mil | https://sketchfab.com/3d-models/661f85fe3e4048f59785b2a75ffa52f8 |
| `varinha` | Varinha (Harry Potter) | The Elder Wand (JamesA) | 1,7 mil | https://sketchfab.com/3d-models/efc7362a857749b3ae55fcbbba8baafb |
| `chapeu` | Chapéu (Breaking Bad) | Pork Pie Hat (kenlong) | 25 mil | https://sketchfab.com/3d-models/c0686894c7c64a95ba1b03a0db5a82e7 |
| `frasco` | Frasco de laboratório (Breaking Bad) | FREE Conical Flask (nakedsingularity) | 2,7 mil | https://sketchfab.com/3d-models/f2991abcaaa44616ad5f72d29a3d47b3 |
| `ovos_dragao` | Ovo de dragão (Game of Thrones) | Multi-colored Dragon Eggs (johnlabrada3D) | 288 mil (vou reduzir) | https://sketchfab.com/3d-models/309cbb6670fc40968203aea8030d8ff1 |
| `bone` | Boné | Baseball Cap (vanart) | 93 mil | https://sketchfab.com/3d-models/1c1d34d73fd94e6b9e8f82b1eb7194a0 |
| `dunk` | Tênis Dunk | Nike dunk (Coop2wavvy); recolorido para o White Lobster | 50 mil | https://sketchfab.com/3d-models/58fff2344f5045968974ea2d485625e8 |
| `pendrive` | Pen drives | USB Flash Drive (artikdev) | 1,3 mil | https://sketchfab.com/3d-models/b7cfb7e2809e4c64afb713140c982489 |
| `bola` | Bola de vôlei | Volleyball (PatelDev); recolorida para a Mikasa amarela | 3,2 mil | https://sketchfab.com/3d-models/5ebd04ad8a9647e999c04ae92dd2fe13 |

**Ainda sem modelo bom:** a letra "&" luminosa (fica a do código ou modelo por script), crachá e credenciais (script), caneca (script), pelúcias (dependem das fotos), roupa de cama (simulação de tecido no Blender).

**P14 respondida (22/10): os logos ficam** (mais realista). As pelúcias saíram da estante.

## O que o Daniel baixou (22/10) e onde entrou

Ele escolheu alguns modelos diferentes da lista acima. Todos são CC BY e estão em `docs/creditos.md`. `npm run terceiros` (`pipeline/blender/converter.py`) abre o original (GLB, FBX, OBJ ou BLEND), religa as texturas, reduz os polígonos, leva para o tamanho real (`medida` no `bake.json`) e grava `modelo.glb`; materiais feitos com nós que o GLB não carrega têm a cor assada (`assar_cor`, com `variante` e `recolorir`).

| Pasta | Modelo | Onde entrou |
|---|---|---|
| `xdj` | Pioneer DJ console | Aparador do cantinho DJ (`frente.py`) |
| `monitor_krk` | KRK Classic 5 | Pontas do aparador |
| `ps5` | Controle DualSense (o arquivo se chama Ps5) | Mesinha ao lado da poltrona; o console continua o feito por script |
| `jbl` | JBL Charge 3, variante camuflada recolorida para verde-oliva/marrom/cáqui | Prateleira do meio da estante |
| `funko_hp` | Funko do Harry Potter | Base da estante |
| `deadpool` | Funko do Deadpool | Base da estante |
| `trailer_bb` | Trailer do Breaking Bad em miniatura | Base da estante |
| `dunk` | Nike SB Dunk Low "Chunky Dunky" | Par no chão, perto da porta (`chao.py`) |

**Feitos por script:** bola de futevôlei Mikasa amarela (18 gomos com sulco, `base.bola_volei`), mochila Nike da foto do Daniel (letreiro "NIKE" em fonte Impact e swoosh em relevo, `base.texto`), roupa de cama (edredom matelassê com a mesma conta do código, travesseiro no braço) e boné.
