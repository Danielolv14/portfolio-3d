"""Modelos feitos no Blender por script, que substituem as peças do quarto em código.

Cada módulo cria uma área do quarto e diz qual grupo de bake ele substitui. Em bake.json,
"modelos": ["mesa", ...] escolhe quais áreas já vêm do Blender; as demais continuam do código.
"""
import importlib

import bpy

from comum import log

# Módulo -> grupos do código que ele substitui
SUBSTITUI = {
    "mesa": ("furniture-desk",),
}


def substituir(malhas, nomes):
    for nome in nomes:
        grupos = SUBSTITUI[nome]
        fora = [o for o in malhas if o["bk_group"] in grupos]
        malhas = [o for o in malhas if o["bk_group"] not in grupos]
        for o in fora:
            bpy.data.objects.remove(o, do_unlink=True)
        novos = importlib.import_module(f"modelos.{nome}").criar()
        log(f"modelo {nome}: peças do código trocadas por {len(novos)} objetos do Blender")
        malhas += novos
    return malhas
