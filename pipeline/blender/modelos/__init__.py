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
    "cama": (("furniture-bed", "props-bed"), ("celular", "objetos_criado")),
    "estrutura": (("shell",), ()),
    # Terceiro item: peças que saem mesmo de outros grupos (o objeto do código vira um modelo pronto)
    "nicho": (("furniture-niche",), (), ("pato", "jbl", "pelucias")),
    "chao": (("props-floor",), ()),
    # Peças novas, sem equivalente no código: não tiram nada, só acrescentam
    "frente": ((), ()),
}


# Peças que continuam do código, mas cujo brilho passa a acender com uma fonte ajustável do site:
# peça -> (nome do material, força). Ex.: o RGB do teclado acende à noite junto com o canal B (RGB)
BRILHO = {"teclado": ("emit-B-teclado", 0.6)}


def _ligar_brilho(malhas):
    for o in malhas:
        cfg = BRILHO.get(o.get("bk_peca", ""))
        if not cfg:
            continue
        for slot in o.material_slots:
            m = slot.material
            b = m.node_tree.nodes.get("Principled BSDF") if m and m.use_nodes else None
            # Só o material que tem o mapa de brilho (o do teclado: legendas + RGB por baixo)
            if b and b.inputs["Emission Color"].is_linked:
                m.name = cfg[0]
                b.inputs["Emission Strength"].default_value = cfg[1]


def substituir(malhas, nomes):
    _ligar_brilho(malhas)
    for nome in nomes:
        grupos, manter, *resto = SUBSTITUI[nome]
        tirar = resto[0] if resto else ()
        sai = [
            (o["bk_group"] in grupos and o["bk_kind"] != "dyn" and o.get("bk_peca", "") not in manter) or o.get("bk_peca", "") in tirar
            for o in malhas
        ]
        fora = [o for o, s in zip(malhas, sai) if s]
        malhas = [o for o, s in zip(malhas, sai) if not s]
        for o in fora:
            bpy.data.objects.remove(o, do_unlink=True)
        novos = importlib.import_module(f"modelos.{nome}").criar()
        log(f"modelo {nome}: peças do código trocadas por {len(novos)} objetos do Blender")
        malhas += novos
    return malhas
