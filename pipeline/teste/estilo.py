"""Experimento de estilo (estudo de 21/10): o mesmo quarto, a mesma luz, mudando só o estilo.
  1. texturas "realistas" viram a cor média delas (cores lisas, como o Room_Portfolio);
  2. todas as peças ganham chanfro (Bevel) e normais suavizadas por peso.
Renderiza imagens do Cycles pelas câmeras do site para comparar com as de referência atuais.

    blender -b pipeline/.cache/cena.blend --python pipeline/teste/estilo.py
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "blender"))

import bmesh  # noqa: E402
import bpy  # noqa: E402
import numpy as np  # noqa: E402

import exportar  # noqa: E402
import luzes  # noqa: E402
from comum import SAIDA, configurar_gpu, ler_config, log, RAIZ  # noqa: E402

config = ler_config(os.path.join(RAIZ, "pipeline", "config", "bake.json"))
configurar_gpu(config["dispositivo"])

# 1. Cores lisas: cada textura ligada à cor base vira a cor média dela
medias = {}
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if not bsdf or not bsdf.inputs["Base Color"].is_linked:
        continue
    imgs = [n.image for n in m.node_tree.nodes if n.bl_idname == "ShaderNodeTexImage" and n.image and n.name != "bake_alvo"]
    if not imgs:
        continue
    img = imgs[0]
    if img.name not in medias:
        px = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        medias[img.name] = px.reshape(-1, 4)[:, :3].mean(axis=0)
    for l in list(bsdf.inputs["Base Color"].links):
        m.node_tree.links.remove(l)
    bsdf.inputs["Base Color"].default_value = (*medias[img.name], 1)
log(f"texturas trocadas por cor média: {len(medias)}")

# 2. Chanfro em tudo (juntar vértices duplicados antes, senão o Bevel não acha as quinas)
for o in bpy.data.objects:
    if o.type != "MESH" or o.name.startswith("fantasma"):
        continue
    bm = bmesh.new()
    bm.from_mesh(o.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    bm.to_mesh(o.data)
    bm.free()
    bev = o.modifiers.new("chanfro", "BEVEL")
    bev.width = 0.012
    bev.segments = 2
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(30)
    bev.harden_normals = True
    o.modifiers.new("normais", "WEIGHTED_NORMAL").keep_sharp = True
log("chanfro aplicado")

for rig in ("dia", "noite"):
    luzes.montar(config, rig)
    if rig == "noite":
        for led in config["leds"]:
            luzes._luz(bpy.data.collections["rig"], {**led, "cor": led["corSite"]})
    for camera in ("geral", "cama"):
        exportar.render_referencia(config, rig, camera, 128)
        os.replace(os.path.join(SAIDA, f"ref_{camera}_{rig}.png"), os.path.join(SAIDA, f"estilo_{camera}_{rig}.png"))
