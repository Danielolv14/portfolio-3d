"""Modelos feitos no Blender por script, que substituem as peças do quarto em código.

Cada módulo cria uma área do quarto e diz qual grupo de bake ele substitui. Em bake.json,
"modelos": ["mesa", ...] escolhe quais áreas já vêm do Blender; as demais continuam do código.
"""
import importlib

import bpy

from comum import log

# Módulo -> (grupos do código que ele substitui, peças desses grupos que continuam vindo do código).
# As partes que se mexem (kind dyn, ex.: a cadeira) também continuam do código
SUBSTITUI = {
    "mesa": (("furniture-desk", "props-desk"), ("teclado", "mouse", "fones", "cabos")),
    "cama": (("furniture-bed", "props-bed"), ("roupa_cama", "celular", "bola", "objetos_criado")),
    "estrutura": (("shell",), ("paredes", "janela")),
    "nicho": (("furniture-niche",), ()),
    "chao": (("props-floor",), ()),
}


def substituir(malhas, nomes):
    for nome in nomes:
        grupos, manter = SUBSTITUI[nome]
        sai = [o["bk_group"] in grupos and o["bk_kind"] != "dyn" and o["bk_peca"] not in manter for o in malhas]
        fora = [o for o, s in zip(malhas, sai) if s]
        malhas = [o for o, s in zip(malhas, sai) if not s]
        for o in fora:
            bpy.data.objects.remove(o, do_unlink=True)
        novos = importlib.import_module(f"modelos.{nome}").criar()
        log(f"modelo {nome}: peças do código trocadas por {len(novos)} objetos do Blender")
        malhas += novos
    return malhas
