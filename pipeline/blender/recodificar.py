"""Regrava as texturas de luz a partir do último bake, sem assar de novo.

    blender -b --factory-startup --python pipeline/blender/recodificar.py

Usa as imagens sem compressão que o bake deixa em pipeline/.cache/out (_denoise_*.exr) e as escalas
do manifest.json. Útil quando muda só o formato ou a codificação das texturas.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy  # noqa: E402
import numpy as np  # noqa: E402

import assar  # noqa: E402
from comum import SAIDA, log  # noqa: E402


def carregar(nome):
    img = bpy.data.images.load(os.path.join(SAIDA, f"_denoise_{nome}.exr"), check_existing=False)
    img.colorspace_settings.name = "Non-Color"
    return np.maximum(assar._pixels(img)[..., :3], 0)


with open(os.path.join(SAIDA, "manifest.json"), encoding="utf-8") as f:
    manifesto = json.load(f)
manifesto["codificacao"] = {"tipo": "log", "k": assar.K_LOG}
for nome, g in manifesto["grupos"].items():
    for rig in ("dia", "noite"):
        cod = assar.codificar(carregar(f"luz_{rig}_{nome}"), g[f"escala_{rig}"])
        assar._salvar_png(np.concatenate([cod, np.ones_like(cod[..., :1])], axis=-1), f"luz_{rig}_{nome}")
    canais = [assar.codificar(carregar(f"led_{c}_{nome}").mean(axis=-1), s) for c, s in zip("RGB", g["escala_leds"])]
    assar._salvar_png(np.stack(canais + [np.ones_like(canais[0])], axis=-1), f"leds_{nome}")
    log(f"recodificado: {nome}")
with open(os.path.join(SAIDA, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifesto, f, indent=2, ensure_ascii=False)
