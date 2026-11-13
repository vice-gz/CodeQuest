#!/usr/bin/env python3
"""
Genera docs/GUIA_NIVELES_MUNDOS_1_A_5.md leyendo los JSON de levels/.
La guía se calcula desde los mismos datos que usa el juego, así nunca se
desactualiza: si cambias un nivel, vuelve a correr este script.

Uso:  python3 herramientas/generar_guia.py   (desde la raíz del proyecto)
"""
import glob
import json
import os
import re

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SIMBOLO = {"corazones": "♥", "diamantes": "♦", "treboles": "♣", "picas": "♠"}
ROJO = {"corazones", "diamantes"}
MUNDOS = {
    1: ("Fundamentos y Datos", "Laboratorio de **Robot1** y el pueblo (cada nivel elige su escenario: robot, consola de datos o un minijuego)",
        "Fusión de los antiguos Mundos 1 y 2, todo en Python. El Nivel 0 enseña qué es un algoritmo con un diagrama de flujo. Bloque A (robot): `print()`, `avanzar`, `girar` y errores. "
        "Bloque B: variables y reasignación en **La Alcancía** (`ahorro += mesada`), `input()` e `int()` en la terminal y `if` / `and` / `or` en **Semáforos**. "
        "Bloque C: el **Intercambio** de vasos (`temp`), identificadores, **La Receta** (`*`, `/`, `int(x + 0.5)` y `round()`) y constantes; cierra el jefe intermedio **Laberinto ciego**. "
        "Bloque D: `while` y contadores en **El Pozo**, el puente de datos, `//` y `%` en **El Cronómetro**, expresiones booleanas sin `if` en **La Boleta**, `round(x, 2)` en **El Viaje** y el jefe final **La Caja Fuerte**. "
        "Cada fase donde se escribe código trae un límite de líneas recomendado (contador «Líneas: X / Límite»)."),
    2: ("Lógica", "Sala de Estrategia (mesa de cartas)",
        "Decisiones con `if`, `elif`, `else`, comparadores y `and` / `or` / `not`. Al ejecutar las cartas se voltean y cada pregunta se juzga con ✓ VERDADERO o ✗ FALSO."),
    3: ("Automatización", "Complejo industrial (edificio de 5 pisos con elevador)",
        "Ciclos `while` y `for`, contadores. Un letrero muestra en qué repetición va el ciclo; el piso 1 es la planta baja."),
    4: ("Modularidad", "Fábrica de robots (cada función se construye como una **máquina**; a veces con una pista para Robot1)",
        "Funciones: `def`, llamar una función, parámetros, `return`, variables locales y depuración de errores de ámbito y de orden."),
    5: ("Proyecto", "Taller de proyectos (la terminal y la memoria, en color rosa)",
        "No hay sintaxis nueva: cada nivel es un proyecto que integra `input()`, `if`, `while` y variables. Los niveles 1 a 3 se prueban con varios casos (si falla uno, no pasa) y el Nivel 4 es el proyecto libre que cierra CodeQuest."),
}
TIPOS = [
    ("EXPLORAR", "Solo hay que **ejecutar** el código que ya viene y observar qué pasa. Se pasa con cualquier ejecución sin errores."),
    ("PREDECIR", "No se escribe código: se lee un programa y se **elige qué resultado dará**."),
    ("MODIFICAR", "Viene un programa casi listo; hay que **cambiar una parte** para lograr el objetivo."),
    ("ESCRIBIR", "Se escribe el programa desde cero (o casi) siguiendo el enunciado."),
    ("RESOLVER", "Un reto más abierto: se combinan varias ideas del nivel."),
    ("DEBUG", "El programa tiene un **error**; hay que encontrarlo y corregirlo."),
    ("LIBRE", "Zona de práctica: no se evalúa nada, solo se experimenta."),
    ("ORDENAR", "Solo en el Nivel 0: **no hay código**; se hace clic en las tarjetas de un diagrama de flujo en el orden correcto. Si una tarjeta no toca todavía, Robot1 choca y se empieza de nuevo."),
]


def cargar():
    niveles = []
    for f in glob.glob(os.path.join(RAIZ, "levels", "mundo*", "level*.json")):
        niveles.append(json.load(open(f, encoding="utf8")))
    return sorted(niveles, key=lambda n: n["id"])


def carta(c):
    return f"{c['valor']}{SIMBOLO[c['palo']]}"


def mano_texto(cartas):
    total = sum(c["valor"] for c in cartas)
    return " ".join(carta(c) for c in cartas) + f" (total {total})"


def lista_es(items, conj="y"):
    items = list(items)
    if len(items) <= 1:
        return "".join(items)
    return ", ".join(items[:-1]) + f" {conj} " + items[-1]


def requisitos(req):
    if not req:
        return []
    out = []
    if req.get("construcciones"):
        out.append("Tu código debe usar: " + lista_es(f"`{c}`" for c in req["construcciones"]) + ".")
    if req.get("prohibe"):
        out.append("No debe usar: " + lista_es(f"`{c}`" for c in req["prohibe"]) + ".")
    if req.get("operador"):
        out.append(f"Debe usar el operador `{req['operador']}`.")
    if req.get("operadores"):
        out.append("Debe usar los operadores " + lista_es(f"`{o}`" for o in req["operadores"]) + ".")
    if req.get("variable"):
        out.append(f"Debe crear una variable llamada `{req['variable']}`.")
    return out


def lineas_texto(valores):
    if not valores:
        return "**no mostrar nada**"
    return "mostrar " + ", luego ".join(f"«{v}»" for v in valores)


def describir(v):
    """Una validación -> lista de frases (sin código)."""
    t = v.get("tipo", "ejecutado")
    out = []
    if t == "ejecutado" or t == "codigo_sin_error":
        out.append("Basta con ejecutar el programa sin errores.")
    elif t in ("output", "output_exacto"):
        out.append(f"El programa debe mostrar exactamente «{v['valorEsperado']}».")
    elif t == "output_contiene":
        out.append(f"La salida debe contener «{v.get('valor', v.get('valorEsperado'))}».")
    elif t == "output_con_variable":
        out.append(f"Debe mostrar «{v['valorEsperado']}» y el código tiene que crear la variable `{v['variableRequerida']}`.")
    elif t == "output_lineas":
        valores = v.get("valores", [])
        out.append("El programa **no debe mostrar nada**." if not valores else "El programa debe " + lineas_texto(valores) + ".")
    elif t == "variables":
        out.append("Al terminar, " + lista_es(f"`{n}` debe valer {json.dumps(x, ensure_ascii=False)}" for n, x in v["variables"].items()) + ".")
    elif t == "todos":
        for c in v["condiciones"]:
            out.extend(describir(c))
    elif t == "elevador_piso":
        out.append(f"El elevador debe quedar en el piso {v['valorEsperado']}" + (" (planta baja)." if v["valorEsperado"] == 1 else "."))
    elif t == "elevador_entrega":
        out.append("Todos los pasajeros deben quedar entregados en la planta baja y la cabina vacía.")
    elif t == "funcion_definida":
        n = v.get("parametros")
        out.append(f"Debe definir una función llamada `{v['nombre']}`" + ("" if n is None else f" con {n} parámetro(s)") + ".")
    elif t == "funcion_llamada":
        out.append(f"Debe llamar a `{v['nombre']}()` al menos {v.get('minimo', 1)} vez/veces.")
    elif t == "funcion_retorna":
        out.append(f"La función `{v['nombre']}` debe **devolver** un valor con `return` (no solo mostrarlo).")
    elif t == "min_lineas":
        out.append(f"El programa debe tener **al menos {v['minimo']} líneas de código** (las líneas vacías y los comentarios no cuentan).")
    elif t == "ensamble":
        out.append("Debe definir **exactamente** estas funciones: " + lista_es(f"`{p}()`" for p in v["partes"]) + ", y llamar a cada una al menos una vez, **en ese orden** (la primera llamada de cada una).")
    elif t == "posicion":
        out.append(f"Robot1 debe terminar en la casilla ({v['valorEsperado'][0]},{v['valorEsperado'][1]}).")
    elif t == "objetivos":
        out.append("Robot1 debe pisar **todas** las banderas del mapa.")
    elif t in ("estado", "estado_variable"):
        if v.get("posicionEsperada"):
            out.append(f"Robot1 debe terminar en la casilla ({v['posicionEsperada'][0]},{v['posicionEsperada'][1]}).")
        if v.get("direccionEsperada"):
            out.append(f"Robot1 debe quedar mirando al **{v['direccionEsperada']}**.")
        if v.get("energiaMinima") is not None:
            out.append(f"Le deben quedar al menos {v['energiaMinima']}% de energía.")
        if v.get("outputContiene"):
            out.append(f"La salida debe contener «{v['outputContiene']}».")
        if v.get("outputEsperado"):
            out.append(f"El programa debe mostrar exactamente «{v['outputEsperado']}».")
        if v.get("todosLosObjetivos"):
            out.append("Robot1 debe pisar todas las banderas del mapa.")
    elif t == "error_esperado":
        out.append("Esta fase **busca un error a propósito**: el programa debe fallar" + (f" con el error `{v['codigoError']}`." if v.get("codigoError") else "."))
    elif t in ("posicion_con_operacion", "posicion_con_variable", "posicion_sin_numero_literal"):
        out.append(f"Robot1 debe terminar en la casilla ({v['valorEsperado'][0]},{v['valorEsperado'][1]}).")
        if v.get("operadorRequerido"):
            out.append(f"Y el código debe usar el operador `{v['operadorRequerido']}`.")
        if v.get("variableRequerida"):
            out.append(f"Y el código debe crear la variable `{v['variableRequerida']}`.")
        if v.get("numeroProhibido") is not None:
            out.append(f"Sin escribir el número {v['numeroProhibido']} directamente.")
    elif t == "elevador_estado":
        if "abordo" in v:
            out.append(f"Al terminar deben ir {v['abordo']} pasajeros en la cabina.")
    out.extend(requisitos(v.get("requiere")))
    return out


def escenario_caso(nivel, fase, caso):
    esc = caso.get("escenario", {})
    tipo = nivel["escenario"]["tipo"]
    if tipo == "cartas":
        base = f"Cartas: {mano_texto(esc['cartas'])}"
        if "variables" in esc and "numero" in esc["variables"]:
            base += f" · `numero` = {esc['variables']['numero']}"
        return base
    if tipo == "elevador":
        pas = esc.get("pasajeros", fase.get("escenario", {}).get("pasajeros", nivel["escenario"].get("pasajeros", [])))
        inicio = esc.get("pisoInicial", fase.get("escenario", {}).get("pisoInicial", nivel["escenario"].get("pisoInicial", 1)))
        txt = f"El elevador empieza en el piso {inicio}"
        txt += "; sin pasajeros" if not pas else "; pasajeros esperando en " + lista_es([f"piso {p}" for p in pas])
        return txt
    return ""


def esperado_caso(esp):
    """Versión corta para la tabla de casos."""
    t = esp.get("tipo")
    if t == "ejecutado":
        return "cualquier ejecución sirve"
    if t == "output_lineas":
        v = esp.get("valores", [])
        return "**No mostrar nada**" if not v else "Mostrar " + ", luego ".join(f"«{x}»" for x in v)
    if t == "elevador_entrega":
        return "Entregar a todos en la planta baja"
    if t == "elevador_piso":
        return f"Terminar en el piso {esp['valorEsperado']}"
    if t == "todos":
        return " · ".join(esperado_caso(c) for c in esp["condiciones"])
    return " ".join(describir(esp))


def descripcion_escenario_fase(nivel, fase):
    tipo = nivel["escenario"]["tipo"]
    esc = {**nivel["escenario"], **fase.get("escenario", {})}
    if tipo == "cartas" and esc.get("cartas") and not fase.get("casos"):
        return f"Mesa: {mano_texto(esc['cartas'])}."
    if tipo == "cartas" and fase["tipo"] in ("ESCRIBIR", "RESOLVER", "DEBUG") and not esc.get("mostrarCartas"):
        return "Las cartas empiezan boca abajo y se voltean al ejecutar."
    if tipo == "elevador" and not fase.get("casos"):
        pas = esc.get("pasajeros", [])
        txt = f"El elevador empieza en el piso {esc.get('pisoInicial', 1)}"
        txt += "; sin pasajeros." if not pas else f"; pasajeros en {lista_es([f'piso {p}' for p in pas])}."
        return txt
    if tipo in ("laboratorio", "fabrica") and fase["tipo"] != "PREDECIR":
        if tipo == "fabrica" and esc.get("ensamble"):
            return "La línea de ensamble muestra una máquina por función y, abajo, un **Robot1 gigante** que se va armando (cabeza, brazos y piernas) conforme se llama a cada función."
        if tipo == "fabrica" and not esc.get("robot"):
            return "La **línea de ensamble** muestra una máquina por cada `def`; en cada llamada viaja una caja de materiales con los parámetros, aparecen las variables locales dentro de la máquina y sale una caja de producto terminado (verde con el valor del `return`, gris con `None` si no hubo) o una burbuja si hay `print`."
        partes = []
        if esc.get("ancho"):
            partes.append(f"cuadrícula de {esc['ancho']}×{esc.get('alto', 1)}")
        if esc.get("robotPosicion") is not None:
            partes.append(f"Robot1 empieza en ({esc['robotPosicion'][0]},{esc['robotPosicion'][1]}) mirando al {esc.get('robotDireccion', 'este')}")
        objs = esc.get("objetivosPosicion") or ([esc["objetivoPosicion"]] if esc.get("objetivoPosicion") else [])
        if objs:
            partes.append("bandera en " + lista_es([f"({o[0]},{o[1]})" for o in objs]))
        if esc.get("obstaculos"):
            partes.append(f"{len(esc['obstaculos'])} muros")
        if esc.get("objetos"):
            partes.append("objetos en " + lista_es([f"({o['posicion'][0]},{o['posicion'][1]})" for o in esc["objetos"]]))
        return ("Mundo 2D: " + "; ".join(partes) + ".") if partes else ""
    if tipo == "diagrama":
        extra = ", con una llave en el pasillo" if esc.get("llaveX") is not None else ""
        extra += " y Robot1 apagado" if esc.get("apagado") else ""
        return f"Un pasillo de {esc.get('largo', 5)} casillas con una puerta{extra}."
    return ""


def limpiar(t):
    return re.sub(r"\s+", " ", t).strip()


def seccion_fase(nivel, fase, n):
    L = []
    L.append(f"#### Fase {n} · {fase['tipo']} — «{fase['titulo']}»  `{fase['id']}`")
    L.append("")
    L.append(f"**Qué hay que hacer:** {limpiar(fase['enunciado'])}")
    L.append("")
    sc = descripcion_escenario_fase(nivel, fase)
    if sc:
        L.append(f"**En pantalla:** {sc}")
        L.append("")

    L.append("**Cómo se pasa:**")
    L.append("")
    if fase["tipo"] == "ORDENAR":
        texto = {t["id"]: t["texto"] for t in fase["tarjetas"]}
        L.append("- Hay que hacer clic en las tarjetas en este orden: " + " → ".join(f"**{texto[i]}**" for i in fase["ordenCorrecto"]) + ".")
        L.append("- Cada tarjeta correcta se ejecuta en el pasillo; una tarjeta equivocada hace que Robot1 choque y todo vuelve a empezar.")
    elif fase["tipo"] == "PREDECIR":
        corr = next(o for o in fase["opciones"] if o["id"] == fase["respuestaCorrecta"])
        for o in fase["opciones"]:
            marca = "✅" if o["id"] == fase["respuestaCorrecta"] else "▫️"
            L.append(f"- {marca} {o['texto']}")
        L.append(f"- Se pasa eligiendo: **{corr['texto']}**.")
    elif fase["tipo"] == "LIBRE":
        L.append("- No hay objetivo: escribe y ejecuta lo que quieras. La fase se completa al ejecutar.")
    elif fase.get("casos") and all((c.get("esperado") or {}).get("tipo") == "ejecutado" for c in fase["casos"]):
        L.append("- Basta con ejecutar el programa sin errores. Los botones de arriba del escenario permiten probarlo en distintas situaciones:")
        for c in fase["casos"]:
            L.append(f"  - **{c['etiqueta']}:** {escenario_caso(nivel, fase, c)}")
    elif fase.get("casos"):
        req = requisitos(fase["validacion"].get("requiere"))
        L.append("- Tu programa se prueba en **todos** estos casos (se ve uno con animación y los demás se prueban en silencio). Hay que acertar en cada uno:")
        L.append("")
        L.append("  | Caso | Situación | Resultado esperado |")
        L.append("  |---|---|---|")
        for c in fase["casos"]:
            esp = c.get("esperado") or fase["validacion"].get("esperado") or {}
            L.append(f"  | {c['etiqueta']} | {escenario_caso(nivel, fase, c)} | {esperado_caso(esp)} |")
        L.append("")
        for r in req:
            L.append(f"- {r}")
    else:
        for frase in describir(fase["validacion"]):
            L.append(f"- {frase}")
        if fase["tipo"] == "EXPLORAR" and fase["validacion"].get("tipo") != "ejecutado":
            L.append("- El código que viene ya cumple esto: solo hay que ejecutarlo.")
    L.append("")

    if fase.get("entradasEstudiante"):
        L.append(f"> ⌨️ Esta fase pide datos con `input()` (siempre llega como texto): cuando la terminal pregunte, escribe **{', '.join(str(x) for x in fase['entradasEstudiante'])}**.")
        L.append("")
    if fase.get("pistas"):
        L.append("**Pistas del juego:** " + " · ".join(limpiar(p) for p in fase["pistas"]))
        L.append("")
    if fase.get("mensajeNoLogrado"):
        L.append(f"**Si no pasa, el juego dice:** «{limpiar(fase['mensajeNoLogrado'])}»")
        L.append("")
    if fase.get("codigoInicial") and fase["tipo"] in ("PREDECIR", "MODIFICAR", "DEBUG"):
        L.append("<details><summary>Ver el código de la fase</summary>")
        L.append("")
        L.append("```python")
        L.append(fase["codigoInicial"])
        L.append("```")
        L.append("</details>")
        L.append("")
    if fase.get("solucionReferencia") and fase["tipo"] not in ("PREDECIR", "EXPLORAR", "LIBRE"):
        L.append("<details><summary>Ver una solución de ejemplo (spoiler)</summary>")
        L.append("")
        L.append("```python")
        L.append(fase["solucionReferencia"])
        L.append("```")
        L.append("</details>")
        L.append("")
    return L


def principal():
    niveles = cargar()
    por_mundo = {}
    for n in niveles:
        por_mundo.setdefault(n["mundo"], []).append(n)
    # Mismo orden que el catálogo del juego: por ordinal si TODOS los niveles del mundo lo declaran (Mundo 1), si no por id.
    for lista in por_mundo.values():
        if all(isinstance(n.get("ordinal"), int) for n in lista):
            lista.sort(key=lambda n: n["ordinal"])
    # Número que ve el estudiante dentro de su mundo (igual que el catálogo del juego): el Nivel 0 declara su ordinal y el resto sigue contando.
    ordinal = {}
    for lista in por_mundo.values():
        siguiente = 1
        for n in lista:
            ordinal[n["id"]] = n["ordinal"] if isinstance(n.get("ordinal"), int) else siguiente
            siguiente = ordinal[n["id"]] + 1

    L = []
    L.append("# CodeQuest — Guía de niveles y fases (Mundos 1 a 5)")
    L.append("")
    L.append("Guía para **facilitar** el juego: qué trabaja cada nivel, qué pide cada fase y **cómo se pasa**, sin necesidad de leer código. "
             "Las soluciones de ejemplo están escondidas (spoiler) al final de cada fase de escritura.")
    L.append("")
    L.append("> Se genera automáticamente desde los niveles del juego (`python3 herramientas/generar_guia.py`), así que siempre coincide con lo que ven los estudiantes.")
    L.append("")
    L.append("## Cómo funciona todo")
    L.append("")
    L.append("- **Mundos:** se juegan en orden. Un mundo se abre al completar **todos** los niveles del anterior, **incluidos sus Niveles Jefe** (👑: sin botón de pistas, editor en blanco y un solo enunciado; cierran cada mundo, y el Mundo 1 tiene además un jefe intermedio, el Laberinto ciego). El **Nivel 0** (diagramas de flujo) es el primero del Mundo 1 y se da por hecho si ya se había jugado antes.")
    L.append("- **Niveles:** cada nivel tiene de 3 a 5 fases que se hacen en orden (el Nivel Jefe tiene una sola). En el juego los niveles se numeran dentro de su mundo (Nivel 0, 1, 2…); entre paréntesis va el número interno.")
    L.append("- **Estrellas por nivel:** ⭐ completar todas las fases · ⭐⭐ además, sin usar pistas · ⭐⭐⭐ además, acertando a la **primera** en cada fase.")
    L.append("- **Casos:** en las fases de lógica y ciclos el programa se prueba en varias mesas o edificios. Un programa que solo funciona para el caso que se ve **no pasa**.")
    L.append("- **Sangría:** dentro de `if`, `while` y `for` las líneas van movidas 4 espacios (tecla **Tab**). Cada pregunta o ciclo termina en dos puntos `:`.")
    L.append("")
    L.append("### Tipos de fase")
    L.append("")
    L.append("| Tipo | Qué es |")
    L.append("|---|---|")
    for t, d in TIPOS:
        L.append(f"| **{t}** | {d} |")
    L.append("")

    L.append("## Resumen")
    L.append("")
    for m, (nombre, lugar, _) in MUNDOS.items():
        L.append(f"### Mundo {m} · {nombre}")
        L.append("")
        L.append("| Nivel | Nombre | Concepto | Fases |")
        L.append("|---|---|---|---|")
        for n in por_mundo[m]:
            fases = ", ".join(f["tipo"].capitalize() for f in n["fases"])
            marca = " 👑" if n.get("jefe") else ""
            L.append(f"| {ordinal[n['id']]}{marca} (id {n['id']}) | {n['nombre']} | {n['concepto']} | {len(n['fases'])}: {fases} |")
        L.append("")

    for m, (nombre, lugar, aprendes) in MUNDOS.items():
        niv = por_mundo[m]
        L.append("---")
        L.append("")
        L.append(f"## Mundo {m} · {nombre}")
        L.append("")
        L.append(f"- **Escenario:** {lugar}.")
        L.append(f"- **Qué se aprende:** {aprendes}")
        L.append(f"- **Niveles:** {len(niv)} · **Estrellas posibles:** {len(niv) * 3}")
        L.append("")
        for n in niv:
            etiqueta = "Nivel Jefe 👑" if n.get("jefe") else f"Nivel {ordinal[n['id']]}"
            L.append(f"### {etiqueta} del Mundo {m} (id {n['id']}) — {n['nombre']}")
            L.append("")
            L.append(f"**Concepto:** {n['concepto']}  ·  **Historia:** _{limpiar(n['narrativa'])}_")
            L.append("")
            if n.get("jefe"):
                L.append("> 👑 **Nivel Jefe:** no hay botón de pistas, el editor empieza en blanco" + (" y se prueba en varios casos." if n["fases"][0].get("casos") else "."))
                L.append("")
            for j, f in enumerate(n["fases"], 1):
                L.extend(seccion_fase(n, f, j))
            if n.get("narrativaSiguienteMundo"):
                L.append(f"> 🎬 **Al terminar este nivel** aparece la {'pantalla final de CodeQuest (con las estrellas totales y las líneas de código escritas)' if n['mundo'] == max(MUNDOS) else 'pantalla de transición'}: _{limpiar(n['narrativaSiguienteMundo'])}_")
                L.append("")

    destino = os.path.join(RAIZ, "docs", "GUIA_NIVELES_MUNDOS_1_A_5.md")
    with open(destino, "w", encoding="utf8") as f:
        f.write("\n".join(L).rstrip() + "\n")
    print(f"Guía generada: {os.path.relpath(destino, RAIZ)} ({len(L)} líneas)")


if __name__ == "__main__":
    principal()
