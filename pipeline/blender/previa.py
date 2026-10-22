"""Prévia rápida: monta a mesma cena do bake e só RENDERIZA pelas câmeras do site, sem assar.

    blender -b --factory-startup --python pipeline/blender/previa.py -- [--rigs=dia,noite] [--vistas=geral,mesa] [--amostras=48]

Leva 1–3 min em vez dos 45–55 do bake completo. Serve para ajustar modelagem, cor e luz; o bake
final continua sendo o `npm run bake`. Grava em pipeline/.cache/previa/:
  - <vista>-<rig>.png: a imagem do Cycles, sobre a cor de fundo do site;
  - previa-<rig>.blend: a cena com a câmera e as luzes, para abrir no Blender e girar à vontade
    (Numpad 0 = vista da câmera; Z → Rendered = luz de verdade na janela).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy  # noqa: E402

import cena  # noqa: E402
import exportar  # noqa: E402
import luzes  # noqa: E402
import modelos  # noqa: E402
from comum import CACHE, RAIZ, configurar_gpu, ler_config, log  # noqa: E402

PASTA = os.path.join(CACHE, "previa")


def opcoes():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    o = {"rigs": ["dia", "noite"], "vistas": ["geral"], "amostras": 96}
    for a in args:
        chave, _, valor = a.lstrip("-").partition("=")
        if chave in ("rigs", "vistas"):
            o[chave] = valor.split(",")
        elif chave == "amostras":
            o[chave] = int(valor)
    return o


def montar_cena(config):
    """As mesmas etapas do main.py até as paredes fantasma, sem o UV (que só o bake usa)."""
    cena.limpar_cena()
    configurar_gpu(config["dispositivo"])
    cena.importar(os.path.join(CACHE, "source.glb"))
    malhas = cena.preparar(config.get("areas"))
    malhas = modelos.substituir(malhas, config.get("modelos", []))
    objs = cena.juntar_por_grupo(malhas)
    cena.remover_faces_externas(objs)
    cena.materiais_por_grupo(objs)
    cena.paredes_fantasma(config)
    # O bake zera os brilhos para assar só a luz; na prévia eles voltam (telas, LEDs, lâmpadas)
    for mat in bpy.data.materials:
        if "emissao" in mat and mat.use_nodes:
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Emission Strength"].default_value = mat["emissao"]
        # As faces cortadas da maquete (topo das paredes, lateral da laje) não recebem luz no site:
        # têm cor fixa (BakedRoom). Aqui a emissão imita isso
        if mat.name.startswith("corte_maquete") and mat.use_nodes:
            bsdf = mat.node_tree.nodes["Principled BSDF"]
            bsdf.inputs["Emission Color"].default_value = bsdf.inputs["Base Color"].default_value
            bsdf.inputs["Emission Strength"].default_value = 0.85


def leds_acesos(config):
    """À noite, as fontes ajustáveis entram acesas com a cor e a força que o site usa."""
    col = bpy.data.collections["rig"]
    for led in config["leds"]:
        luzes._luz(col, {**led, "cor": led.get("corSite", [1.0, 1.0, 1.0])})


def main():
    o = opcoes()
    config = ler_config(os.path.join(RAIZ, "pipeline", "config", "bake.json"))
    fundos = config["previa"]["fundo"]
    os.makedirs(PASTA, exist_ok=True)
    montar_cena(config)
    for rig in o["rigs"]:
        luzes.montar(config, rig)
        if rig == "noite":
            leds_acesos(config)
        for i, vista in enumerate(o["vistas"]):
            # A última câmera fica na cena salva, para abrir o .blend já enquadrado
            ultima = i == len(o["vistas"]) - 1
            exportar.render_referencia(
                config, rig, vista, o["amostras"], pasta=PASTA, nome=f"{vista}-{rig}", fundo=fundos[rig], manter_camera=ultima
            )
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(PASTA, f"previa-{rig}.blend"))
        log(f"cena salva: previa-{rig}.blend")


main()
