#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Actualiza los <lastmod> del sitemap con la fecha real de cada pagina.

Se corre A MANO, ANTES de commitear:

    python actualizar-sitemap.py            aplica los cambios
    python actualizar-sitemap.py --check    solo informa, no toca nada

De donde sale la fecha de cada URL:

  - Si el archivo tiene cambios sin commitear (o es nuevo)  -> la fecha de HOY.
    Es el caso normal cuando se corre antes de commitear: lo que acabas de
    editar todavia no tiene commit, asi que git diria la fecha vieja.
  - Si el archivo esta limpio -> la fecha del ultimo commit que lo toco.

Por que existe: el 31/08/2026 se descubrio que 18 de 24 URLs del sitemap
tenian el lastmod desactualizado. /posicionamiento-ia decia 2026-08-01 cuando
se habia reescrito y desplegado el 25/08, asi que Google venia leyendo "aca no
cambio nada" y nunca la rastreo. El lastmod no se actualizaba en los deploys.

El script NO agrega ni saca URLs del sitemap: solo corrige fechas. Si detecta
paginas nuevas sin entrada, o entradas que apuntan a archivos que ya no
existen, avisa para que lo resuelvas vos.
"""

import io
import os
import re
import subprocess
import sys
from datetime import date

RAIZ = os.path.dirname(os.path.abspath(__file__))
SITEMAP = os.path.join(RAIZ, "sitemap.xml")
DOMINIO = "https://varka.tech"

# Carpetas que no son paginas publicas del sitio.
IGNORAR = {".git", "netlify", "img", "planes", "demo"}


def git(*args, **kwargs):
    """crudo=True devuelve la salida sin recortar.

    Hace falta para `git status --porcelain`: el formato es 'XY<espacio>ruta',
    y cuando el archivo solo esta modificado en el working tree la X es un
    espacio (' M archivo'). Un .strip() sobre toda la salida se come ese
    espacio en la PRIMERA linea, y esa fila queda mal cortada. Se pierde un
    archivo, y sin ruido.
    """
    salida = subprocess.check_output(
        ["git"] + list(args), cwd=RAIZ, stderr=subprocess.DEVNULL
    ).decode("utf-8", "replace")
    return salida if kwargs.get("crudo") else salida.strip()


def url_a_archivo(loc):
    """https://varka.tech/blog/ -> blog/index.html"""
    ruta = loc.replace(DOMINIO, "").strip()
    if ruta in ("", "/"):
        return "index.html"
    ruta = ruta.strip("/")
    if os.path.isdir(os.path.join(RAIZ, ruta)):
        return ruta + "/index.html"
    return ruta + ".html"


def archivo_a_url(rel):
    """blog/index.html -> https://varka.tech/blog/"""
    rel = rel.replace("\\", "/")
    if rel == "index.html":
        return DOMINIO + "/"
    if rel.endswith("/index.html"):
        return DOMINIO + "/" + rel[: -len("index.html")]
    return DOMINIO + "/" + rel[: -len(".html")]


def main():
    solo_check = "--check" in sys.argv
    hoy = date.today().isoformat()

    try:
        git("rev-parse", "--git-dir")
    except Exception:
        print("ERROR: esto no es un repo de git. El script saca las fechas del historial.")
        return 1

    # Archivos con cambios sin commitear o sin trackear.
    sucios = set()
    for linea in git("status", "--porcelain", crudo=True).splitlines():
        if not linea.strip():
            continue
        nombre = linea[3:].strip().strip('"')
        if "->" in nombre:                       # renombrados: "viejo -> nuevo"
            nombre = nombre.split("->")[-1].strip()
        sucios.add(nombre.replace("\\", "/"))

    # newline="" preserva los finales de linea tal como estan en el archivo.
    with io.open(SITEMAP, encoding="utf-8", newline="") as fh:
        texto = fh.read()

    bloques = re.findall(r"<url>.*?</url>", texto, re.S)
    if not bloques:
        print("ERROR: no se encontro ningun bloque <url> en sitemap.xml")
        return 1

    cambios, iguales, sin_archivo, sin_lastmod = [], [], [], []
    en_sitemap = set()

    for bloque in bloques:
        m_loc = re.search(r"<loc>(.*?)</loc>", bloque, re.S)
        if not m_loc:
            continue
        loc = m_loc.group(1).strip()
        rel = url_a_archivo(loc)
        en_sitemap.add(rel)

        if not os.path.isfile(os.path.join(RAIZ, rel)):
            sin_archivo.append((loc, rel))
            continue

        m_lm = re.search(r"<lastmod>(.*?)</lastmod>", bloque, re.S)
        if not m_lm:
            sin_lastmod.append((loc, rel))
            continue
        actual = m_lm.group(1).strip()

        if rel in sucios:
            nueva, motivo = hoy, "sin commitear"
        else:
            try:
                nueva = git("log", "-1", "--format=%cd", "--date=short", "--", rel)
            except Exception:
                nueva = ""
            motivo = "ultimo commit"
            if not nueva:
                nueva, motivo = hoy, "sin historial"

        if nueva == actual:
            iguales.append(loc)
            continue

        nuevo_bloque = bloque.replace(
            "<lastmod>%s</lastmod>" % actual, "<lastmod>%s</lastmod>" % nueva, 1
        )
        texto = texto.replace(bloque, nuevo_bloque, 1)
        cambios.append((loc, actual, nueva, motivo))

    # Paginas publicadas que no estan en el sitemap.
    huerfanas = []
    for carpeta, subcarpetas, archivos in os.walk(RAIZ):
        subcarpetas[:] = [d for d in subcarpetas if d not in IGNORAR]
        for a in archivos:
            if not a.endswith(".html"):
                continue
            rel = os.path.relpath(os.path.join(carpeta, a), RAIZ).replace("\\", "/")
            if rel not in en_sitemap:
                huerfanas.append(rel)

    # ---- informe ----
    if cambios:
        print("LASTMOD DESACTUALIZADOS: %d de %d" % (len(cambios), len(bloques)))
        for loc, viejo, nuevo, motivo in cambios:
            print("  %-58s %s -> %s  (%s)"
                  % (loc.replace(DOMINIO, "") or "/", viejo, nuevo, motivo))
    else:
        print("LASTMOD: todo al dia, no hay nada que corregir.")

    print("\nYa estaban bien: %d" % len(iguales))

    if sin_lastmod:
        print("\nAVISO - entradas SIN <lastmod> (no se tocaron, agregalo a mano):")
        for loc, rel in sin_lastmod:
            print("  %s" % loc)

    if sin_archivo:
        print("\nAVISO - el sitemap apunta a archivos que no existen:")
        for loc, rel in sin_archivo:
            print("  %s  ->  %s" % (loc, rel))

    if huerfanas:
        print("\nAVISO - paginas .html que NO estan en el sitemap:")
        for rel in sorted(huerfanas):
            print("  %-52s seria %s" % (rel, archivo_a_url(rel)))
        print("  (el script no las agrega solo: puede haber borradores"
              " o paginas que no queres publicar)")

    if solo_check:
        print("\n--check: no se escribio nada.")
        return 0

    if cambios:
        with io.open(SITEMAP, "w", encoding="utf-8", newline="") as fh:
            fh.write(texto)
        print("\nsitemap.xml actualizado. Revisalo con: git diff sitemap.xml")

    return 0


if __name__ == "__main__":
    sys.exit(main())
