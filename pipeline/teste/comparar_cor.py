"""Teste de cor da prova de conceito: compara a imagem do Cycles (referência) com a captura do site
pela mesma câmera, só onde há quarto (alfa da referência). Roda no Python do Blender (tem numpy):

    blender -b --factory-startup --python pipeline/teste/comparar_cor.py -- <ref.png> <site.jpg> <diferenca.png>

Mostra a diferença média por canal (0–255) e grava uma imagem com a diferença ampliada 4x.
"""
import sys

import bpy
import numpy as np


def carregar(caminho):
    img = bpy.data.images.load(caminho)
    img.colorspace_settings.name = "Non-Color"  # compara os valores gravados, sem conversão
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    return px.reshape(h, w, 4)


ref_caminho, site_caminho, saida = sys.argv[sys.argv.index("--") + 1:][:3]
ref = carregar(ref_caminho)
site = carregar(site_caminho)
mascara = ref[..., 3] > 0.99
dif = np.abs(ref[..., :3] - site[..., :3])[mascara] * 255
media = dif.mean(axis=0)
p95 = np.percentile(dif.max(axis=1), 95)
print(f"RESULTADO pixels={mascara.sum()} media R={media[0]:.1f} G={media[1]:.1f} B={media[2]:.1f} p95={p95:.1f}")
print(f"RESULTADO brilho medio ref={ref[..., :3][mascara].mean() * 255:.1f} site={site[..., :3][mascara].mean() * 255:.1f}")

mapa = np.zeros_like(ref)
mapa[..., :3] = np.clip(np.abs(ref[..., :3] - site[..., :3]) * 4, 0, 1) * mascara[..., None]
mapa[..., 3] = 1
img = bpy.data.images.new("diferenca", ref.shape[1], ref.shape[0], alpha=True)
img.colorspace_settings.name = "Non-Color"
img.pixels.foreach_set(mapa.ravel())
img.filepath_raw = saida
img.file_format = "PNG"
img.save()
