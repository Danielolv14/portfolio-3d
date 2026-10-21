"""Pipeline do bake: roda dentro do Blender, sem janela.

    blender -b --factory-startup --python pipeline/blender/main.py -- [--preview] [--config=...]

Lê pipeline/.cache/source.glb (exportado pelo site), monta a cena, assa albedo e luz de dia e de
noite por grupo e grava em pipeline/.cache/out/: room.glb, as texturas PNG, imagens de referência
e manifest.json. Ver docs/plano/02-pipeline-blender.md.
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))

import bpy  # noqa: E402

import assar  # noqa: E402
import cena  # noqa: E402
import exportar  # noqa: E402
import luzes  # noqa: E402
import modelos  # noqa: E402
import uv  # noqa: E402
from comum import CACHE, SAIDA, argumentos, configurar_gpu, ler_config, log  # noqa: E402


def so_exportar():
    """--etapa=exportar: reabre a cena montada (cena.blend) e só exporta o GLB de novo,
    sem assar (útil quando muda só o formato do export)."""
    bpy.ops.wm.open_mainfile(filepath=os.path.join(CACHE, "cena.blend"))
    objs = [o for o in bpy.data.objects if o.type == "MESH" and o.get("bk_group")]
    exportar.exportar_glb(objs, os.path.join(SAIDA, "room.glb"))


def main():
    opcoes = argumentos()
    if opcoes["etapa"] == "exportar":
        so_exportar()
        return
    config = ler_config(opcoes["config"])
    preview = opcoes["preview"]
    escala = config["preview"]["escala"] if preview else 1
    amostras_luz = config["preview"]["amostrasLuz"] if preview else config["amostras"]["luz"]
    os.makedirs(SAIDA, exist_ok=True)
    tempos = {}

    t = time.time()
    cena.limpar_cena()
    configurar_gpu(config["dispositivo"])
    cena.importar(os.path.join(CACHE, "source.glb"))
    malhas = cena.preparar(config.get("areas"))
    # Áreas já modeladas no Blender entram no lugar das peças do código
    malhas = modelos.substituir(malhas, config.get("modelos", []))
    objs = cena.juntar_por_grupo(malhas)
    cena.remover_faces_externas(objs)
    cena.materiais_por_grupo(objs)
    grupos = {}
    for o in objs:
        grupos.setdefault(o["bk_group"], []).append(o)
    for nome, lista in grupos.items():
        uv.desdobrar_grupo(lista, config["margemIlhas"])
    cena.paredes_fantasma(config)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(CACHE, "cena.blend"))
    tempos["montar"] = time.time() - t

    manifesto = {"versao": time.strftime("%Y%m%d-%H%M%S"), "preview": preview, "grupos": {}}
    margem = max(4, int(config["margemPx"] * escala))

    # A cor não é mais assada: o site usa os materiais e as texturas originais, que vão no GLB,
    # nítidos. O bake guarda só a luz (docs/plano/resultados-poc.md, "embaçado")
    for nome, lista in grupos.items():
        manifesto["grupos"][nome] = {"objetos": [o.name for o in lista]}

    # Luz: um bake por rig e por grupo, com denoise e codificação em 8 bits
    for rig in ("dia", "noite"):
        t = time.time()
        luzes.montar(config, rig)
        for nome, lista in grupos.items():
            tam = int(config["grupos"][nome]["luz"] * escala)
            img = assar._imagem(f"luz_{rig}_{nome}", tam, True)
            # Grupos com superfícies grandes e lisas (paredes, piso) mostram mais ruído: mais amostras
            amostras = amostras_luz if preview else config["amostras"].get("porGrupo", {}).get(nome, amostras_luz)
            assar.assar(lista, img, "luz", amostras, max(4, margem // 2))
            cobertura = assar.cobertura(img)
            limpo = assar.tirar_ruido(img)
            arquivo, s = assar.salvar_luz(limpo, f"luz_{rig}_{nome}", cobertura)
            manifesto["grupos"][nome][f"luz_{rig}"] = os.path.basename(arquivo)
            manifesto["grupos"][nome][f"escala_{rig}"] = s
            log(f"luz {rig} {nome}: {tam}px, escala {s:.3f}")
        tempos[f"luz_{rig}"] = time.time() - t
        # Imagens de referência do Cycles pelas câmeras do site, para o teste de cor
        t = time.time()
        for camera in ("geral", "cama"):
            exportar.render_referencia(config, rig, camera, 64 if preview else 256)
        tempos[f"ref_{rig}"] = time.time() - t

    # Máscara dos LEDs: cada fonte ajustável assada sozinha, um canal por fonte
    t = time.time()
    por_grupo = {nome: [] for nome in grupos}
    coberturas = {}
    for led in config["leds"]:
        luzes.montar_led(led)
        for nome, lista in grupos.items():
            tam = int(config["grupos"][nome]["luz"] * escala)
            img = assar._imagem(f"led_{led['canal']}_{nome}", tam, True)
            assar.assar(lista, img, "luz", amostras_luz, max(4, margem // 2))
            coberturas.setdefault(nome, assar.cobertura(img))
            por_grupo[nome].append(assar.tirar_ruido(img))
    for nome, imgs in por_grupo.items():
        arquivo, escalas = assar.salvar_mascara(imgs, f"leds_{nome}", coberturas[nome])
        manifesto["grupos"][nome]["leds"] = os.path.basename(arquivo)
        manifesto["grupos"][nome]["escala_leds"] = escalas
    manifesto["leds"] = [{"nome": l["nome"], "canal": l["canal"], "cor": l["corSite"]} for l in config["leds"]]
    tempos["leds"] = time.time() - t

    exportar.exportar_glb(objs, os.path.join(SAIDA, "room.glb"))
    manifesto["glb"] = "room.glb"
    # Como a luz foi codificada (o site desfaz igual): curva logarítmica com este K
    manifesto["codificacao"] = {"tipo": "log", "k": assar.K_LOG}
    # Exposição de cada clima (em stops, como no Blender): o site usa a mesma
    manifesto["exposicao"] = {rig: config["rigs"][rig].get("exposicao", 0) for rig in ("dia", "noite")}
    manifesto["tempos"] = {k: round(v, 1) for k, v in tempos.items()}
    with open(os.path.join(SAIDA, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifesto, f, indent=2, ensure_ascii=False)
    log(f"pronto: {manifesto['tempos']}")


main()
