"""Teste de formato das texturas: grava cada PNG do bake também em WebP com algumas qualidades
e mostra o peso. Roda no Blender:  blender -b --factory-startup --python pipeline/teste/formatos.py -- <pasta>"""
import glob
import os
import sys

import bpy

pasta = sys.argv[sys.argv.index("--") + 1]
saida = os.path.join(pasta, "formatos")
os.makedirs(saida, exist_ok=True)
cena = bpy.context.scene
totais = {}
for png in sorted(glob.glob(os.path.join(pasta, "*.png"))):
    if os.path.basename(png).startswith(("ref_", "_")):
        continue
    img = bpy.data.images.load(png)
    img.colorspace_settings.name = "Non-Color"
    nome = os.path.splitext(os.path.basename(png))[0]
    linha = [f"{nome:22} png {os.path.getsize(png) // 1024:5} KB"]
    totais["png"] = totais.get("png", 0) + os.path.getsize(png)
    for q in (95, 85):
        cena.render.image_settings.file_format = "WEBP"
        cena.render.image_settings.quality = q
        cena.render.image_settings.color_mode = "RGB"
        destino = os.path.join(saida, f"{nome}_q{q}.webp")
        img.save_render(destino, scene=cena)
        tam = os.path.getsize(destino)
        totais[f"webp{q}"] = totais.get(f"webp{q}", 0) + tam
        linha.append(f"webp{q} {tam // 1024:5} KB")
    print("FORMATO", " | ".join(linha))
print("FORMATO total", {k: f"{v // 1024} KB" for k, v in totais.items()})
