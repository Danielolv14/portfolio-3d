"""Look dev: monta a cena como o bake (código + modelos do Blender) e só renderiza imagens do
Cycles pelas câmeras de bake.json, sem assar. Rápido para ajustar modelagem e luz.

    blender -b --factory-startup --python pipeline/teste/lookdev.py -- camera1,camera2 [dia|noite]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "blender"))

import bpy  # noqa: E402

import cena  # noqa: E402
import exportar  # noqa: E402
import luzes  # noqa: E402
import modelos  # noqa: E402
from comum import CACHE, RAIZ, SAIDA, configurar_gpu, ler_config  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
cameras = (args[0] if args else "geral").split(",")
rigs = args[1:] or ["dia"]
config = ler_config(os.path.join(RAIZ, "pipeline", "config", "bake.json"))

cena.limpar_cena()
configurar_gpu(config["dispositivo"])
cena.importar(os.path.join(CACHE, "source.glb"))
malhas = cena.preparar(config.get("areas"))
malhas = modelos.substituir(malhas, config.get("modelos", []))
cena.paredes_fantasma(config)
os.makedirs(SAIDA, exist_ok=True)
for rig in rigs:
    luzes.montar(config, rig)
    if rig == "noite":
        for led in config["leds"]:
            luzes._luz(bpy.data.collections["rig"], {**led, "cor": led["corSite"]})
    for camera in cameras:
        exportar.render_referencia(config, rig, camera, 96)
        os.replace(os.path.join(SAIDA, f"ref_{camera}_{rig}.png"), os.path.join(SAIDA, f"lookdev_{camera}_{rig}.png"))
