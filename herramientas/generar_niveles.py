#!/usr/bin/env python3
"""
Genera los JSON de los niveles (Mundo 1 · Fundamentos y Datos, Mundos 2 a 5, los jefes y el Nivel 0).

Por qué existe: en los Mundos 3 y 4 cada fase se valida con varios "casos"
(mesas de cartas, edificios con pasajeros...) y es fácil equivocarse al
escribirlos a mano. Aquí las manos de cartas se escriben una sola vez y las
variables (total, color1...) se calculan en el motor, no a mano.

Uso:  python3 herramientas/generar_niveles.py   (desde la raíz del proyecto)
Después: npm test   (comprueba que CADA solución pasa y que las trampas NO pasan)
"""
import glob
import json
import os

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
ESTRELLAS = {"base": True, "sinPistas": True, "primerIntento": True}


def L(*lineas):
    return "\n".join(lineas)


def guardar(nivel):
    carpeta = os.path.join(RAIZ, "levels", f"mundo{nivel['mundo']}")
    os.makedirs(carpeta, exist_ok=True)
    ruta = os.path.join(carpeta, f"level{nivel['id']}.json")
    with open(ruta, "w", encoding="utf8") as f:
        json.dump(nivel, f, ensure_ascii=False, indent=2)
        f.write("\n")


def nivel(id, mundo, nombre, concepto, evaluado, narrativa, escenario, fases, siguiente=None):
    n = {
        "id": id,
        "mundo": mundo,
        "nombre": nombre,
        "concepto": concepto,
        "concepto_evaluado": evaluado,
        "narrativa": narrativa,
    }
    if siguiente:
        n["narrativaSiguienteMundo"] = siguiente
    n["escenario"] = escenario
    n["estrellas"] = dict(ESTRELLAS)
    n["fases"] = fases
    return n


def fase(id, tipo, titulo, enunciado, permisos, metodos=(), validacion=None, codigo="", solucion=None,
         pistas=(), retro="", no_logrado=None, escenario=None, casos=None, opciones=None, correcta=None,
         trampas=(), entradas=None, etiqueta_entrada=None):
    f = {"id": id, "tipo": tipo, "titulo": titulo, "enunciado": enunciado, "codigoInicial": codigo}
    if solucion is not None:
        f["solucionReferencia"] = solucion
    f["instruccionesPermitidas"] = list(permisos)
    f["metodosPermitidos"] = list(metodos)
    if escenario:
        f["escenario"] = escenario
    if casos:
        f["casos"] = casos
    if opciones:
        f["opciones"] = [{"id": i, "texto": t} for i, t in opciones]
        f["respuestaCorrecta"] = correcta
    if entradas is not None:
        f["entradasEstudiante"] = entradas
    if etiqueta_entrada:
        f["etiquetaEntrada"] = etiqueta_entrada
    f["validacion"] = validacion or {"tipo": "ejecutado"}
    if retro:
        f["retroalimentacion"] = retro
    if pistas:
        f["pistas"] = list(pistas)
    if no_logrado:
        f["mensajeNoLogrado"] = no_logrado
    trampas = list(trampas)
    if tipo in ("MODIFICAR", "DEBUG") and codigo and solucion is not None and codigo != solucion:
        trampas.insert(0, codigo)  # el programa roto/sin modificar jamás debe pasar
    if trampas:
        f["solucionesIncorrectas"] = trampas
    return f


# ---------------------------------------------------------------- utilidades
PALOS = {"C": "corazones", "D": "diamantes", "T": "treboles", "P": "picas"}


def mano(*cartas):
    """mano((10,'C'), 9, ...) -> [{valor, palo}]; un número solo = picas."""
    res = []
    for c in cartas:
        valor, palo = (c, "P") if isinstance(c, int) else c
        res.append({"valor": valor, "palo": PALOS[palo]})
    return res


def caso_cartas(etiqueta, cartas, lineas, **extra):
    esc = {"cartas": mano(*cartas)}
    esc.update(extra)
    return {"etiqueta": etiqueta, "escenario": esc, "esperado": {"tipo": "output_lineas", "valores": lineas}}


def caso_libre(etiqueta, cartas, **extra):
    esc = {"cartas": mano(*cartas)}
    esc.update(extra)
    return {"etiqueta": etiqueta, "escenario": esc, "esperado": {"tipo": "ejecutado"}}


class Mesa:
    """La mano de cartas tal como la ve el programa del estudiante (para calcular lo esperado)."""

    def __init__(self, cartas):
        self.v = [c["valor"] for c in cartas]
        self.colores = ["roja" if c["palo"] in ("corazones", "diamantes") else "negra" for c in cartas]
        self.total = sum(self.v)
        self.numero = self.total
        self.carta1, self.color1 = self.v[0], self.colores[0]
        self.carta2 = self.v[1] if len(self.v) > 1 else None
        self.color2 = self.colores[1] if len(self.colores) > 1 else None


def casos_mesas(manos, regla, con_numero=False, **extra):
    """Un caso por mano. `regla(Mesa)` devuelve las líneas que debe imprimir la solución."""
    casos = []
    for i, cartas in enumerate(manos, 1):
        m = mano(*cartas)
        mesa = Mesa(m)
        esc = {"cartas": m, **extra}
        if con_numero:
            esc["variables"] = {"numero": mesa.total}
        casos.append({"etiqueta": f"Mesa {i} · {mesa.total}", "escenario": esc,
                      "esperado": {"tipo": "output_lineas", "valores": regla(mesa)}})
    return casos


def libres(manos, **extra):
    """Casos solo para explorar (cualquier ejecución sirve)."""
    return [caso_libre(f"Mesa {i} · {sum(c if isinstance(c, int) else c[0] for c in cartas)}", cartas, **extra)
            for i, cartas in enumerate(manos, 1)]


def casos_val(requiere=None):
    v = {"tipo": "casos"}
    if requiere:
        v["requiere"] = requiere
    return v


def caso_elev(etiqueta, pasajeros, esperado, **extra):
    esc = {"pasajeros": pasajeros}
    esc.update(extra)
    return {"etiqueta": etiqueta, "escenario": esc, "esperado": esperado}


# =============================================================== MUNDO 1 · FUNDAMENTOS Y DATOS (fusión de los antiguos Mundos 1 y 2)
# 21 niveles: Nivel 0 (tutorial) + 18 niveles + 2 jefes. Cada nivel elige su escenario (escenario.tipo): el robot del
# laboratorio, la consola de datos o un minijuego (alcancía, semáforo, vasos, receta, pozo, cronómetro, boleta, viaje y
# caja fuerte). Los niveles 0-5, 7 y 9 son JSON escritos a mano (Bloque A y los dos niveles de robot que se conservan);
# aquí se generan los demás.
#
#   Bloque A · Primeros pasos (robot)        0 Ordenar · 1 Escribir · 2 Escribir · 3 Resolver · 4 Resolver · 5 Debug
#   Bloque B · Los primeros datos            6 Alcancía · 7 La terminal (robot) · 8 Semáforos
#   Bloque C · Combinando lógica y datos     9 La salida (robot) · 10 Vasos · 11 Identificadores · 12 Receta · 13 Energía
#                                            14 👑 Laberinto ciego (jefe intermedio)
#   Bloque D · Ciclos y cierre               15 Pozo · 16 Puente de datos (robot) · 17 Cronómetro · 18 Boleta · 19 Viaje
#                                            20 👑 La Caja Fuerte (jefe final)
#
# Los ids reutilizan los del Mundo 1 y 2 anteriores (0-18, 44 y 45); el orden lo da `ordinal` (lo que ve el estudiante).
# Cada fase donde se escribe código lleva `max_lineas_recomendadas` (el largo de su solución de referencia): el contador
# «Líneas: X / Límite» del editor se pone rojo si el estudiante se pasa, pero nunca bloquea.
D = {"tipo": "datos", "capacidad": 8}
P1 = ["asignacion", "print"]
P2 = ["asignacion", "print", "input"]
P3 = ["asignacion", "print", "input", "int", "float", "str"]  # + conversiones de tipo de Python
M1_ROBOT = ["avanzar", "retroceder", "girar", "hablar", "recoger", "soltar", "mirar", "posicion", "energia"]
PUEBLO = "Robot1 salió del laboratorio y llegó al pueblo. Sus habitantes tienen problemas reales que se resuelven con datos."


def lineas_de(codigo):
    return len([l for l in codigo.split("\n") if l.strip()])


def con_limite(f):
    """Fases donde se escribe código: el límite recomendado del contador de líneas es el largo de la solución de referencia."""
    if f["tipo"] in ("ESCRIBIR", "RESOLVER", "MODIFICAR", "DEBUG") and f.get("solucionReferencia"):
        f["max_lineas_recomendadas"] = lineas_de(f["solucionReferencia"])
    return f


def nivel_m1(id, ordinal, nombre, concepto, evaluado, narrativa, escenario, fases, siguiente=None):
    n = nivel(id, 1, nombre, concepto, evaluado, narrativa, escenario, [con_limite(f) for f in fases], siguiente)
    # `ordinal` justo después del nombre, como en los JSON escritos a mano
    return {k: v for k, v in list(n.items())[:3] + [("ordinal", ordinal)] + list(n.items())[3:]}


def caso_vars(etiqueta, variables, esperado, entradas=None, escenario=None):
    esc = dict(escenario or {})
    esc["variables"] = variables
    c = {"etiqueta": etiqueta, "escenario": esc, "esperado": esperado}
    if entradas is not None:
        c["entradas"] = [str(x) for x in entradas]
    return c


def out(*valores):
    return {"tipo": "output_lineas", "valores": [str(v) for v in valores]}


def py(v):
    """Cómo lo imprime Python (True/False, 5.0, 163.33…)."""
    return str(v)


def mundo1():
    limpiar_mundo_excepto(1, conservar=[0, 1, 2, 3, 4, 5, 7, 9])
    n = []

    # ------------------------------------------------------------------ 6 · La Alcancía (reasignación)
    ALC = {"tipo": "alcancia", "variable": "ahorro", "semanas": 4, "meta": 400}
    n.append(nivel_m1(6, 6, "La Alcancía", "variables y reasignación (ahorro = ahorro + mesada)", "reasignacion_variables",
        PUEBLO + " Lupita quiere juntar $400 en su alcancía en 4 semanas. Una variable será su alcancía: una caja con nombre que guarda el dinero.", ALC, [
        fase("6.1", "EXPLORAR", "Tu primera variable",
             "Concepto nuevo: una VARIABLE es una caja con nombre que guarda un valor. ahorro = 0 crea la caja ahorro con un 0 adentro. Después, ahorro = ahorro + 100 toma lo que ya había, le suma 100 y lo guarda otra vez en la MISMA caja (eso es reasignar). Ejecuta y mira caer la moneda.",
             P1, codigo=L("ahorro = 0", "ahorro = ahorro + 100", "print(ahorro)"),
             retro="La alcancía no se cambió por otra: la misma variable ahorro pasó de 0 a 100.",
             pistas=["Mira el panel de Memoria: el valor de ahorro cambia."]),
        fase("6.2", "PREDECIR", "¿Cuánto hay en la alcancía?", "Lee el programa con calma, renglón por renglón. ¿Qué muestra al final?", P1,
             codigo=L("ahorro = 50", "ahorro = ahorro + 100", "ahorro = ahorro + 100", "print(ahorro)"),
             opciones=[("a", "100"), ("b", "250"), ("c", "50")], correcta="b",
             retro="Correcto: 50, luego 150 y luego 250. Cada reasignación parte del valor que ya tenía la variable.",
             pistas=["Ve sumando: empieza en 50."]),
        fase("6.3", "MODIFICAR", "La mesada cambia",
             "La mesada se guarda en su propia variable. Cambia SOLO el valor de mesada para que, después de dos semanas, la alcancía tenga 300.", P1,
             codigo=L("mesada = 100", "ahorro = 0", "ahorro = ahorro + mesada", "ahorro = ahorro + mesada", "print(ahorro)"),
             solucion=L("mesada = 150", "ahorro = 0", "ahorro = ahorro + mesada", "ahorro = ahorro + mesada", "print(ahorro)"),
             validacion={"tipo": "todos", "condiciones": [{"tipo": "variables", "variables": {"ahorro": 300}}, out(300), {"tipo": "alcancia_depositos", "minimo": 2}],
                         "requiere": {"variable": "mesada"}},
             retro="Con una variable para la mesada, basta cambiar un número y todo el programa se ajusta.",
             pistas=["Dos mesadas iguales deben sumar 300."], no_logrado="Después de dos depósitos de mesada, ahorro debe valer 300.",
             trampas=[L("ahorro = 300", "print(ahorro)"), L("mesada = 100", "ahorro = 0", "ahorro = ahorro + 300", "print(ahorro)")]),
        fase("6.4", "ESCRIBIR", "Cuatro semanas de ahorro",
             "Empieza con ahorro = 0 y mesada = 100. Durante 4 semanas, cada semana suma la mesada a la alcancía con ahorro = ahorro + mesada. Python tiene un atajo que hace lo mismo: ahorro += mesada. Al final muestra ahorro (400).",
             P1, solucion=L("ahorro = 0", "mesada = 100", "ahorro += mesada", "ahorro += mesada", "ahorro += mesada", "ahorro += mesada", "print(ahorro)"),
             validacion={"tipo": "todos", "condiciones": [out(400), {"tipo": "alcancia_depositos", "minimo": 4}], "requiere": {"variable": "mesada"}},
             retro="¡Meta cumplida! ahorro += mesada es lo mismo que ahorro = ahorro + mesada, pero más corto.",
             pistas=["Cuatro semanas = cuatro reasignaciones.", "ahorro += mesada"],
             no_logrado="Deben caer 4 depósitos en la alcancía (uno por semana) y mostrarse 400.",
             trampas=[L("ahorro = 400", "print(ahorro)"), L("ahorro = 0", "mesada = 100", "ahorro = ahorro + 400", "print(ahorro)"),
                      L("ahorro = 0", "ahorro += 100", "ahorro += 100", "ahorro += 100", "ahorro += 100", "print(ahorro)")]),
    ]))

    # ------------------------------------------------------------------ 8 · Semáforos y Decisiones (if, and, or)
    SEM = {"tipo": "semaforo", "variables": {"color": "rojo", "peaton": False}}
    P_SEM = ["print", "if", "else", "and", "or", "booleanos"]

    def cruces(regla, combinaciones):
        return [caso_vars(f'{c} · {"con" if p else "sin"} peatón', {"color": c, "peaton": p}, out(regla(c, p))) for c, p in combinaciones]

    n.append(nivel_m1(8, 8, "Semáforos y Decisiones", "if / else, comparaciones (==) y and / or", "decisiones_basicas",
        "En la avenida principal hay un cruce peligroso. El auto autónomo del pueblo necesita reglas para decidir cuándo avanzar y cuándo frenar.", SEM, [
        fase("8.1", "EXPLORAR", "El semáforo pregunta",
             'Concepto nuevo: if hace una PREGUNTA y elige qué hacer. color == "rojo" compara (== significa «¿es igual?») y responde True o False. Si es True se ejecuta lo de adentro del if; si es False, lo del else. Las líneas de adentro llevan 4 espacios de sangría. Ejecuta: el semáforo está en rojo.',
             P_SEM, codigo=L('if color == "rojo":', '    print("Frenar")', "else:", '    print("Avanzar")'),
             retro="La condición color == \"rojo\" dio True, así que se ejecutó print(\"Frenar\").",
             pistas=["Arriba a la izquierda de la escena aparece la condición y su resultado."]),
        fase("8.2", "PREDECIR", "Las dos condiciones", 'and exige que las DOS condiciones sean True. Aquí el semáforo está en rojo pero NO hay peatón. ¿Qué muestra el programa?', P_SEM,
             codigo=L('color = "rojo"', "peaton = False", 'if color == "rojo" and peaton == True:', '    print("Frenar")', "else:", '    print("Avanzar")'),
             opciones=[("a", "Frenar"), ("b", "Avanzar"), ("c", "Las dos cosas")], correcta="b",
             retro="Correcto: color == \"rojo\" es True, pero peaton == True es False, y con and basta que una sea False para que todo sea False.",
             pistas=["¿Las dos condiciones son verdaderas?"]),
        fase("8.3", "ESCRIBIR", "Rojo o peatón",
             'El auto debe frenar si el semáforo está en rojo O si hay un peatón cruzando (peaton == True). En cualquier otro caso, avanza. Usa if, else y or, y muestra "Frenar" o "Avanzar". Se prueba con 4 cruces.',
             P_SEM, solucion=L('if color == "rojo" or peaton == True:', '    print("Frenar")', "else:", '    print("Avanzar")'),
             casos=cruces(lambda c, p: "Frenar" if c == "rojo" or p else "Avanzar", [("verde", False), ("rojo", False), ("verde", True), ("amarillo", False)]),
             validacion=casos_val({"construcciones": ["if", "or"]}),
             retro="Con or basta que UNA condición sea True para frenar.",
             pistas=["Une las dos preguntas con or.", 'if color == "rojo" or peaton == True:'],
             no_logrado="Revisa los 4 cruces: hay que frenar con rojo o con peatón.",
             trampas=[L('if color == "rojo":', '    print("Frenar")', "else:", '    print("Avanzar")'), L('print("Frenar")')]),
        fase("8.4", "RESOLVER", "Solo con luz verde",
             'La patrulla escolar puso una regla más estricta: el auto solo avanza si el semáforo está en verde Y no hay peatón (peaton == False). Muestra "Avanzar" en ese caso y "Frenar" en cualquier otro. Se prueba con 5 cruces.',
             P_SEM, solucion=L('if color == "verde" and peaton == False:', '    print("Avanzar")', "else:", '    print("Frenar")'),
             casos=cruces(lambda c, p: "Avanzar" if c == "verde" and not p else "Frenar", [("verde", False), ("verde", True), ("rojo", False), ("amarillo", False), ("rojo", True)]),
             validacion=casos_val({"construcciones": ["if", "and"]}),
             retro="¡Cruce seguro! and pide que se cumplan las dos condiciones a la vez.",
             pistas=["Une las dos condiciones con and."],
             no_logrado="Solo se avanza con verde y sin peatón; todo lo demás es Frenar.",
             trampas=[L('if color == "verde":', '    print("Avanzar")', "else:", '    print("Frenar")'),
                      L('if color == "verde" or peaton == False:', '    print("Avanzar")', "else:", '    print("Frenar")')]),
    ]))

    # ------------------------------------------------------------------ 10 · El Intercambio (variable temporal)
    VAS = {"tipo": "vasos", "vasos": ["vasoA", "vasoB", "temp"], "variables": {"vasoA": "agua", "vasoB": "jugo"}}
    VAS3 = {"vasos": ["vasoA", "vasoB", "vasoC", "temp"], "variables": {"vasoA": "agua", "vasoB": "jugo", "vasoC": "leche"}}
    pares = [("agua", "jugo"), ("leche", "cafe"), ("te", "refresco")]
    ternas = [("agua", "jugo", "leche"), ("cafe", "te", "limonada"), ("refresco", "chocolate", "agua")]
    n.append(nivel_m1(10, 10, "El Intercambio", "intercambiar variables con una temporal (temp)", "intercambio_variables",
        "En la cafetería del pueblo los pedidos salieron cruzados: el agua está en el vaso del jugo y al revés. Hay que intercambiarlos sin tirar nada.", VAS, [
        fase("10.1", "EXPLORAR", "Copiar no es mover",
             "Cada vaso es una variable y su líquido es un texto. vasoA = vasoB COPIA el líquido de B en A. Ejecuta y fíjate: ¿qué le pasa al agua que tenía vasoA?",
             P1, codigo=L("vasoA = vasoB", "print(vasoA)", "print(vasoB)"),
             retro="vasoA recibió una copia del jugo y su agua se perdió para siempre: una variable solo guarda UN valor.",
             pistas=["Mira el aviso rojo arriba de los vasos."]),
        fase("10.2", "PREDECIR", "¿Dónde quedó el agua?", "Después de vasoA = vasoB, ¿qué tienen los vasos?", P1,
             codigo=L("vasoA = vasoB", "print(vasoA)", "print(vasoB)"),
             opciones=[("a", "Los dos tienen jugo y el agua se perdió"), ("b", "Se intercambiaron: A tiene jugo y B tiene agua"), ("c", "vasoB quedó vacío")], correcta="a",
             retro="Correcto: asignar copia el valor; el valor viejo de vasoA se reemplaza y ya no está en ningún lado.",
             pistas=["vasoB no cambió en ningún renglón."]),
        fase("10.3", "DEBUG", "El intercambio roto",
             "Este programa quería intercambiar los líquidos, pero los dos vasos terminan iguales. Usa el vaso temp para guardar el líquido de vasoA ANTES de que se pierda (temp = vasoA). Se prueba con 3 pares de vasos.",
             P1, codigo=L("vasoA = vasoB", "vasoB = vasoA", "print(vasoA)", "print(vasoB)"),
             solucion=L("temp = vasoA", "vasoA = vasoB", "vasoB = temp", "print(vasoA)", "print(vasoB)"),
             casos=[caso_vars(f"{a} y {b}", {"vasoA": a, "vasoB": b}, {"tipo": "todos", "condiciones": [{"tipo": "variables", "variables": {"vasoA": b, "vasoB": a}}, out(b, a)]}) for a, b in pares],
             validacion=casos_val({"variable": "temp"}),
             retro="¡Intercambio perfecto! temp guardó el valor que estaba por perderse.",
             pistas=["Primero: temp = vasoA.", "Luego vasoA = vasoB y al final vasoB = temp."],
             no_logrado="Al final vasoA debe tener lo que tenía vasoB y al revés, en los 3 pares.",
             trampas=[L('vasoA = "jugo"', 'vasoB = "agua"', "print(vasoA)", "print(vasoB)"), L("temp = vasoA", "vasoA = vasoB", "print(vasoA)", "print(vasoB)")]),
        fase("10.4", "RESOLVER", "La ronda de tres vasos",
             "Ahora hay tres vasos. El líquido de vasoA debe pasar a vasoB, el de vasoB a vasoC y el de vasoC a vasoA, sin perder ninguno. Tienes un solo vaso extra: temp. Se prueba con 3 rondas distintas.",
             P1, solucion=L("temp = vasoC", "vasoC = vasoB", "vasoB = vasoA", "vasoA = temp"),
             escenario=VAS3,
             casos=[caso_vars(f"{a}, {b}, {c}", {"vasoA": a, "vasoB": b, "vasoC": c}, {"tipo": "variables", "variables": {"vasoA": c, "vasoB": a, "vasoC": b}}) for a, b, c in ternas],
             validacion=casos_val({"variable": "temp"}),
             retro="¡Ronda completa! Guardaste en temp el único valor que se iba a perder y moviste los demás en el orden correcto.",
             pistas=["¿Qué líquido se perdería primero? Guárdalo en temp.", "Empieza por temp = vasoC."],
             no_logrado="A debe quedar con lo de C, B con lo de A y C con lo de B, en las 3 rondas.",
             trampas=[L("temp = vasoA", "vasoA = vasoB", "vasoB = vasoC", "vasoC = temp")]),
    ]))

    # ------------------------------------------------------------------ 11 · Identificadores (consola de texto)
    n.append(nivel_m1(11, 11, "Identificadores", "nombres de variables válidos (identificadores)", "identificadores",
        "La consola del ayuntamiento no encuentra algunos datos: alguien escribió mal sus nombres. Un nombre mal escrito deja un dato huérfano.", D, [
        fase("11.1", "EXPLORAR", "Nombres válidos",
             "Concepto nuevo: el nombre de una variable (identificador) puede llevar letras, números y _, pero NO empieza con número ni lleva espacios. También importa si es mayúscula o minúscula.",
             P1, codigo=L("energia_total = 90", "valor2 = 7", "print(energia_total)", "print(valor2)"),
             retro="Buenos nombres: letras, números y _ (sin empezar con número).", pistas=["energia_total usa guion bajo en vez de espacio."]),
        fase("11.2", "DEBUG", "Empieza con número",
             "El nombre 2valor no es válido porque empieza con un número. Cámbialo por valor2 para que el programa muestre 5.", P1,
             codigo=L("2valor = 5", "print(2valor)"), solucion=L("valor2 = 5", "print(valor2)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "5", "variableRequerida": "valor2"},
             retro="Un identificador no puede empezar con número.", pistas=["Pasa el 2 al final del nombre."]),
        fase("11.3", "PREDECIR", "Mayúsculas importan", "¿Qué pasa al ejecutar este programa?", P1,
             codigo=L('Nombre = "Ana"', "print(nombre)"),
             opciones=[("a", "Muestra Ana"), ("b", "Error: la variable nombre no existe"), ("c", "Muestra Nombre")], correcta="b",
             retro="Nombre y nombre son identificadores distintos.", pistas=["Compara cómo se escribe la variable en cada línea."]),
        fase("11.4", "DEBUG", "Una letra de más",
             "Corrige el programa para que muestre 10. Las dos líneas deben usar exactamente el mismo nombre.", P1,
             codigo=L("Puntos = 10", "print(puntos)"), solucion=L("puntos = 10", "print(puntos)"),
             validacion={"tipo": "output_exacto", "valorEsperado": "10"},
             retro="Los nombres deben coincidir letra por letra, también en mayúsculas.", pistas=["Usa minúscula en la primera línea."]),
    ]))

    # ------------------------------------------------------------------ 12 · La Receta (* , / y redondeo)
    REC = {"tipo": "receta", "invitadosBase": 4, "variables": {"invitados": 6},
           "ingredientes": [{"nombre": "huevos", "unidad": "pzas", "piezas": True}, {"nombre": "harina", "unidad": "g"}]}
    P_REC = ["asignacion", "print", "int", "round"]

    def huevos(inv):
        return int(3 * (inv / 4) + 0.5)

    n.append(nivel_m1(12, 12, "La Receta", "operadores * y /, y redondeo con int() y round()", "operadores_y_redondeo",
        "Doña Rosa hará su pastel para la fiesta del pueblo. Su receta es para 4 personas, pero los invitados cambian: hay que recalcular los ingredientes.", REC, [
        fase("12.1", "EXPLORAR", "Receta para el doble",
             "Para 8 invitados la receta se multiplica por factor = 8 / 4. Fíjate en el resultado: en Python la división / SIEMPRE da un decimal (2.0), y por eso huevos sale 6.0.",
             P_REC, codigo=L("invitados = 8", "factor = invitados / 4", "huevos = 3 * factor", "harina = 200 * factor", "print(huevos)", "print(harina)"),
             retro="* multiplica y / divide. Como / da decimal, todo lo que se calcula con factor también es decimal.",
             pistas=["Mira la etiqueta DECIMAL en la Memoria."]),
        fase("12.2", "PREDECIR", "¿Medio huevo?", "Ahora son 6 invitados. ¿Qué muestra el programa?", P_REC,
             codigo=L("invitados = 6", "factor = invitados / 4", "huevos = 3 * factor", "print(huevos)"),
             opciones=[("a", "4.5"), ("b", "4"), ("c", "5")], correcta="a",
             retro="Correcto: 6 / 4 = 1.5 y 3 * 1.5 = 4.5. Pero nadie puede romper medio huevo… hay que redondear.",
             pistas=["Primero calcula factor."]),
        fase("12.3", "MODIFICAR", "Redondea los huevos",
             "Los invitados los trae cada fiesta (variable invitados). Cambia la línea de huevos para redondear al entero más cercano con el truco int(x + 0.5): int() corta los decimales, y sumar 0.5 antes hace que 4.5 suba a 5. Se prueba con 4 fiestas.",
             P_REC, codigo=L("factor = invitados / 4", "huevos = 3 * factor", "print(huevos)"),
             solucion=L("factor = invitados / 4", "huevos = int(3 * factor + 0.5)", "print(huevos)"),
             casos=[caso_vars(f"{inv} invitados", {"invitados": inv}, {"tipo": "todos", "condiciones": [{"tipo": "variables", "variables": {"huevos": huevos(inv)}}, out(huevos(inv))]}) for inv in (6, 10, 2, 4)],
             validacion=casos_val({"construcciones": ["int"]}),
             retro="int(x + 0.5) redondea hacia el entero más cercano. Ojo: round(4.5) en Python da 4, porque en un empate exacto redondea al número PAR.",
             pistas=["huevos = int(3 * factor + 0.5)"],
             no_logrado="huevos debe ser un entero redondeado (por ejemplo, 5 con 6 invitados) en las 4 fiestas.",
             trampas=[L("factor = invitados / 4", "huevos = int(3 * factor)", "print(huevos)"), L("factor = invitados / 4", "huevos = round(3 * factor)", "print(huevos)")]),
        fase("12.4", "RESOLVER", "La receta completa",
             "Para los invitados de cada fiesta calcula factor = invitados / 4; huevos (3 por receta, redondeado con int(x + 0.5)) y harina (200 g por receta, con round() para quitar el .0). Muestra huevos y luego harina. Se prueba con 4 fiestas.",
             P_REC, solucion=L("factor = invitados / 4", "huevos = int(3 * factor + 0.5)", "harina = round(200 * factor)", "print(huevos)", "print(harina)"),
             casos=[caso_vars(f"{inv} invitados", {"invitados": inv}, out(huevos(inv), round(200 * (inv / 4)))) for inv in (6, 10, 3, 7)],
             validacion=casos_val({"construcciones": ["int", "round"], "operadores": ["*", "/"]}),
             retro="¡Pastel listo! round(x) da un entero: round(300.0) es 300, sin el .0.",
             pistas=["harina = round(200 * factor)"],
             no_logrado="Debe mostrar los huevos (entero) y la harina sin decimales (con round) en las 4 fiestas.",
             trampas=[L("factor = invitados / 4", "huevos = int(3 * factor + 0.5)", "harina = 200 * factor", "print(huevos)", "print(harina)")]),
    ]))

    # ------------------------------------------------------------------ 13 · El Sistema de Energía (consola de texto)
    n.append(nivel_m1(13, 13, "El Sistema de Energía", "constantes (MAXIMO) y variables que cambian", "constantes_vs_variables",
        "La planta de energía del pueblo tiene un tanque. Algunos datos no deben cambiar nunca (la capacidad máxima) y otros cambian todo el tiempo (la carga actual).", D, [
        fase("13.1", "EXPLORAR", "MAXIMO y actual",
             "Concepto nuevo: por costumbre, los valores que NO deben cambiar se escriben en MAYÚSCULAS (MAXIMO). Los que cambian, en minúsculas. Mira qué chip se reasigna.",
             P1, codigo=L("MAXIMO = 100", "actual = 40", "actual = actual + 25", "print(actual)", "print(MAXIMO)"),
             retro="MAXIMO se queda igual; actual cambia con el tiempo.", pistas=["Solo el chip de actual muestra «antes»."]),
        fase("13.2", "MODIFICAR", "Hasta el tope",
             "actual vale 20 y se le suma 30. Cambia el 30 por el número correcto para que actual llegue exactamente a MAXIMO (100). Debes seguir usando una suma.", P1,
             codigo=L("MAXIMO = 100", "actual = 20", "actual = actual + 30", "print(actual)"),
             solucion=L("MAXIMO = 100", "actual = 20", "actual = actual + 80", "print(actual)"),
             validacion={"tipo": "output_exacto", "valorEsperado": "100", "requiere": {"operador": "+"}},
             retro="Calculaste cuánto faltaba para llegar al máximo.", pistas=["¿Cuánto le falta a 20 para llegar a 100?"],
             trampas=["MAXIMO = 100\nactual = MAXIMO\nprint(actual)"]),
        fase("13.3", "RESOLVER", "¿Cuánto falta?",
             "Con MAXIMO = 100 y actual = 35, calcula en faltante cuánto falta para llenar y muéstralo (65).", P1,
             solucion=L("MAXIMO = 100", "actual = 35", "faltante = MAXIMO - actual", "print(faltante)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "65", "variableRequerida": "faltante", "requiere": {"operador": "-"}},
             retro="Usaste un valor fijo y uno cambiante en la misma resta.", pistas=["faltante = MAXIMO - actual"]),
    ]))

    # ------------------------------------------------------------------ 14 (id 14) · El Pozo (while y contadores)
    POZO = {"tipo": "pozo", "profundidad": 5}
    P_POZO = ["asignacion", "print", "while", "not"]
    MET_POZO = ["bajar", "subir", "llenar", "hayAgua"]
    sol_cuenta = L("metros = 0", "while not pozo.hayAgua():", "    pozo.bajar()", "    metros += 1", "print(metros)")
    n.append(nivel_m1(14, 15, "El Pozo", "ciclo while, not y contadores", "while_contador",
        "Se secó la llave del pueblo y solo queda el pozo viejo. Nadie sabe a cuántos metros está el agua: habrá que bajar la cubeta y contar.", POZO, [
        fase("14.1", "EXPLORAR", "Baja la cubeta",
             "El objeto pozo tiene métodos: pozo.bajar() baja la cubeta 1 metro y pozo.hayAgua() responde True si la cubeta ya llegó al agua (si no, False). Ejecuta y observa.",
             ["print"], MET_POZO, codigo=L("pozo.bajar()", "pozo.bajar()", "print(pozo.hayAgua())"),
             retro="Después de 2 metros todavía no hay agua: hayAgua() respondió False.", pistas=["Mira las marcas de metros en el pozo."]),
        fase("14.2", "PREDECIR", "Repetir mientras…",
             "Concepto nuevo: while repite su bloque MIENTRAS la condición sea True, y not invierte un valor lógico (not False es True). metros += 1 suma 1 al contador en cada vuelta. Si el agua está a 3 metros, ¿qué muestra este programa?",
             P_POZO, MET_POZO, codigo=sol_cuenta, escenario={"profundidad": 3},
             opciones=[("a", "3"), ("b", "1"), ("c", "Nada: se repite para siempre")], correcta="a",
             retro="Correcto: el ciclo bajó 3 veces y en cada vuelta el contador metros subió 1. Al llegar al agua, not pozo.hayAgua() fue False y el ciclo se detuvo.",
             pistas=["Cuenta cuántas veces se repite el bloque."]),
        fase("14.3", "ESCRIBIR", "Cuenta los metros",
             "Usa while not pozo.hayAgua(): para bajar la cubeta metro a metro hasta el agua, contando los metros en la variable metros (empieza en 0 y súmale 1 en cada vuelta). Al final muestra metros. Se prueba con 3 pozos de distinta profundidad.",
             P_POZO, MET_POZO, solucion=sol_cuenta,
             casos=[{"etiqueta": f"Pozo de {p} m", "escenario": {"profundidad": p}, "esperado": out(p)} for p in (4, 7, 2)],
             validacion=casos_val({"construcciones": ["while", "not"], "variable": "metros"}),
             retro="El ciclo se adapta a cada pozo: no tuviste que saber la profundidad de antemano.",
             pistas=["metros = 0 antes del ciclo.", "Dentro del while: pozo.bajar() y metros += 1."],
             no_logrado="Debe mostrar los metros que bajó la cubeta en los 3 pozos (cada uno tiene otra profundidad).",
             trampas=[L("pozo.bajar()", "pozo.bajar()", "pozo.bajar()", "pozo.bajar()", "print(4)"),
                      L("metros = 0", "while not pozo.hayAgua():", "    pozo.bajar()", "print(metros)")]),
        fase("14.4", "RESOLVER", "Agua para el pueblo",
             "Ahora completa el trabajo: baja la cubeta hasta el agua contando los metros, llénala con pozo.llenar(), súbela con pozo.subir(metros) (sube esa cantidad de metros) y muestra los metros. Se prueba con 3 pozos.",
             P_POZO, MET_POZO,
             solucion=L("metros = 0", "while not pozo.hayAgua():", "    pozo.bajar()", "    metros += 1", "pozo.llenar()", "pozo.subir(metros)", "print(metros)"),
             casos=[{"etiqueta": f"Pozo de {p} m", "escenario": {"profundidad": p}, "esperado": {"tipo": "todos", "condiciones": [{"tipo": "pozo", "lleno": True, "arriba": True}, out(p)]}} for p in (3, 6, 5)],
             validacion=casos_val({"construcciones": ["while", "not"]}),
             retro="¡Agua para todos! El contador sirvió dos veces: para saber cuánto subir y para el reporte.",
             pistas=["Después del ciclo: pozo.llenar()", "pozo.subir(metros) usa el contador."],
             no_logrado="La cubeta debe terminar ARRIBA y LLENA, y debes mostrar los metros, en los 3 pozos.",
             trampas=[L("metros = 0", "while not pozo.hayAgua():", "    pozo.bajar()", "    metros += 1", "pozo.subir(metros)", "print(metros)"),
                      L("metros = 0", "while not pozo.hayAgua():", "    pozo.bajar()", "    metros += 1", "pozo.llenar()", "pozo.subir(3)", "print(metros)")]),
    ]))

    # ------------------------------------------------------------------ 15 (id 15) · El Puente de Datos (robot)
    PUENTE = {"tipo": "laboratorio", "ancho": 6, "alto": 1, "robotPosicion": [0, 0], "robotDireccion": "este", "objetivoPosicion": [5, 0], "mostrarEnergia": False}
    n.append(nivel_m1(15, 16, "El Puente de Datos", "input(), int(), operadores y robot juntos", "integracion_datos_robot",
        "Robot1 vuelve al río: el puente del pueblo está roto y la terminal del puente le dirá cuánto mide cada tramo.", PUENTE, [
        fase("15.1", "ESCRIBIR", "Distancia",
             "Guarda tiempo = 3 y velocidad = 12. Calcula distancia = tiempo * velocidad y muéstrala (36).", P1, M1_ROBOT,
             solucion=L("tiempo = 3", "velocidad = 12", "distancia = tiempo * velocidad", "print(distancia)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "36", "variableRequerida": "distancia", "requiere": {"operador": "*"}},
             retro="Variables y operadores también funcionan con Robot1 en pantalla.", pistas=["Tres variables: tiempo, velocidad y distancia."]),
        fase("15.2", "RESOLVER", "Cruza con el sensor",
             "Pide un valor al sensor (escribe 10), conviértelo con int(), súmale 15 y muestra el resultado (25) usando una variable llamada resultado.", P3, M1_ROBOT,
             solucion=L("dato = int(input())", "resultado = dato + 15", "print(resultado)"), entradas=["10"], etiqueta_entrada="¿Qué valor envía el sensor?",
             validacion={"tipo": "output_con_variable", "valorEsperado": "25", "variableRequerida": "resultado"},
             retro="Combinaste input, int(), variables y cálculo.", pistas=["Convierte con int(input()) antes de sumar."],
             trampas=[L("print(25)")]),
        fase("15.3", "RESOLVER", "El puente",
             "El sensor dice cuántas casillas mide el puente (escribe 3), pero Robot1 necesita 2 casillas más para bajar de él. Guarda en pasos el valor del sensor (convertido con int()) más 2, muestra pasos y haz que Robot1 avance pasos casillas para llegar a (5,0).",
             P3, M1_ROBOT, solucion=L("pasos = int(input()) + 2", "print(pasos)", "robot1.avanzar(pasos)"), entradas=["3"], etiqueta_entrada="¿Cuántas casillas mide el puente?",
             validacion={"tipo": "estado", "posicionEsperada": [5, 0], "outputEsperado": "5", "variableRequerida": "pasos"},
             retro="¡Puente cruzado! Un dato que llegó de fuera controló a Robot1 a través de una variable.",
             pistas=["pasos = int(input()) + 2", "robot1.avanzar(pasos)"],
             no_logrado="Robot1 debe llegar a (5,0) avanzando pasos (el valor del sensor más 2), y debes mostrar pasos.",
             trampas=[L("robot1.avanzar(5)", "print(5)")]),
    ]))

    # ------------------------------------------------------------------ 16 (id 16) · El Cronómetro (// y %)
    CRO = {"tipo": "cronometro", "variables": {"total": 125}}

    def hms(t):
        return (t // 3600, t % 3600 // 60, t % 60)

    n.append(nivel_m1(16, 17, "El Cronómetro", "división entera // y residuo %", "division_entera_modulo",
        "En la carrera del pueblo el cronómetro solo cuenta segundos. Los corredores quieren ver su tiempo en horas, minutos y segundos.", CRO, [
        fase("16.1", "EXPLORAR", "Cuántas veces cabe",
             "Concepto nuevo: // es la división ENTERA (cuántas veces cabe, sin decimales) y % es el residuo (lo que sobra). 17 // 5 es 3 porque el 5 cabe 3 veces en 17, y 17 % 5 es 2 porque sobran 2.",
             P1, codigo=L("print(17 // 5)", "print(17 % 5)"),
             retro="// y % siempre van juntos: uno dice cuántas veces cabe y el otro, lo que sobra.", pistas=["3 × 5 = 15 y sobran 2."]),
        fase("16.2", "PREDECIR", "Segundos a minutos", "total vale 125 segundos. ¿Qué muestra el programa?", P1,
             codigo=L("print(total // 60)", "print(total % 60)"),
             opciones=[("a", "2 y luego 5"), ("b", "2.08 y luego 0"), ("c", "5 y luego 2")], correcta="a",
             retro="Correcto: en 125 segundos caben 2 minutos completos (120 s) y sobran 5 segundos.", pistas=["¿Cuántas veces cabe 60 en 125?"]),
        fase("16.3", "DEBUG", "El cronómetro loco",
             "Este programa convierte total en minutos y segundos, pero los segundos salen mal. Corrige la línea de segundos: lo que sobra se calcula con %. Se prueba con 3 tiempos.",
             P1, codigo=L("minutos = total // 60", "segundos = total // 60", "print(minutos)", "print(segundos)"),
             solucion=L("minutos = total // 60", "segundos = total % 60", "print(minutos)", "print(segundos)"),
             casos=[caso_vars(f"{t} s", {"total": t}, out(t // 60, t % 60)) for t in (125, 59, 600)],
             validacion=casos_val({"operadores": ["//", "%"]}),
             retro="minutos con //, segundos con %: el cronómetro ya marca bien.", pistas=["segundos = total % 60"]),
        fase("16.4", "RESOLVER", "Horas, minutos y segundos",
             "Convierte total en horas, minutos y segundos: horas = total // 3600 (una hora tiene 3600 s); para los minutos, quita las horas completas con total % 3600 y divide entre 60 con //; los segundos son total % 60. Muestra horas, minutos y segundos, en ese orden. Se prueba con 4 tiempos.",
             P1, solucion=L("horas = total // 3600", "minutos = total % 3600 // 60", "segundos = total % 60", "print(horas)", "print(minutos)", "print(segundos)"),
             casos=[caso_vars(f"{t} s", {"total": t}, {"tipo": "todos", "condiciones": [
                 {"tipo": "variables", "variables": dict(zip(("horas", "minutos", "segundos"), hms(t)))}, out(*hms(t))]}) for t in (3725, 7384, 59, 86399)],
             validacion=casos_val({"operadores": ["//", "%"]}),
             retro="¡Tiempo oficial! // y % juntos convierten cualquier cantidad en unidades más grandes.",
             pistas=["horas = total // 3600", "minutos = total % 3600 // 60"],
             no_logrado="Revisa los 4 tiempos: por ejemplo, 3725 s son 1 h, 2 min y 5 s.",
             trampas=[L("horas = total // 3600", "minutos = total // 60", "segundos = total % 60", "print(horas)", "print(minutos)", "print(segundos)")]),
    ]))

    # ------------------------------------------------------------------ 17 (id 17) · La Boleta (expresiones booleanas)
    BOL = {"tipo": "boleta", "variables": {"promedio": 85, "asistencia": 90}}
    P_BOL = ["asignacion", "print", "and", "or", "not", "booleanos"]

    def aprueba(p, a):
        return p >= 70 and a >= 80

    def extra(p, a):
        return (not aprueba(p, a)) and (p >= 50 or a >= 90)

    n.append(nivel_m1(17, 18, "La Boleta", "expresiones booleanas sin if (True / False)", "expresiones_booleanas",
        "Fin de cursos en la escuela del pueblo. La directora quiere que el sistema decida quién aprueba, pero sin escribir un if para cada alumno.", BOL, [
        fase("17.1", "EXPLORAR", "Una comparación es un valor",
             "Concepto nuevo: una comparación no necesita if: da directamente True o False, y ese valor se puede guardar en una variable. Ejecuta y mira el sello.",
             P_BOL, codigo=L("aprobado = promedio >= 70", "print(aprobado)"),
             retro="promedio >= 70 se convirtió en True y se guardó en aprobado, como cualquier otro valor.", pistas=["En la Memoria, aprobado es LÓGICO."]),
        fase("17.2", "PREDECIR", "Dos reglas a la vez", "¿Qué muestra este programa?", P_BOL,
             codigo=L("promedio = 90", "asistencia = 75", "aprobado = promedio >= 70 and asistencia >= 80", "print(aprobado)"),
             opciones=[("a", "True"), ("b", "False"), ("c", "Un error, porque falta el if")], correcta="b",
             retro="Correcto: el promedio cumple, pero la asistencia (75) no llega a 80, y con and deben cumplirse las dos.", pistas=["Revisa cada regla por separado."]),
        fase("17.3", "ESCRIBIR", "La regla de la escuela",
             "Con promedio y asistencia (los trae cada boleta), guarda en aprobado si el alumno pasa: promedio de 70 o más Y asistencia de 80 o más. Sin if: escribe la comparación directo. Muestra aprobado. Se prueba con 4 boletas.",
             P_BOL, solucion=L("aprobado = promedio >= 70 and asistencia >= 80", "print(aprobado)"),
             casos=[caso_vars(f"{p} y {a} %", {"promedio": p, "asistencia": a}, {"tipo": "todos", "condiciones": [{"tipo": "variables", "variables": {"aprobado": aprueba(p, a)}}, out(py(aprueba(p, a)))]})
                    for p, a in ((85, 90), (90, 75), (65, 95), (70, 80))],
             validacion=casos_val({"construcciones": ["and"], "variable": "aprobado"}),
             retro="Una sola línea decide por todos los alumnos. Fíjate en el caso 70 y 80: >= incluye el límite.",
             pistas=["aprobado = promedio >= 70 and asistencia >= 80"],
             no_logrado="aprobado debe ser True solo si promedio >= 70 y asistencia >= 80 (revisa las 4 boletas, incluida la del límite).",
             trampas=[L("aprobado = promedio > 70 and asistencia > 80", "print(aprobado)"), L("aprobado = True", "print(aprobado)"),
                      L("aprobado = promedio >= 70 or asistencia >= 80", "print(aprobado)")]),
        fase("17.4", "RESOLVER", "Derecho a extraordinario",
             "Quien NO aprueba puede presentar examen extraordinario si su promedio es de 50 o más O su asistencia es de 90 o más. Calcula aprobado (la regla de antes) y extraordinario = not aprobado and (...). Muestra aprobado y luego extraordinario. Se prueba con 5 boletas.",
             P_BOL, solucion=L("aprobado = promedio >= 70 and asistencia >= 80", "extraordinario = not aprobado and (promedio >= 50 or asistencia >= 90)", "print(aprobado)", "print(extraordinario)"),
             casos=[caso_vars(f"{p} y {a} %", {"promedio": p, "asistencia": a}, out(py(aprueba(p, a)), py(extra(p, a))))
                    for p, a in ((85, 90), (65, 95), (40, 70), (55, 60), (90, 75))],
             validacion=casos_val({"construcciones": ["and", "or", "not"]}),
             retro="¡Boletas entregadas! not, and, or y los paréntesis te dejan escribir reglas completas sin un solo if.",
             pistas=["El paréntesis agrupa la parte del or.", "extraordinario = not aprobado and (promedio >= 50 or asistencia >= 90)"],
             no_logrado="Revisa las 5 boletas: quien aprueba nunca va a extraordinario.",
             trampas=[L("aprobado = promedio >= 70 and asistencia >= 80", "extraordinario = promedio >= 50 or asistencia >= 90", "print(aprobado)", "print(extraordinario)")]),
    ]))

    # ------------------------------------------------------------------ 18 (id 18) · El Viaje (combinar todo y round(x, 2))
    VIA = {"tipo": "viaje", "variables": {"distancia": 240, "rendimiento": 12, "precio": 24.5, "pasajeros": 3}}
    P_VIA = ["asignacion", "print", "int", "float", "round"]
    viajes = [(240, 12, 24.5, 3), (150, 15, 23.8, 4), (100, 8, 25.0, 3), (360, 14, 24.3, 5)]

    def costo(d, r, p):
        return d / r * p

    sol_viaje = L("litros = distancia / rendimiento", "costo = litros * precio", "por_persona = round(costo / pasajeros, 2)", "print(costo)", "print(por_persona)")
    n.append(nivel_m1(18, 19, "El Viaje", "combinar operadores y round(x, 2)", "integracion_operadores",
        "Los amigos de Robot1 se van de paseo a la playa y quieren dividir la gasolina en partes iguales, al centavo.", VIA, [
        fase("18.1", "EXPLORAR", "¿Cuántos litros?",
             "El auto recorre rendimiento kilómetros con un litro. Para saber cuántos litros necesita, divide la distancia entre el rendimiento. Ejecuta y mira el indicador de gasolina.",
             P_VIA, codigo=L("litros = distancia / rendimiento", "print(litros)"),
             retro="240 km entre 12 km por litro son 20.0 litros (con / siempre sale decimal).", pistas=["Mira la barra de gasolina."]),
        fase("18.2", "DEBUG", "El precio con coma",
             "El precio del litro se escribió como en la gasolinera: con coma. En Python los decimales se escriben con punto, no con coma. Corrige el programa para que precio valga 24.5 y se muestre.",
             P_VIA, codigo=L("precio = 24,5", "print(precio)"), solucion=L("precio = 24.5", "print(precio)"),
             escenario={"variables": {"distancia": 240, "rendimiento": 12, "pasajeros": 3}},  # sin precio: hay que escribirlo bien
             trampas=[L("print(precio)"), L("precio = 24", "print(precio)")],
             validacion={"tipo": "todos", "condiciones": [{"tipo": "variables", "variables": {"precio": 24.5}}, out("24.5")]},
             retro="Los decimales usan punto: 24.5. En Python los decimales se escriben con punto, no con coma.",
             pistas=["Cambia la coma por un punto."],
             no_logrado="En Python los decimales se escriben con punto, no con coma. precio debe valer 24.5 y mostrarse."),
        fase("18.3", "PREDECIR", "Centavos de más",
             "Concepto nuevo: round(x, 2) redondea x a 2 decimales (los centavos). ¿Qué muestra este programa?", P_VIA,
             codigo=L("print(round(10 / 3, 2))"),
             opciones=[("a", "3.33"), ("b", "3.3333333333333335"), ("c", "3")], correcta="a",
             retro="Correcto: 10 / 3 es 3.333… y round(…, 2) lo deja en 3.33. Sin el 2, round() redondea al entero (3).",
             pistas=["El 2 indica cuántos decimales quedan."]),
        fase("18.4", "RESOLVER", "¿Cuánto paga cada quien?",
             "Con los datos de cada viaje calcula litros = distancia / rendimiento, costo = litros * precio y por_persona = round(costo / pasajeros, 2). Muestra costo y luego por_persona. Se prueba con 4 viajes.",
             P_VIA, solucion=sol_viaje,
             casos=[caso_vars(f"{d} km · {pa} personas", {"distancia": d, "rendimiento": r, "precio": p, "pasajeros": pa},
                              {"tipo": "todos", "condiciones": [{"tipo": "variables", "variables": {"por_persona": round(costo(d, r, p) / pa, 2)}}, out(py(costo(d, r, p)), py(round(costo(d, r, p) / pa, 2)))]})
                    for d, r, p, pa in viajes],
             validacion=casos_val({"construcciones": ["round"], "operadores": ["/", "*"]}),
             retro="¡Buen viaje! Combinaste división, multiplicación y round() para repartir al centavo.",
             pistas=["Tres variables: litros, costo y por_persona.", "por_persona = round(costo / pasajeros, 2)"],
             no_logrado="Revisa los 4 viajes: por_persona debe redondearse a 2 decimales con round(…, 2).",
             trampas=[L("litros = distancia / rendimiento", "costo = litros * precio", "por_persona = costo / pasajeros", "print(costo)", "print(por_persona)"),
                      L("litros = distancia / rendimiento", "costo = litros * precio", "por_persona = round(costo / pasajeros)", "print(costo)", "print(por_persona)")]),
    ]))

    for x in n:
        guardar(x)


def limpiar_mundo_excepto(m, conservar):
    """Borra los JSON generados de un mundo, pero deja los que se escriben a mano (ids en `conservar`)."""
    for f in glob.glob(os.path.join(RAIZ, "levels", f"mundo{m}", "level*.json")):
        if int(os.path.basename(f)[5:-5]) not in conservar and int(os.path.basename(f)[5:-5]) not in (44, 45):
            os.remove(f)


def limpiar_mundo(m):
    for f in glob.glob(os.path.join(RAIZ, "levels", f"mundo{m}", "level*.json")):
        os.remove(f)


# =============================================================== MUNDO 2 (12 niveles)
# Bloque 1 (1-4) Aprender · Bloque 2 (5-8) Practicar · Bloque 3 (9-12) Dominar
C = {"tipo": "cartas"}
SALA = "Robot1 cruza la puerta y entra a la Sala de Estrategia: una mesa de cartas holográfica que solo se abre ante quien sabe tomar decisiones."
P_IF = ["print", "if"]
P_IFE = ["print", "if", "else"]
P_AND = ["print", "if", "else", "and", "or"]
P_LOG = ["print", "asignacion", "if", "else", "and", "or", "not", "booleanos"]
P_ELIF = ["print", "asignacion", "if", "elif", "else", "and", "or", "not", "booleanos"]
H = "H"  # (solo para legibilidad)


def mundo2():
    limpiar_mundo(2)
    n = []

    # ------------------------------------------------ Bloque 1 · APRENDER
    n.append(nivel(20, 2, "Pasarse de 21", "condicional if", "condicional_if", SALA, C, [
        fase("20.1", "EXPLORAR", "La primera decisión",
             "Concepto nuevo: if (\"si\") ejecuta las líneas con sangría SOLO cuando la condición es verdadera. Aquí numero es el total de la mano. Ejecuta y cambia de mesa para ver cuándo se cumple.",
             P_IF, codigo=L("if numero > 21:", '    print("Bust")'),
             escenario={"mostrarCartas": True, "cartas": mano(10, 9, 6), "variables": {"numero": 25}},
             casos=[caso_libre("Mesa 1 · 25", [10, 9, 6], variables={"numero": 25}), caso_libre("Mesa 2 · 18", [10, 8], variables={"numero": 18})],
             retro="La mesa juzga la condición: si es VERDADERO entra al bloque; si es FALSO lo salta.",
             pistas=["Mira el sello VERDADERO / FALSO que aparece en la mesa."]),
        fase("20.2", "PREDECIR", "¿Dice Bust?", "La mano suma 25. ¿Qué muestra este programa?", P_IF,
             codigo=L("if numero > 21:", '    print("Bust")'),
             escenario={"mostrarCartas": True, "cartas": mano(10, 9, 6), "variables": {"numero": 25}},
             opciones=[("a", "No muestra nada"), ("b", "Bust"), ("c", "Un error")], correcta="b",
             retro="25 es mayor que 21, así que la condición se cumple.", pistas=["¿25 > 21 es verdadero o falso?"]),
        fase("20.3", "MODIFICAR", "La casa cambia el límite",
             "La casa cambió las reglas: ahora hay Bust cuando numero es mayor que 18. Modifica el programa (solo hay que cambiar un número). Se prueba en 4 mesas.", P_IF,
             codigo=L("if numero > 21:", '    print("Bust")'), solucion=L("if numero > 18:", '    print("Bust")'),
             casos=casos_mesas([[10, 9, 6], [10, 9], [10, 8], [7, 5]], lambda m: ["Bust"] if m.numero > 18 else [], con_numero=True),
             validacion=casos_val({"construcciones": ["if"]}),
             retro="Cambiar el número de la condición cambia cuándo se activa la regla.", pistas=["El límite ahora es 18."],
             no_logrado="Con 19 hay Bust, pero con 18 exacto todavía no.", trampas=[L("if numero >= 18:", '    print("Bust")')]),
    ]))

    n.append(nivel(21, 2, "Ganar o perder", "if / else", "condicional_if_else",
        "La mesa quiere una respuesta para cada situación, no solo para una.", C, [
        fase("21.1", "EXPLORAR", "Dos caminos",
             "Concepto nuevo: else (\"si no\") es el camino alternativo: se ejecuta cuando la condición del if es falsa. Siempre se ejecuta UNA de las dos ramas.",
             P_IFE, codigo=L("if total > 21:", '    print("Perdiste")', "else:", '    print("Ganaste")'),
             escenario={"mostrarCartas": True, "cartas": mano(10, 9, 6)}, casos=libres([[10, 9, 6], [10, 7]]),
             retro="Con if / else, siempre se ejecuta exactamente una de las dos ramas.", pistas=["Prueba las dos mesas y compara."]),
        fase("21.2", "PREDECIR", "¿Gana o pierde?", "La mano suma 17. ¿Qué muestra este programa?", P_IFE,
             codigo=L("if total > 21:", '    print("Perdiste")', "else:", '    print("Ganaste")'),
             escenario={"mostrarCartas": True, "cartas": mano(10, 7)},
             opciones=[("a", "Perdiste"), ("b", "Ganaste"), ("c", "Perdiste y Ganaste")], correcta="b",
             retro="17 no es mayor que 21: la condición es falsa y se ejecuta el else.", pistas=["¿17 > 21?"]),
        fase("21.3", "MODIFICAR", "Una casa más estricta",
             "Ahora la casa pierde a quien suma más de 17. Modifica el programa para que muestre Perdiste con total mayor que 17 y Ganaste en cualquier otro caso.", P_IFE,
             codigo=L("if total > 21:", '    print("Perdiste")', "else:", '    print("Ganaste")'),
             solucion=L("if total > 17:", '    print("Perdiste")', "else:", '    print("Ganaste")'),
             casos=casos_mesas([[10, 9, 6], [10, 8], [10, 7], [7, 5]], lambda m: ["Perdiste"] if m.total > 17 else ["Ganaste"]),
             validacion=casos_val({"construcciones": ["if", "else"]}),
             retro="Solo cambió el número: la estructura if / else es la misma.", pistas=["Cambia el número de la condición."],
             no_logrado="Con 18 ya se pierde; con 17 todavía se gana."),
    ]))

    n.append(nivel(22, 2, "Comparar es preguntar", "comparación de igualdad (==)", "comparadores_igualdad",
        "Una condición es una pregunta. La más común es: ¿son iguales?", C, [
        fase("22.1", "EXPLORAR", "¿Son iguales?",
             "Concepto nuevo: == pregunta si dos valores son iguales y != si son distintos. OJO: un solo = guarda un valor; DOS == preguntan.",
             P_IFE, codigo=L("if carta1 == carta2:", '    print("Par")', "else:", '    print("Distintas")'),
             escenario={"mostrarCartas": True, "cartas": mano(7, 7)}, casos=libres([[7, 7], [7, 9]]),
             retro="== compara; = guarda. Son cosas distintas.", pistas=["Compara el sello de la mesa en las dos manos."]),
        fase("22.2", "PREDECIR", "Distinto de", "Las dos cartas valen 6. ¿Qué muestra este programa?", P_IFE,
             codigo=L("if carta1 != carta2:", '    print("Distintas")', "else:", '    print("Par")'),
             escenario={"mostrarCartas": True, "cartas": mano(6, 6)},
             opciones=[("a", "Distintas"), ("b", "Par"), ("c", "Nada")], correcta="b",
             retro="6 != 6 es falso (son iguales), así que se ejecuta el else.", pistas=["!= significa «es distinto de»."]),
        fase("22.3", "MODIFICAR", "Solo el 21 exacto",
             "Este programa da Blackjack con cualquier total mayor que 21. Modifícalo para que solo se muestre Blackjack con 21 exacto; en cualquier otro caso, Sigue.", P_IFE,
             codigo=L("if total > 21:", '    print("Blackjack")', "else:", '    print("Sigue")'),
             solucion=L("if total == 21:", '    print("Blackjack")', "else:", '    print("Sigue")'),
             casos=casos_mesas([[(11, "C"), 10], [7, 7, 7], [10, 10], [10, 9, 3]], lambda m: ["Blackjack"] if m.total == 21 else ["Sigue"]),
             validacion=casos_val({"construcciones": ["if", "else"]}),
             retro="Preguntaste por un valor exacto con ==.", pistas=["Cambia > por =="], no_logrado="Con 22 NO es Blackjack.",
             trampas=[L("if total >= 21:", '    print("Blackjack")', "else:", '    print("Sigue")')]),
    ]))

    n.append(nivel(23, 2, "Mayor, menor o igual", "comparación de orden (<, >, <=, >=)", "comparadores_orden",
        "Comparar también es decir quién es mayor. Y a veces el empate cuenta.", C, [
        fase("23.1", "EXPLORAR", "¿Quién gana?",
             "Concepto nuevo: < menor, > mayor, <= menor o igual, >= mayor o igual. Compara las dos cartas y mira el resultado en cada mesa.",
             P_IFE, codigo=L("if carta1 > carta2:", '    print("Gana la primera")', "else:", '    print("No gana la primera")'),
             escenario={"mostrarCartas": True, "cartas": mano(9, 7)}, casos=libres([[9, 7], [7, 9], [8, 8]]),
             retro="> es falso con el empate: 8 no es mayor que 8.", pistas=["Prueba la mesa del empate."]),
        fase("23.2", "PREDECIR", "Con empate", "Las dos cartas valen 7. ¿Qué muestra este programa?", P_IFE,
             codigo=L("if carta1 >= carta2:", '    print("Gana o empata")', "else:", '    print("Pierde")'),
             escenario={"mostrarCartas": True, "cartas": mano(7, 7)},
             opciones=[("a", "Gana o empata"), ("b", "Pierde"), ("c", "Nada")], correcta="a",
             retro=">= incluye el empate: 7 >= 7 es verdadero.", pistas=["¿7 >= 7?"]),
        fase("23.3", "MODIFICAR", "El empate también gana",
             "Ahora el empate favorece a la primera carta. Modifica el programa para mostrar Gana la primera cuando carta1 sea mayor O IGUAL que carta2.", P_IFE,
             codigo=L("if carta1 > carta2:", '    print("Gana la primera")', "else:", '    print("No gana")'),
             solucion=L("if carta1 >= carta2:", '    print("Gana la primera")', "else:", '    print("No gana")'),
             casos=casos_mesas([[9, 7], [7, 9], [8, 8], [2, 2]], lambda m: ["Gana la primera"] if m.carta1 >= m.carta2 else ["No gana"]),
             validacion=casos_val({"construcciones": ["if", "else"]}),
             retro=">= y <= incluyen el empate.", pistas=["Cambia > por >="], no_logrado="Revisa la mesa del empate."),
    ]))

    # ------------------------------------------------ Bloque 2 · PRACTICAR
    c_and = lambda m: ["Apuesta"] if m.color1 == "roja" and m.total < 21 else ["Pasa"]
    manos_and = [[(8, "C"), (9, "D")], [(8, "C"), (10, "D"), (5, "C")], [(8, "P"), (9, "D")], [(10, "C"), (11, "D")]]
    n.append(nivel(24, 2, "Dos condiciones a la vez", "operador lógico and", "operador_and",
        "A veces una sola pregunta no alcanza: la mesa pide que se cumplan dos cosas a la vez.", C, [
        fase("24.1", "DEBUG", "Roja Y segura",
             'Concepto nuevo: and ("y") exige que AMBAS condiciones sean verdaderas. Ahora también hay color1 ("roja" o "negra"). Debe mostrar Apuesta solo si carta1 es roja Y el total es menor que 21, pero está usando or. Corrígelo.', P_AND,
             codigo=L('if color1 == "roja" or total < 21:', '    print("Apuesta")', "else:", '    print("Pasa")'),
             solucion=L('if color1 == "roja" and total < 21:', '    print("Apuesta")', "else:", '    print("Pasa")'),
             escenario={"mostrarColor": True},
             casos=casos_mesas(manos_and, c_and, mostrarColor=True), validacion=casos_val({"construcciones": ["and"]}),
             retro="and exige las dos condiciones; or acepta cualquiera de las dos.", pistas=["Cambia la palabra que une las dos preguntas."],
             no_logrado="Debe cumplirse color Y total a la vez."),
        fase("24.2", "ESCRIBIR", "Zona segura",
             'Si total es 15 o más Y a la vez 20 o menos, muestra Zona segura; en cualquier otro caso, Fuera. Usa and.', P_AND,
             solucion=L("if total >= 15 and total <= 20:", '    print("Zona segura")', "else:", '    print("Fuera")'),
             casos=casos_mesas([[8, 6], [8, 7], [10, 8], [10, 10], [(11, "C"), 10], [10, 9, 6]], lambda m: ["Zona segura"] if 15 <= m.total <= 20 else ["Fuera"]),
             validacion=casos_val({"construcciones": ["if", "else", "and"]}),
             retro="Un rango se escribe con dos comparaciones unidas por and.", pistas=["total >= 15 and total <= 20"],
             no_logrado="Los extremos (15 y 20) sí están dentro de la zona; 14 y 21 no.",
             trampas=[L("if total >= 15 or total <= 20:", '    print("Zona segura")', "else:", '    print("Fuera")')]),
        fase("24.3", "DEBUG", "El símbolo equivocado",
             "Este programa da un error porque usa un símbolo de otro lenguaje para decir «y». En Python se escribe con la palabra and. Corrígelo.", P_AND,
             codigo=L('if color1 == "roja" && total < 21:', '    print("Apuesta")', "else:", '    print("Pasa")'),
             solucion=L('if color1 == "roja" and total < 21:', '    print("Apuesta")', "else:", '    print("Pasa")'),
             escenario={"mostrarColor": True},
             casos=casos_mesas(manos_and, c_and, mostrarColor=True), validacion=casos_val({"construcciones": ["and"]}),
             retro="En Python las condiciones se unen con las palabras and, or y not.", pistas=["Cambia && por una palabra."]),
    ]))

    n.append(nivel(25, 2, "O, y no", "operadores lógicos or y not", "operadores_or_not",
        "Otras veces basta con que se cumpla una de varias cosas, o hay que dar la vuelta a una pregunta.", C, [
        fase("25.1", "DEBUG", "Alguna roja",
             'Concepto nuevo: or ("o") exige que al menos UNA condición sea verdadera. Este programa debería mostrar Hay roja si carta1 O carta2 es roja, pero usa and. Corrígelo.', P_LOG,
             codigo=L('if color1 == "roja" and color2 == "roja":', '    print("Hay roja")', "else:", '    print("Todo negro")'),
             solucion=L('if color1 == "roja" or color2 == "roja":', '    print("Hay roja")', "else:", '    print("Todo negro")'),
             escenario={"mostrarColor": True},
             casos=casos_mesas([[(8, "C"), (9, "P")], [(8, "P"), (9, "C")], [(8, "P"), (9, "T")], [(8, "C"), (9, "D")]],
                               lambda m: ["Hay roja"] if "roja" in (m.color1, m.color2) else ["Todo negro"], mostrarColor=True),
             validacion=casos_val({"construcciones": ["or"]}),
             retro="or acepta que se cumpla cualquiera de las dos.", pistas=["Cambia la palabra que une las dos preguntas."]),
        fase("25.2", "ESCRIBIR", "Lo contrario",
             'Concepto nuevo: not invierte una condición. Usa not para mostrar Negra cuando carta1 NO sea roja y Roja cuando sí lo sea.', P_LOG,
             solucion=L('if not color1 == "roja":', '    print("Negra")', "else:", '    print("Roja")'),
             casos=casos_mesas([[(8, "C"), 9], [(8, "P"), 9], [(8, "D"), 9], [(8, "T"), 9]], lambda m: ["Roja"] if m.color1 == "roja" else ["Negra"], mostrarColor=True),
             escenario={"mostrarColor": True},
             validacion=casos_val({"construcciones": ["if", "else", "not"]}),
             retro="not da la vuelta al resultado: not True es False.", pistas=['not color1 == "roja"'],
             no_logrado="Debes usar not en la condición.", trampas=[L('if color1 == "roja":', '    print("Roja")', "else:", '    print("Negra")')]),
        fase("25.3", "PREDECIR", "Quién va primero",
             "Primero se resuelve not, luego and y al final or. ¿Qué muestra este programa?", P_LOG,
             codigo=L("if True or False and False:", '    print("A")', "else:", '    print("B")'),
             opciones=[("a", "A"), ("b", "B"), ("c", "Nada")], correcta="a",
             retro="False and False es False, y True or False es True: se ejecuta A.", pistas=["and se resuelve antes que or."]),
    ]))

    def r_elif(m):
        if m.total > 21: return ["Bust"]
        if m.total == 21: return ["Blackjack"]
        if m.total >= 17: return ["Te plantas"]
        return ["Pide carta"]
    manos_elif = [[10, 9, 6], [(11, "C"), 10], [10, 9], [10, 7], [7, 5]]
    n.append(nivel(26, 2, "Varios caminos", "elif", "condicional_elif",
        "Cuando hay más de dos situaciones, encadenar muchos if se vuelve un laberinto. Hay una forma más limpia.", C, [
        fase("26.1", "DEBUG", "Ifs que se pisan",
             'Concepto nuevo: elif ("si no, y además...") añade otra pregunta; se evalúan en orden y solo se ejecuta la PRIMERA rama verdadera. Este programa imprime DOS mensajes cuando se pasa de 21. Corrígelo.', P_ELIF,
             codigo=L("if total > 21:", '    print("Bust")', "if total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")'),
             solucion=L("if total > 21:", '    print("Bust")', "elif total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")'),
             casos=casos_mesas([[10, 9, 6], [10, 8], [5, 5]], lambda m: ["Bust"] if m.total > 21 else ["Te plantas"] if m.total >= 17 else ["Pide carta"]),
             validacion=casos_val({"construcciones": ["elif"]}),
             retro="Cambiar el segundo if por elif evita que se ejecuten dos ramas.", pistas=["La segunda pregunta debería depender de la primera."]),
        fase("26.2", "PREDECIR", "¿Cuántas ramas se ejecutan?", "La mano suma 19. ¿Qué muestra este programa?", P_ELIF,
             codigo=L("if total > 21:", '    print("Bust")', "elif total == 21:", '    print("Blackjack")', "elif total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")'),
             escenario={"mostrarCartas": True, "cartas": mano(10, 9)},
             opciones=[("a", "Te plantas"), ("b", "Te plantas y Pide carta"), ("c", "Pide carta")], correcta="a",
             retro="19 no es > 21 ni == 21, pero sí >= 17: se ejecuta esa rama y las demás se saltan.", pistas=["Solo una rama se ejecuta."]),
        fase("26.3", "ESCRIBIR", "Las cuatro reglas",
             "Si total > 21 muestra Bust; si es 21 muestra Blackjack; si es 17 o más muestra Te plantas; en cualquier otro caso muestra Pide carta. Usa elif.", P_ELIF,
             solucion=L("if total > 21:", '    print("Bust")', "elif total == 21:", '    print("Blackjack")', "elif total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")'),
             casos=casos_mesas(manos_elif, r_elif), validacion=casos_val({"construcciones": ["if", "elif", "else"]}),
             retro="Resolviste cuatro caminos con una sola cadena.", pistas=["El orden importa: pregunta primero lo más específico.", "Se escribe elif condición:"],
             no_logrado="Revisa el orden de las preguntas y que 21 sea Blackjack, no Te plantas.",
             trampas=[L("if total > 21:", '    print("Bust")', "if total == 21:", '    print("Blackjack")', "if total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")')]),
        fase("26.4", "DEBUG", "El else se adelantó",
             "Este programa da error: un elif nunca puede ir después de un else. Reordena las ramas para que el else sea la última.", P_ELIF,
             codigo=L("if total > 21:", '    print("Bust")', "else:", '    print("Sigue")', "elif total == 21:", '    print("Blackjack")'),
             solucion=L("if total > 21:", '    print("Bust")', "elif total == 21:", '    print("Blackjack")', "else:", '    print("Sigue")'),
             casos=casos_mesas([[10, 9, 6], [(11, "C"), 10], [10, 8]], lambda m: ["Bust"] if m.total > 21 else ["Blackjack"] if m.total == 21 else ["Sigue"]),
             validacion=casos_val({"construcciones": ["elif", "else"]}),
             retro="El else siempre cierra la cadena.", pistas=["Cambia el orden de las ramas."]),
    ]))

    def r_nest(m):
        if m.total > 21: return ["Bust"]
        return ["Blackjack"] if m.total == 21 else ["Seguro"]
    n.append(nivel(27, 2, "Decisiones dentro de decisiones", "condicionales anidados", "condicionales_anidados",
        "Algunas reglas tienen una pregunta dentro de otra, como una puerta que lleva a otra puerta.", C, [
        fase("27.1", "DEBUG", "Falta una sangría",
             "Concepto nuevo: un if puede ir DENTRO de otro; la sangría indica a cuál pertenece cada línea (cuanto más a la derecha, más adentro). A este programa le falta una sangría y da error. Corrígelo.", P_LOG,
             codigo=L("if total <= 21:", "    if total == 21:", '        print("Blackjack")', "    else:", '        print("Seguro")', "else:", 'print("Bust")'),
             solucion=L("if total <= 21:", "    if total == 21:", '        print("Blackjack")', "    else:", '        print("Seguro")', "else:", '    print("Bust")'),
             casos=casos_mesas([[(11, "C"), 10], [10, 8], [10, 9, 6]], r_nest), validacion=casos_val({"construcciones": ["if", "else"]}),
             retro="Después de cada dos puntos, el bloque lleva sangría.", pistas=["Mira la última línea."]),
        fase("27.2", "PREDECIR", "¿Qué camino toma?", "La mano suma 18. ¿Qué muestra este programa?", P_LOG,
             codigo=L("if total <= 21:", "    if total == 21:", '        print("Blackjack")', "    else:", '        print("Seguro")', "else:", '    print("Bust")'),
             escenario={"mostrarCartas": True, "cartas": mano(10, 8)},
             opciones=[("a", "Blackjack"), ("b", "Seguro"), ("c", "Bust")], correcta="b",
             retro="18 ≤ 21 entra al primer bloque; allí 18 == 21 es falso y se ejecuta su else.", pistas=["Primero responde la pregunta de afuera."]),
        fase("27.3", "ESCRIBIR", "El árbol de decisiones",
             "Si total es mayor que 21 muestra Bust. Si no, y total es exactamente 21, muestra Blackjack; en el resto de los casos muestra Seguro. Usa un if dentro de otro.", P_LOG,
             solucion=L("if total <= 21:", "    if total == 21:", '        print("Blackjack")', "    else:", '        print("Seguro")', "else:", '    print("Bust")'),
             casos=casos_mesas([[(11, "C"), 10], [10, 8], [10, 9, 6], [10, 10, 2], [2, 3]], r_nest), validacion=casos_val({"construcciones": ["if", "else"]}),
             retro="Anidaste decisiones con sangría.", pistas=["Decide primero si se pasó o no.", "Dentro del caso «no se pasó», compara con 21."],
             no_logrado="Revisa cada mesa: 21 es Blackjack, menos de 21 es Seguro, más de 21 es Bust.", trampas=['print("Seguro")']),
    ]))

    # ------------------------------------------------ Bloque 3 · DOMINAR (5+ mesas distintas)
    def r_a(m):
        if m.total > 21: return ["Bust"]
        return ["Te plantas"] if m.total >= 17 else ["Pide carta"]

    def r_b(m):
        if m.total > 21: return ["Bust"]
        if m.total >= 17: return ["Te plantas"]
        if m.color1 == "roja" and m.total >= 12: return ["Arriesga"]
        return ["Pide carta"]
    n.append(nivel(28, 2, "El aviso del crupier", "reglas con elif", "reglas_con_elif",
        "El crupier holográfico empieza a exigir reglas completas. Ya no basta con acertar una mesa: tu programa se prueba en muchas.", C, [
        fase("28.1", "RESOLVER", "Tres jugadas",
             "Si total > 21 muestra Bust; si no, si total es 17 o más muestra Te plantas; en cualquier otro caso muestra Pide carta. Se prueba en 6 mesas.", P_ELIF,
             solucion=L("if total > 21:", '    print("Bust")', "elif total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")'),
             casos=casos_mesas([[10, 9, 6], [(11, "C"), 10], [10, 7], [10, 6], [7, 5], [2, 2]], r_a), validacion=casos_val({"construcciones": ["if", "elif", "else"]}),
             retro="Las reglas por rangos se escriben de lo más grande a lo más pequeño.", pistas=["Una cadena: if, elif, else."],
             no_logrado="Revisa los bordes: 21 se planta, 17 se planta, 16 pide.", trampas=[L("if total >= 17:", '    print("Te plantas")', "elif total > 21:", '    print("Bust")', "else:", '    print("Pide carta")')]),
        fase("28.2", "RESOLVER", "Con color",
             'Igual que antes, pero entre 12 y 16 (inclusive): si carta1 es roja muestra Arriesga; si es negra, Pide carta. Menos de 12 siempre es Pide carta. Se prueba en 6 mesas.', P_ELIF,
             solucion=L("if total > 21:", '    print("Bust")', "elif total >= 17:", '    print("Te plantas")', 'elif color1 == "roja" and total >= 12:', '    print("Arriesga")', "else:", '    print("Pide carta")'),
             escenario={"mostrarColor": True},
             casos=casos_mesas([[(10, "C"), (9, "P")], [(10, "C"), (4, "P")], [(10, "P"), (4, "C")], [(8, "C"), (4, "D")], [(7, "C"), (4, "D")], [(10, "D"), (10, "T"), (5, "P")]], r_b, mostrarColor=True),
             validacion=casos_val({"construcciones": ["elif", "and"]}),
             retro="Mezclaste rangos y colores en una sola cadena.", pistas=['elif color1 == "roja" and total >= 12:'],
             no_logrado="Revisa la mesa de 11 con carta roja: no llega a 12."),
        fase("28.3", "LIBRE", "Mesa libre",
             "Experimenta con tus propias reglas. Además puedes poner cartas con mesa.poner_carta(valor, color) (color: \"roja\" o \"negra\") y voltearlas con mesa.voltear(). Las cartas nuevas no cambian el total. Nada se evalúa.", P_ELIF,
             ["poner_carta", "voltear"], codigo=L("# Prueba tus propias reglas", "if total > 21:", '    print("Bust")'),
             escenario={"mostrarCartas": True, "mostrarColor": True, "cartas": mano((10, "C"), (7, "P"))},
             casos=libres([[(10, "C"), (7, "P")], [(5, "D"), (6, "T"), (9, "C")]], mostrarColor=True), retro="Cada nivel de este bloque probó tus reglas en muchas mesas.",
             pistas=['mesa.poner_carta(5, "roja")']),
    ]))

    def r_pares(m):
        if m.carta1 == m.carta2 and m.carta1 >= 8: return ["Divide"]
        return ["Par bajo"] if m.carta1 == m.carta2 else ["No par"]

    def r_final(m):
        if m.carta1 == m.carta2 and m.total < 21: return ["Par: divide"]
        if m.total > 21: return ["Bust"]
        return ["Blackjack"] if m.total == 21 else ["Pide carta"]
    n.append(nivel(29, 2, "Pares", "pares y condiciones combinadas", "pares_y_condiciones",
        "Los pares son la jugada favorita del crupier: hay que decidir cuándo dividir.", C, [
        fase("29.1", "RESOLVER", "¿Divide o no?",
             "Si carta1 y carta2 son iguales Y carta1 vale 8 o más, muestra Divide; si son iguales pero menores, Par bajo; si no son iguales, No par. Se prueba en 6 mesas.", P_ELIF,
             solucion=L("if carta1 == carta2 and carta1 >= 8:", '    print("Divide")', "elif carta1 == carta2:", '    print("Par bajo")', "else:", '    print("No par")'),
             casos=casos_mesas([[10, 10], [8, 8], [7, 7], [4, 4], [10, 9], [8, 8, 5]], r_pares), validacion=casos_val({"construcciones": ["elif", "and"]}),
             retro="El par alto se pregunta primero; el par bajo queda para el elif.", pistas=["La condición más específica va primero."],
             no_logrado="Revisa 8 y 8: ya es un par alto.", trampas=[L("if carta1 == carta2:", '    print("Par bajo")', "elif carta1 >= 8:", '    print("Divide")', "else:", '    print("No par")')]),
        fase("29.2", "RESOLVER", "El crupier decide",
             "Si las dos primeras cartas son iguales Y el total es menor que 21 muestra Par: divide; si no, si total > 21 muestra Bust; si no, si total == 21 muestra Blackjack; en cualquier otro caso muestra Pide carta. Se prueba en 7 mesas.", P_ELIF,
             solucion=L("if carta1 == carta2 and total < 21:", '    print("Par: divide")', "elif total > 21:", '    print("Bust")', "elif total == 21:", '    print("Blackjack")', "else:", '    print("Pide carta")'),
             casos=casos_mesas([[8, 8], [10, 10], [10, 10, 2], [10, 10, 1], [(10, "C"), (11, "D")], [5, 6], [9, 9, 9]], r_final), validacion=casos_val({"construcciones": ["if", "elif", "else", "and"]}),
             retro="El orden de las preguntas cambia el resultado.", pistas=["Primero el par, luego Bust, luego Blackjack."],
             no_logrado="Un par con total 21 es Blackjack y un par con total 22 es Bust.",
             trampas=[L("if total > 21:", '    print("Bust")', "elif total == 21:", '    print("Blackjack")', "elif carta1 == carta2:", '    print("Par: divide")', "else:", '    print("Pide carta")')]),
        fase("29.3", "LIBRE", "Mesa libre", "Experimenta con pares y totales en distintas mesas. Nada se evalúa.", P_ELIF, ["poner_carta", "voltear"],
             codigo=L("# Escribe tus propias reglas", "if carta1 == carta2:", '    print("Par")'),
             escenario={"mostrarCartas": True, "cartas": mano(8, 8)}, casos=libres([[8, 8], [9, 4]]), retro="Dominaste los pares.", pistas=["Prueba cambiar de mesa."]),
    ]))

    def r_c1(m):
        if m.total > 21: return ["Bust"]
        return ["Doble"] if 9 <= m.total <= 11 else ["Normal"]

    def r_c2(m):
        if m.total > 21: return ["Bust"]
        return ["Bonus"] if (m.carta1 == m.carta2 or m.color1 == "roja") else ["Sin bonus"]
    n.append(nivel(30, 2, "Combinaciones", "combinaciones lógicas", "combinaciones_logicas",
        "La mesa mezcla rangos, colores y pares. Hay que combinar and y or con cuidado.", C, [
        fase("30.1", "RESOLVER", "Cuándo doblar",
             "Si total > 21 muestra Bust; si no, si total está entre 9 y 11 (inclusive) muestra Doble; en cualquier otro caso muestra Normal. Se prueba en 7 mesas.", P_ELIF,
             solucion=L("if total > 21:", '    print("Bust")', "elif total >= 9 and total <= 11:", '    print("Doble")', "else:", '    print("Normal")'),
             casos=casos_mesas([[10, 9, 6], [5, 6], [4, 5], [5, 5], [7, 5], [4, 4], [(11, "C"), 10]], r_c1), validacion=casos_val({"construcciones": ["elif", "and"]}),
             retro="Un rango con and: ni más abajo de 9 ni más arriba de 11.", pistas=["total >= 9 and total <= 11"],
             no_logrado="9 y 11 sí doblan; 8 y 12 no.", trampas=[L("if total > 21:", '    print("Bust")', "elif total >= 9 or total <= 11:", '    print("Doble")', "else:", '    print("Normal")')]),
        fase("30.2", "RESOLVER", "Bonus",
             'Si total > 21 muestra Bust. Si no, hay Bonus cuando carta1 y carta2 son iguales O carta1 es roja; en otro caso, Sin bonus. Se prueba en 6 mesas.', P_ELIF,
             solucion=L("if total > 21:", '    print("Bust")', 'elif carta1 == carta2 or color1 == "roja":', '    print("Bonus")', "else:", '    print("Sin bonus")'),
             escenario={"mostrarColor": True},
             casos=casos_mesas([[(8, "C"), (9, "P")], [(8, "P"), (9, "C")], [(7, "P"), (7, "T")], [(10, "P"), (9, "D"), (5, "P")], [(4, "C"), (4, "P")], [(6, "P"), (9, "T")]], r_c2, mostrarColor=True),
             validacion=casos_val({"construcciones": ["elif", "or"]}),
             retro="or acepta que se cumpla cualquiera de las dos condiciones.", pistas=["Dos preguntas unidas con or en el mismo elif."],
             no_logrado="Una mano que se pasa siempre es Bust, aunque sea par o roja."),
        fase("30.3", "LIBRE", "Mesa libre", "Experimenta mezclando condiciones. Nada se evalúa.", P_ELIF, ["poner_carta", "voltear"],
             codigo=L("# Combina and, or y not", 'if color1 == "roja" and total < 21:', '    print("Apuesta")'),
             escenario={"mostrarCartas": True, "mostrarColor": True, "cartas": mano((8, "C"), (9, "D"))}, casos=libres([[(8, "C"), (9, "D")], [(8, "P"), (9, "D")]], mostrarColor=True),
             retro="Ya combinas condiciones con soltura.", pistas=["Prueba con not."]),
    ]))

    def r_f1(m):
        if m.total > 21: return ["Bust"]
        if m.total == 21: return ["Blackjack"]
        if m.carta1 == m.carta2 and m.color1 == "roja": return ["Par rojo"]
        if m.carta1 == m.carta2: return ["Par negro"]
        return ["Te plantas"] if m.total >= 17 else ["Pide carta"]

    def r_f2(m):
        seguro = m.total <= 21
        if not seguro: return ["Bust"]
        return ["Te plantas"] if m.total >= 17 else ["Pide carta"]
    n.append(nivel(31, 2, "El crupier final", "integración de condicionales", "integracion_mundo_2",
        "El crupier holográfico propone el desafío final: una regla con varias condiciones combinadas que decide la jugada perfecta.", C, [
        fase("31.1", "RESOLVER", "Desafío final",
             'Si total > 21 muestra Bust; si total es 21, Blackjack; si las dos primeras cartas son iguales y carta1 es roja, Par rojo; si son iguales (negras), Par negro; si total es 17 o más, Te plantas; en cualquier otro caso, Pide carta. Se prueba en 8 mesas.', P_ELIF,
             solucion=L("if total > 21:", '    print("Bust")', "elif total == 21:", '    print("Blackjack")', 'elif carta1 == carta2 and color1 == "roja":', '    print("Par rojo")',
                        "elif carta1 == carta2:", '    print("Par negro")', "elif total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")'),
             escenario={"mostrarColor": True},
             casos=casos_mesas([[(10, "C"), (9, "P"), (6, "D")], [(11, "C"), (10, "P")], [(8, "C"), (8, "D")], [(8, "P"), (8, "T")], [(10, "C"), (10, "P"), (1, "D")],
                                [(10, "P"), (9, "C")], [(7, "P"), (5, "D")], [(10, "C"), (10, "D"), (5, "P")]], r_f1, mostrarColor=True),
             validacion=casos_val({"construcciones": ["if", "elif", "else", "and"]}),
             retro="¡Combinaste condiciones, colores, pares y rangos en una sola cadena!", pistas=["Primero lo que corta todo: Bust y Blackjack.", "Luego los pares, de lo más específico a lo más general."],
             no_logrado="Un par con total 21 es Blackjack, no Par; un par con total 22 es Bust."),
        fase("31.2", "RESOLVER", "Una variable lógica",
             "Guarda en seguro el resultado de total <= 21. Usa not para mostrar Bust cuando no sea seguro; si lo es, muestra Te plantas con 17 o más y Pide carta con menos. Se prueba en 6 mesas.", P_ELIF,
             solucion=L("seguro = total <= 21", "if not seguro:", '    print("Bust")', "elif total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")'),
             casos=casos_mesas([[10, 9, 6], [(11, "C"), 10], [10, 7], [10, 6], [7, 5], [10, 10, 2]], r_f2), validacion=casos_val({"construcciones": ["if", "not", "elif"], "variable": "seguro"}),
             retro="Guardaste una respuesta lógica y la usaste para decidir.", pistas=["seguro = total <= 21", "if not seguro:"],
             no_logrado="Debes guardar seguro y usar not.", trampas=[L("if total > 21:", '    print("Bust")', "elif total >= 17:", '    print("Te plantas")', "else:", '    print("Pide carta")')]),
        fase("31.3", "LIBRE", "Mesa libre", "Experimenta con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 2.", P_ELIF, ["poner_carta", "voltear"],
             codigo=L("# Escribe tus propias reglas", "if total > 21:", '    print("Bust")'),
             escenario={"mostrarCartas": True, "mostrarColor": True, "cartas": mano((10, "C"), (7, "P"))},
             casos=libres([[(10, "C"), (7, "P")], [(5, "D"), (6, "T"), (9, "C")]], mostrarColor=True), retro="¡Mundo 2 completado!", pistas=["Prueba cambiar de mesa."]),
    ]))
    for x in n:
        guardar(x)


# =============================================================== MUNDO 3 (12 niveles)
E = {"tipo": "elevador", "pisos": 5, "capacidad": 4, "pisoInicial": 1}
ELEV_TODOS = ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"]
ENTREGA = {"tipo": "elevador_entrega"}
INTRO_M3 = "En el complejo industrial, el elevador solo hace lo que se le ordena. Repetir la misma orden a mano es agotador: hay que enseñarle a repetirse."
W = ["print", "asignacion", "while"]
WI = ["print", "asignacion", "while", "if", "else", "not"]
FOR = ["print", "asignacion", "while", "for", "if", "else", "not", "and", "or"]
TODOS_M = ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"]


def caso_pasajeros(cantidad_a_estado):
    return cantidad_a_estado


def mundo3():
    limpiar_mundo(3)
    n = []

    # ------------------------------------------------ Bloque 1 · APRENDER
    n.append(nivel(32, 3, "El ascensor automático", "ciclo while", "ciclo_while", INTRO_M3, E, [
        fase("32.1", "EXPLORAR", "Sube mientras haya pisos",
             "Concepto nuevo: while (\"mientras\") repite su bloque MIENTRAS la condición sea verdadera. Cada vuelta se llama repetición. Ejecuta y mira el contador del letrero.",
             W, ["subir"], codigo=L("piso = 1", "while piso < 5:", "    elevador.subir(1)", "    piso = piso + 1"),
             validacion={"tipo": "elevador_piso", "valorEsperado": 5},
             retro="El while pregunta antes de cada vuelta; cuando la condición es falsa, se detiene.", pistas=["Mira el letrero: cuenta cada repetición."]),
        fase("32.2", "PREDECIR", "¿Dónde se detiene?", "¿En qué piso queda el elevador al terminar?", W, ["subir"],
             codigo=L("piso = 1", "while piso < 3:", "    elevador.subir(1)", "    piso = piso + 1"),
             opciones=[("a", "En el piso 2"), ("b", "En el piso 3"), ("c", "En el piso 4")], correcta="b",
             retro="Sube mientras piso sea menor que 3: se detiene al llegar a 3.", pistas=["Cuenta las repeticiones: piso vale 1, 2 y luego la condición falla."]),
        fase("32.3", "MODIFICAR", "Hasta arriba",
             "Este programa se detiene en el piso 3. Modifícalo para que el elevador llegue hasta el piso 5 sin dejar de usar el while.", W, ["subir"],
             codigo=L("piso = 1", "while piso < 3:", "    elevador.subir(1)", "    piso = piso + 1"), solucion=L("piso = 1", "while piso < 5:", "    elevador.subir(1)", "    piso = piso + 1"),
             validacion={"tipo": "elevador_piso", "valorEsperado": 5, "requiere": {"construcciones": ["while"], "variable": "piso"}},
             retro="Cambiar el número de la condición cambia cuántas vueltas da el ciclo.", pistas=["Solo cambia un número."],
             no_logrado="Debe terminar en el piso 5 usando el while.", trampas=[L("piso = 1", "elevador.subir(4)")]),
    ]))
    n.append(nivel(33, 3, "Repetir con for", "ciclo for con range", "ciclo_for_range",
        "Cuando ya sabes cuántas veces repetir, hay una herramienta más corta que el while con contador.", E, [
        fase("33.1", "EXPLORAR", "Tres veces",
             "Concepto nuevo: for i in range(3): repite su bloque 3 veces. La variable i cuenta sola, empezando en 0. No necesitas contador ni condición.",
             FOR, ["subir"], codigo=L("for i in range(3):", "    elevador.subir(1)"),
             validacion={"tipo": "elevador_piso", "valorEsperado": 4},
             retro="range(3) produce 0, 1 y 2: tres repeticiones.", pistas=["Cuenta las repeticiones en el letrero."]),
        fase("33.2", "PREDECIR", "¿Cuántos pisos sube?", "El elevador empieza en el piso 1. ¿En qué piso termina?", FOR, ["subir"],
             codigo=L("for i in range(2):", "    elevador.subir(1)"),
             opciones=[("a", "Piso 2"), ("b", "Piso 3"), ("c", "Piso 4")], correcta="b",
             retro="Dos repeticiones suben dos pisos: 1 → 3.", pistas=["range(2) repite 2 veces."]),
        fase("33.3", "MODIFICAR", "Hasta arriba, con for",
             "El programa sube solo 2 veces. Modifícalo (solo un número) para que el elevador llegue al piso 5.", FOR, ["subir"],
             codigo=L("for i in range(2):", "    elevador.subir(1)"), solucion=L("for i in range(4):", "    elevador.subir(1)"),
             validacion={"tipo": "elevador_piso", "valorEsperado": 5, "requiere": {"construcciones": ["for", "range"], "prohibe": ["while"]}},
             retro="El for hace el trabajo de contar por ti.", pistas=["¿Cuántos pisos hay entre el 1 y el 5?"],
             no_logrado="Debe terminar en el piso 5 usando for ... in range(...).", trampas=["elevador.subir(4)"]),
    ]))
    n.append(nivel(34, 3, "Contar repeticiones", "contadores en un while", "contadores",
        "Para repetir algo exactamente N veces, el ciclo necesita llevar la cuenta de cuántas van.", E, [
        fase("34.1", "EXPLORAR", "Un contador",
             "Concepto nuevo: un contador es una variable que empieza en 0 y suma 1 en cada vuelta. La condición del while lo compara con el máximo.",
             W, ["subir", "bajar"], codigo=L("viajes = 0", "while viajes < 3:", "    elevador.subir(1)", "    elevador.bajar(1)", "    viajes = viajes + 1", "print(viajes)"),
             validacion={"tipo": "elevador_piso", "valorEsperado": 1},
             retro="El contador cuenta las vueltas y decide cuándo parar.", pistas=["Mira el letrero de repetición y el chip viajes."]),
        fase("34.2", "PREDECIR", "¿Cuántos viajes?", "¿Qué muestra este programa al final?", W, ["subir", "bajar"],
             codigo=L("viajes = 0", "while viajes < 4:", "    elevador.subir(1)", "    elevador.bajar(1)", "    viajes = viajes + 1", "print(viajes)"),
             opciones=[("a", "3"), ("b", "4"), ("c", "5")], correcta="b",
             retro="viajes empieza en 0 y el ciclo para cuando llega a 4.", pistas=["Cuenta: 0, 1, 2, 3 y luego la condición falla con 4."]),
        fase("34.3", "MODIFICAR", "Cinco viajes",
             "Este programa hace 3 viajes. Modifícalo para que el elevador haga 5 viajes y muestre al final que hizo 5.", W, ["subir", "bajar"],
             codigo=L("viajes = 0", "while viajes < 3:", "    elevador.subir(1)", "    elevador.bajar(1)", "    viajes = viajes + 1", "print(viajes)"),
             solucion=L("viajes = 0", "while viajes < 5:", "    elevador.subir(1)", "    elevador.bajar(1)", "    viajes = viajes + 1", "print(viajes)"),
             validacion={"tipo": "todos", "condiciones": [{"tipo": "output_lineas", "valores": ["5"]}, {"tipo": "elevador_piso", "valorEsperado": 1}], "requiere": {"construcciones": ["while"], "variable": "viajes"}},
             retro="El número de la condición decide cuántas veces se repite.", pistas=["Cambia el número de la condición."], no_logrado="Debe mostrar 5."),
    ]))
    n.append(nivel(35, 3, "El valor de i", "for con variable y range(inicio, fin)", "for_con_variable",
        "La variable del for no es solo un contador interno: puedes usarla dentro del ciclo.", E, [
        fase("35.1", "EXPLORAR", "Imprimir i",
             "Concepto nuevo: range(2, 6) cuenta desde 2 hasta 5 (el final NO se incluye). La variable i cambia en cada vuelta y se puede mostrar. Aquí i coincide con el piso al que llega el elevador.",
             FOR, ["subir"], codigo=L("for i in range(2, 6):", "    elevador.subir(1)", "    print(i)"),
             validacion={"tipo": "elevador_piso", "valorEsperado": 5},
             retro="i toma los valores 2, 3, 4 y 5.", pistas=["Mira cómo coincide el valor impreso con el piso."]),
        fase("35.2", "PREDECIR", "¿Qué números salen?", "¿Qué muestra este programa?", FOR, [],
             codigo=L("for i in range(1, 4):", "    print(i)"),
             opciones=[("a", "1, 2 y 3"), ("b", "0, 1, 2 y 3"), ("c", "1, 2, 3 y 4")], correcta="a",
             retro="range(1, 4) empieza en 1 y se detiene ANTES de llegar a 4.", pistas=["El segundo número no se incluye."]),
        fase("35.3", "MODIFICAR", "Solo hasta el 4",
             "Modifica el programa para que el elevador se detenga en el piso 4 (imprimiendo 2, 3 y 4).", FOR, ["subir"],
             codigo=L("for i in range(2, 6):", "    elevador.subir(1)", "    print(i)"), solucion=L("for i in range(2, 5):", "    elevador.subir(1)", "    print(i)"),
             validacion={"tipo": "todos", "condiciones": [{"tipo": "elevador_piso", "valorEsperado": 4}, {"tipo": "output_lineas", "valores": ["2", "3", "4"]}]},
             retro="El segundo número de range no se incluye: range(2, 5) llega hasta 4.", pistas=["Cambia el número final de range."]),
    ]))

    # ------------------------------------------------ Bloque 2 · PRACTICAR
    n.append(nivel(36, 3, "El bucle infinito", "ciclos con condición y bucles infinitos", "bucle_infinito",
        "Un ciclo que nunca termina congelaría todo el complejo. Aquí aprenderás a detectarlo y a escribir ciclos que sí terminan.", E, [
        fase("36.1", "DEBUG", "El ciclo que no termina",
             "Este ciclo nunca termina: el elevador no se mueve y la condición siempre es verdadera. Observa el error y corrígelo para que el elevador suba hasta el piso 5. Dentro del while hay que CAMBIAR la variable de la condición.", W, ["subir", "recoger"],
             codigo=L("piso = 1", "while piso < 5:", "    elevador.recoger()"), solucion=L("piso = 1", "while piso < 5:", "    elevador.subir(1)", "    piso = piso + 1"),
             validacion={"tipo": "elevador_piso", "valorEsperado": 5, "requiere": {"construcciones": ["while"]}},
             retro="Un while necesita que algo cambie dentro para poder terminar.", pistas=["¿Qué variable usa la condición? Tiene que cambiar en cada vuelta."],
             no_logrado="El elevador debe terminar en el piso 5."),
        fase("36.2", "ESCRIBIR", "Desde cualquier piso",
             "Escribe un while que lleve el elevador a la planta baja (piso 1) sin importar en qué piso empiece. Pregúntale al elevador con elevador.piso(). Se prueba desde 3 pisos distintos.", W, ["bajar", "piso"],
             solucion=L("while elevador.piso() > 1:", "    elevador.bajar(1)"),
             casos=[caso_elev("Desde el piso 5", [], {"tipo": "elevador_piso", "valorEsperado": 1}, pisoInicial=5),
                    caso_elev("Desde el piso 3", [], {"tipo": "elevador_piso", "valorEsperado": 1}, pisoInicial=3),
                    caso_elev("Ya en el piso 1", [], {"tipo": "elevador_piso", "valorEsperado": 1}, pisoInicial=1)],
             validacion=casos_val({"construcciones": ["while"]}),
             retro="Tu ciclo funciona desde cualquier punto de partida.", pistas=["Pregunta con elevador.piso() > 1."],
             no_logrado="Debe funcionar también si ya está en el piso 1 (no se mueve).", trampas=["elevador.bajar(4)"]),
        fase("36.3", "DEBUG", "La condición al revés",
             "El elevador está en el piso 5 y debería bajar a la planta baja, pero el programa sube y se sale del edificio. Corrígelo.", W, ["subir", "bajar", "piso"],
             codigo=L("while elevador.piso() > 1:", "    elevador.subir(1)"), solucion=L("while elevador.piso() > 1:", "    elevador.bajar(1)"),
             escenario={"pisoInicial": 5},
             validacion={"tipo": "elevador_piso", "valorEsperado": 1, "requiere": {"construcciones": ["while"]}},
             retro="La condición estaba bien; el movimiento iba en sentido contrario.", pistas=["¿Hacia dónde debe moverse para llegar a la planta baja?"]),
    ]))

    c37 = [caso_elev("Pasajero en el 2", [2], {"tipo": "elevador_estado", "abordo": 1}),
           caso_elev("Pasajero en el 3", [3], {"tipo": "elevador_estado", "abordo": 1}),
           caso_elev("Pasajero en el 5", [5], {"tipo": "elevador_estado", "abordo": 1})]
    c37b = [caso_elev("Pasajero en el 2", [2], ENTREGA), caso_elev("Pasajero en el 3", [3], ENTREGA), caso_elev("Pasajero en el 5", [5], ENTREGA)]
    c37c = [caso_elev("Pisos 2 y 4", [2, 4], ENTREGA), caso_elev("Pisos 3 y 5", [3, 5], ENTREGA), caso_elev("Pisos 2, 3 y 5", [2, 3, 5], ENTREGA)]
    n.append(nivel(37, 3, "Recoger pasajeros", "while con decisiones", "while_con_decisiones",
        "Los pasajeros esperan en distintos pisos. El elevador debe recorrer el edificio y decidir qué hacer en cada uno.", {**E, "pasajeros": [2, 4]}, [
        fase("37.1", "DEBUG", "Buscando pasajero",
             "Concepto nuevo: elevador.hayPasajero() dice si hay alguien esperando en el piso actual. Este programa busca a un pasajero pero se queda dando vueltas sin moverse: es un ciclo infinito. Corrígelo para que suba hasta encontrarlo y lo recoja.", WI, ["subir", "recoger", "soltar", "hayPasajero"],
             codigo=L("while not elevador.hayPasajero():", "    elevador.soltar()", "elevador.recoger()"),
             solucion=L("while not elevador.hayPasajero():", "    elevador.subir(1)", "elevador.recoger()"),
             casos=c37, validacion=casos_val({"construcciones": ["while"]}),
             retro="El cuerpo del while tiene que acercarte al fin del ciclo: aquí, subir.", pistas=["¿Qué debe hacer el elevador mientras no haya pasajero?"],
             no_logrado="Debe subir hasta encontrar al pasajero y recogerlo (en el piso 2, 3 o 5)."),
        fase("37.2", "ESCRIBIR", "Un pasajero perdido",
             "Hay UN pasajero en un piso que no sabes cuál es (2, 3 o 5). Sube hasta encontrarlo, recógelo, baja a la planta baja y suéltalo.", WI, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero"],
             solucion=L("while not elevador.hayPasajero():", "    elevador.subir(1)", "elevador.recoger()", "while elevador.piso() > 1:", "    elevador.bajar(1)", "elevador.soltar()"),
             casos=c37b, validacion=casos_val({"construcciones": ["while"]}),
             retro="Encontraste y entregaste al pasajero sin saber en qué piso estaba.", pistas=["Primer ciclo: sube mientras NO haya pasajero.", "Segundo ciclo: baja mientras el piso sea mayor que 1."],
             no_logrado="Debe funcionar con el pasajero en cualquier piso: 2, 3 o 5.", trampas=[L("elevador.subir(2)", "elevador.recoger()", "elevador.bajar(2)", "elevador.soltar()")]),
        fase("37.3", "ESCRIBIR", "Evacuación",
             "Hay 2 o 3 pasajeros en distintos pisos. Recógelos a todos subiendo hasta el piso 5 (¡no olvides el piso 5!) y llévalos a la planta baja. Se prueba con 3 edificios distintos.", WI, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero"],
             solucion=L("while elevador.piso() < 5:", "    if elevador.hayPasajero():", "        elevador.recoger()", "    elevador.subir(1)",
                        "if elevador.hayPasajero():", "    elevador.recoger()", "while elevador.piso() > 1:", "    elevador.bajar(1)", "elevador.soltar()"),
             casos=c37c, validacion=casos_val({"construcciones": ["while", "if"]}),
             retro="Combinaste un barrido con decisiones y un regreso.", pistas=["Cuando el ciclo termina, el elevador está en el piso 5: ¿hay alguien allí?"],
             no_logrado="Revisa que recojas también al pasajero del último piso.",
             trampas=[L("while elevador.piso() < 5:", "    if elevador.hayPasajero():", "        elevador.recoger()", "    elevador.subir(1)", "while elevador.piso() > 1:", "    elevador.bajar(1)", "elevador.soltar()")]),
    ]))

    c38 = [caso_elev("Pisos 2 y 4", [2, 4], {"tipo": "elevador_estado", "abordo": 2}),
           caso_elev("Piso 3", [3], {"tipo": "elevador_estado", "abordo": 1}),
           caso_elev("Pisos 2, 3 y 5", [2, 3, 5], {"tipo": "elevador_estado", "abordo": 3})]
    c34 = [caso_elev("Pisos 2 y 4", [2, 4], ENTREGA), caso_elev("Piso 3", [3], ENTREGA), caso_elev("Pisos 2, 3 y 5", [2, 3, 5], ENTREGA)]
    n.append(nivel(38, 3, "For con decisiones", "for con if", "for_con_condicion",
        "Un for también puede tomar decisiones en cada vuelta, como un guardia que revisa cada piso.", {**E, "pasajeros": [2, 4]}, [
        fase("38.1", "DEBUG", "Una vuelta de más",
             "El elevador debe subir revisando cada piso (del 2 al 5) y recoger a quien encuentre. Este programa da una vuelta de más y el elevador intenta salir del edificio. Corrígelo.", FOR, ["subir", "recoger", "hayPasajero"],
             codigo=L("for i in range(5):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()"),
             solucion=L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()"),
             casos=c38, validacion=casos_val({"construcciones": ["for", "if"]}),
             retro="Del piso 1 al 5 hay 4 subidas, no 5.", pistas=["¿Cuántas veces hay que subir para llegar al piso 5?"], no_logrado="El elevador no debe salirse del edificio."),
        fase("38.2", "PREDECIR", "Los pisos pares", "¿Qué muestra este programa?", FOR, [],
             codigo=L("for piso in range(1, 6):", "    if piso % 2 == 0:", "        print(piso)"),
             opciones=[("a", "2 y 4"), ("b", "1, 3 y 5"), ("c", "Todos los números del 1 al 5")], correcta="a",
             retro="piso % 2 == 0 es verdadero cuando el número es par.", pistas=["% da el residuo: los pares dejan residuo 0 al dividir entre 2."]),
        fase("38.3", "ESCRIBIR", "Recoger y entregar",
             "Con un for sube 4 veces; en cada piso, si hay pasajero, recógelo. Luego baja a la planta baja y suelta a todos. Se prueba con 3 edificios.", FOR, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero"],
             solucion=L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()"),
             casos=c34, validacion=casos_val({"construcciones": ["for", "if"]}),
             retro="Usaste for e if juntos para automatizar el trabajo.", pistas=["Primer for: sube y pregunta. Segundo for: baja 4 veces."],
             no_logrado="Debe recoger a todos y dejarlos en la planta baja.",
             trampas=[L("for i in range(4):", "    elevador.subir(1)", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()")]),
    ]))

    def casos_cuenta(listas, salidas):
        return [caso_elev(nombre, p, {"tipo": "output_lineas", "valores": [str(salidas(p))]}) for nombre, p in listas]
    n.append(nivel(39, 3, "Cuenta lo que haces", "contadores con condición", "contadores_con_condicion",
        "El jefe de seguridad pide números: ¿cuántos pisos tienen gente? Un contador lleva la cuenta mientras el elevador trabaja.", {**E, "pasajeros": [2, 4]}, [
        fase("39.1", "DEBUG", "El contador mentiroso",
             "Este programa debe mostrar en cuántos pisos hay pasajeros, pero cuenta TODOS los pisos que visita. El contador debe sumar solo cuando hayPasajero() sea verdadero. Corrígelo.", FOR, ["subir", "recoger", "hayPasajero"],
             codigo=L("llevados = 0", "for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "    llevados = llevados + 1", "print(llevados)"),
             solucion=L("llevados = 0", "for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "        llevados = llevados + 1", "print(llevados)"),
             casos=casos_cuenta([("Pisos 2 y 4", [2, 4]), ("Piso 3", [3]), ("Pisos 2, 3 y 5", [2, 3, 5])], len), validacion=casos_val({"construcciones": ["if"], "variable": "llevados"}),
             retro="La sangría decide qué líneas pertenecen al if.", pistas=["Mueve una línea para que quede dentro del if."]),
        fase("39.2", "ESCRIBIR", "Pisos con gente",
             "Sin recoger a nadie, sube 4 veces y muestra cuántos pisos tienen al menos un pasajero esperando (usa un contador llamado pisos_con_gente). Ojo: dos pasajeros en el mismo piso cuentan UNA vez. Se prueba en 4 edificios.", FOR, ["subir", "piso", "hayPasajero"],
             solucion=L("pisos_con_gente = 0", "for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        pisos_con_gente = pisos_con_gente + 1", "print(pisos_con_gente)"),
             casos=casos_cuenta([("Pisos 2 y 4", [2, 4]), ("Dos en el piso 3", [3, 3]), ("Pisos 2, 3 y 5", [2, 3, 5]), ("Edificio vacío", [])], lambda p: len(set(p))),
             validacion=casos_val({"construcciones": ["for", "if"], "variable": "pisos_con_gente"}),
             retro="El contador cuenta pisos, no personas.", pistas=["Empieza en 0 y suma 1 solo si hayPasajero() es verdadero."],
             no_logrado="Dos pasajeros en el mismo piso cuentan como un solo piso.", trampas=[L("print(4)")]),
        fase("39.3", "ESCRIBIR", "Tres viajes",
             "Con un for, sube y baja el elevador 3 veces (un piso cada vez) y, al terminar, muestra cuántos viajes hizo (3) usando un contador llamado viajes.", FOR, ["subir", "bajar"],
             solucion=L("viajes = 0", "for i in range(3):", "    elevador.subir(1)", "    elevador.bajar(1)", "    viajes = viajes + 1", "print(viajes)"),
             validacion={"tipo": "todos", "condiciones": [{"tipo": "output_lineas", "valores": ["3"]}, {"tipo": "elevador_piso", "valorEsperado": 1}], "requiere": {"construcciones": ["for"], "variable": "viajes"}},
             retro="Un contador también sirve dentro de un for.", pistas=["viajes = 0 antes del ciclo y viajes = viajes + 1 dentro."],
             no_logrado="Debe mostrar 3 y dejar el elevador en el piso 1.", trampas=[L("print(3)")]),
    ]))

    # ------------------------------------------------ Bloque 3 · DOMINAR (≥ 3 casos distintos)
    ev40 = lambda p: {"tipo": "todos", "condiciones": [ENTREGA, {"tipo": "output_lineas", "valores": [str(len(p))]}]}
    c40a = [caso_elev(f"Pasajeros en {', '.join(map(str, p))}", p, ENTREGA) for p in ([2, 4], [3], [2, 3, 4, 5], [4, 4, 5], [5])]
    c40b = [caso_elev(f"Pasajeros en {', '.join(map(str, p))}" if p else "Edificio vacío", p, ev40(p)) for p in ([2, 4], [3], [4, 4, 5], [], [2, 3, 4, 5])]
    n.append(nivel(40, 3, "Evacuación completa", "evacuación con ciclos", "evacuacion_completa",
        "Empieza la evacuación del complejo. Tu programa se prueba en edificios distintos: no basta con acertar el que ves.", {**E, "pasajeros": [2, 4]}, [
        fase("40.1", "RESOLVER", "Todos a la planta baja",
             "Recoge a todos los pasajeros (puede haber varios en el mismo piso) y llévalos a la planta baja. Se prueba en 5 edificios.", FOR, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero"],
             solucion=L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()"),
             casos=c40a, validacion=casos_val({"construcciones": ["if"]}),
             retro="Cada vuelta del barrido decide si recoger.", pistas=["Sube 4 veces recogiendo; baja 4 veces; suelta."],
             no_logrado="No olvides el piso 5 ni los pisos con más de un pasajero.",
             trampas=[L("for i in range(4):", "    elevador.subir(1)", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()")]),
        fase("40.2", "RESOLVER", "Evacuar y contar",
             "Haz la evacuación y, ANTES de soltar, muestra cuántas personas van en la cabina con elevador.llevando(). Se prueba en 5 edificios, incluso uno vacío.", FOR, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"],
             solucion=L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "print(elevador.llevando())", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()"),
             casos=c40b, validacion=casos_val({"construcciones": ["if"]}),
             retro="llevando() cuenta personas, no pisos.", pistas=["print(elevador.llevando()) justo antes de bajar."],
             no_logrado="Debe entregar a todos y mostrar cuántas personas iban.",
             trampas=[L("llevados = 0", "for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "        llevados = llevados + 1", "print(llevados)", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()")]),
        fase("40.3", "LIBRE", "Torre libre", "Experimenta con ciclos y el elevador como quieras. Nada se evalúa.", FOR, TODOS_M,
             codigo=L("# Prueba tus propios ciclos", "for i in range(4):", "    elevador.subir(1)"), escenario={"pasajeros": [2, 3, 5]},
             retro="Evacuación completada.", pistas=["Prueba combinar while, for e if."]),
    ]))

    E2 = {**E, "capacidad": 2}
    c41a = [caso_elev(f"Pasajeros en {', '.join(map(str, p))}", p, {"tipo": "elevador_estado", "entregados": e, "abordo": 0}, capacidad=2)
            for p, e in (([2, 3, 4], 2), ([3, 4, 5], 2), ([2, 5], 2), ([4], 1), ([2, 2, 5], 2))]
    c41b = [caso_elev(f"Pasajeros en {', '.join(map(str, p))}", p, ENTREGA, capacidad=2) for p in ([2, 2, 4, 4], [3, 3, 5, 5], [2, 2, 3, 3], [4, 4, 5, 5])]
    n.append(nivel(41, 3, "La cabina chica", "capacidad limitada", "capacidad_limitada",
        "Un elevador de servicio más pequeño: solo caben 2 personas. Si intentas subir a una tercera, la cabina se llena y el programa falla.", {**E2, "pasajeros": [2, 3, 4]}, [
        fase("41.1", "RESOLVER", "No te pases de la capacidad",
             "En la cabina caben 2 personas. Sube recogiendo pasajeros SOLO mientras elevador.llevando() sea menor que 2, baja y suelta. Los que no caben se quedan esperando. Se prueba en 5 edificios.", FOR, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"],
             solucion=L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero() and elevador.llevando() < 2:", "        elevador.recoger()", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()"),
             casos=c41a, validacion=casos_val({"construcciones": ["if", "and"]}),
             retro="Preguntaste por el espacio antes de recoger.", pistas=["Une las dos preguntas con and."],
             no_logrado="Deben entregarse exactamente 2 personas (o 1 si solo hay una).",
             trampas=[L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()")]),
        fase("41.2", "RESOLVER", "Dos viajes",
             "Hay 4 pasajeros, en parejas por piso, y caben 2. Haz DOS viajes completos: en cada uno sube hasta encontrar a una pareja, recógela, baja a la planta baja y suéltala. Se prueba en 4 edificios.", WI, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero"],
             solucion=L("viajes = 0", "while viajes < 2:", "    while not elevador.hayPasajero():", "        elevador.subir(1)", "    elevador.recoger()", "    while elevador.piso() > 1:", "        elevador.bajar(1)", "    elevador.soltar()", "    viajes = viajes + 1"),
             casos=c41b, validacion=casos_val({"construcciones": ["while"]}),
             retro="Un ciclo dentro de otro: el de afuera cuenta los viajes.", pistas=["El ciclo de afuera repite 2 veces todo el recorrido."],
             no_logrado="Con un solo viaje solo se entregan 2 de las 4 personas.", trampas=[L("while not elevador.hayPasajero():", "    elevador.subir(1)", "elevador.recoger()", "while elevador.piso() > 1:", "    elevador.bajar(1)", "elevador.soltar()")]),
        fase("41.3", "LIBRE", "Cabina chica libre", "Experimenta con la cabina de 2 personas. Nada se evalúa.", WI, TODOS_M,
             codigo=L("# Prueba tus propios viajes", "elevador.subir(1)"), escenario={"pasajeros": [2, 2, 3]}, retro="Ya sabes cuidar la capacidad.", pistas=["Prueba llevando()."]),
    ]))

    c42a = [caso_elev(f"Pasajeros en {', '.join(map(str, p))}" if p else "Edificio vacío", p,
                      {"tipo": "output_lineas", "valores": [str(f) for f in sorted(set(p))]}) for p in ([2, 4], [3], [2, 3, 5], [], [2, 2, 4])]
    c42b = [caso_elev(f"Pasajeros en {', '.join(map(str, p))}", p, {"tipo": "elevador_estado", "abordo": a}) for p, a in
            (([2, 3, 4, 5], 2), ([3, 5], 0), ([2, 4, 4], 3), ([2], 1), ([5], 0))]
    n.append(nivel(42, 3, "Reportes por piso", "ciclos con reportes", "reportes_con_ciclos",
        "El jefe de seguridad quiere saber EN QUÉ pisos hay gente y que solo se atienda a los pisos pares.", {**E, "pasajeros": [2, 4]}, [
        fase("42.1", "RESOLVER", "Pisos con gente",
             "Sube 4 veces y, cada vez que haya pasajeros en el piso, muestra el número de ese piso (usa elevador.piso()). No recojas a nadie. Se prueba en 5 edificios.", FOR, ["subir", "piso", "hayPasajero"],
             solucion=L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        print(elevador.piso())"),
             casos=c42a, validacion=casos_val({"construcciones": ["for", "if"]}),
             retro="Una pregunta + un print dentro del ciclo = un reporte.", pistas=["print(elevador.piso()) dentro del if."],
             no_logrado="Debe mostrar cada piso con gente, en orden y una sola vez.", trampas=[L("print(2)", "print(4)")]),
        fase("42.2", "RESOLVER", "Solo pisos pares",
             "Sube 4 veces y recoge a los pasajeros ÚNICAMENTE en los pisos pares (2 y 4). No los bajes: solo cuenta lo que queda en la cabina. Se prueba en 5 edificios.", FOR, ["subir", "recoger", "piso", "hayPasajero"],
             solucion=L("for i in range(4):", "    elevador.subir(1)", "    if elevador.piso() % 2 == 0 and elevador.hayPasajero():", "        elevador.recoger()"),
             casos=c42b, validacion=casos_val({"construcciones": ["for", "if", "and"]}),
             retro="El operador % reconoce los pisos pares.", pistas=["piso % 2 == 0 es verdadero en los pisos pares."],
             no_logrado="Los pasajeros de pisos impares deben quedarse esperando.", trampas=[L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()")]),
        fase("42.3", "LIBRE", "Torre libre", "Experimenta con reportes y condiciones. Nada se evalúa.", FOR, TODOS_M,
             codigo=L("# Prueba tus propios reportes", "for i in range(4):", "    elevador.subir(1)", "    print(elevador.piso())"), escenario={"pasajeros": [2, 3, 5]},
             retro="Ya generas reportes con ciclos.", pistas=["Prueba % con otros números."]),
    ]))

    c43a = [caso_elev(f"Pasajeros en {', '.join(map(str, p))}" if p else "Edificio vacío", p,
                      {"tipo": "todos", "condiciones": [ENTREGA, {"tipo": "output_lineas", "valores": [str(len(p))]}]}) for p in ([2, 4], [3], [2, 3, 4, 5], [], [5])]
    c43b = [caso_elev(f"Parejas en {p[0]}-{p[2]}", p, {"tipo": "todos", "condiciones": [ENTREGA, {"tipo": "output_lineas", "valores": ["2"]}]}, capacidad=2)
            for p in ([2, 2, 4, 4], [3, 3, 5, 5], [2, 2, 3, 3], [4, 4, 5, 5])]
    n.append(nivel(43, 3, "El gran operativo", "contadores con ciclos", "integracion_mundo_3",
        "El complejo entero debe evacuarse y el jefe de seguridad quiere un reporte: cuántas personas salvó el elevador.", {**E, "pasajeros": [2, 4]}, [
        fase("43.1", "RESOLVER", "Evacuación con reporte",
             "Recoge a todos los pasajeros (hay entre 0 y 4, uno por piso), llévalos a la planta baja y muestra cuántos fueron usando un contador llamado llevados. Se prueba con 5 edificios, ¡incluso uno vacío!", FOR, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero"],
             solucion=L("llevados = 0", "for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "        llevados = llevados + 1",
                        "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()", "print(llevados)"),
             casos=c43a, validacion=casos_val({"construcciones": ["if"], "variable": "llevados"}),
             retro="Automatizaste el trabajo y el reporte con ciclos, decisiones y un contador.",
             pistas=["Sube 4 veces; en cada piso, if hayPasajero(): recoger() y suma 1 a llevados.", "Después baja 4 veces, suelta y muestra llevados."],
             no_logrado="Debe entregar a todos y mostrar la cantidad correcta (0 si no había nadie).",
             trampas=[L("llevados = 0", "for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()", "print(2)")]),
        fase("43.2", "RESOLVER", "El operativo de dos viajes",
             "Cabina de 2 personas y 4 pasajeros en parejas. Haz dos viajes completos (sube hasta una pareja, recógela, baja y suéltala) contándolos con la variable viajes, y al final muestra cuántos viajes hiciste (2). Se prueba en 4 edificios.", WI, ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero"],
             solucion=L("viajes = 0", "while viajes < 2:", "    while not elevador.hayPasajero():", "        elevador.subir(1)", "    elevador.recoger()", "    while elevador.piso() > 1:", "        elevador.bajar(1)", "    elevador.soltar()", "    viajes = viajes + 1", "print(viajes)"),
             casos=c43b, validacion=casos_val({"construcciones": ["while"], "variable": "viajes"}),
             retro="Ciclos anidados, contador y reporte: ¡el operativo completo!", pistas=["El ciclo de afuera cuenta los viajes; el de adentro busca a la pareja."],
             no_logrado="Deben quedar entregadas las 4 personas y mostrarse 2 viajes."),
        fase("43.3", "LIBRE", "Torre libre", "Experimenta con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 3.", FOR, TODOS_M,
             codigo=L("# Prueba tus propios ciclos", "for i in range(4):", "    elevador.subir(1)"), escenario={"pasajeros": [2, 3, 5]}, retro="¡Mundo 3 completado!", pistas=["Prueba combinar while, for e if."]),
    ]))
    for x in n:
        guardar(x)


# =============================================================== MUNDO 4 · MODULARIDAD (8 niveles, el 8 es el Jefe)
# 1 Definir · 2 Llamar · 3 Parametrizar · 4 Retornar · 5 Variables locales · 6 Encadenar · 7 Depurar · 8 👑 Ensamblar
FAB = {"tipo": "fabrica", "ancho": 8, "alto": 1, "robotPosicion": [0, 0], "robotDireccion": "este", "mostrarEnergia": False, "robot": False}
FABR = {**FAB, "robot": True}
PF1 = ["print", "asignacion", "def"]
PF2 = ["print", "asignacion", "def", "for"]
PFR = ["print", "asignacion", "def", "for", "return", "booleanos"]
PFS = PFR + ["str", "int", "float"]
PFA = ["print", "asignacion", "def", "return", "if", "elif", "else", "for", "while", "and", "or", "not", "booleanos", "str", "int", "float"]
RB = ["avanzar"]  # métodos del robot que usan los niveles de la fábrica
INTRO_M4 = "Al otro lado de la puerta hay una fábrica de robots gigante. Aquí nadie repite el trabajo a mano: se construyen máquinas que reciben materiales, los procesan y entregan un producto terminado. Robot1 aprenderá a construir las suyas."


def def_(nombre, parametros=None):
    return {"tipo": "funcion_definida", "nombre": nombre, **({} if parametros is None else {"parametros": parametros})}


def llamada(nombre, minimo=1):
    return {"tipo": "funcion_llamada", "nombre": nombre, "minimo": minimo}


def retorna(nombre):
    return {"tipo": "funcion_retorna", "nombre": nombre}


def todos(*condiciones, requiere=None):
    v = {"tipo": "todos", "condiciones": list(condiciones)}
    if requiere:
        v["requiere"] = requiere
    return v


def lineas(*valores):
    return {"tipo": "output_lineas", "valores": list(valores)}


def mundo4():
    limpiar_mundo(4)
    n = []

    # ---------------------------------------------------- Nivel 1 · Construyendo máquinas (DEFINICIÓN)
    n.append(nivel(48, 4, "Construyendo máquinas", "definir una función con def", "funciones_definicion", INTRO_M4, FAB, [
        fase("48.1", "EXPLORAR", "Se construye una máquina",
             "Concepto nuevo: una función es una MÁQUINA con nombre. def la construye una sola vez, pero construirla no la enciende. Ejecuta el programa: verás aparecer la máquina en la línea de ensamble, pero no pasa nada más… ¿por qué?",
             PF1, codigo=L("def saludar():", '    print("¡Hola desde la fábrica!")'),
             retro="def solo CONSTRUYE la máquina: queda guardada, esperando. Para que trabaje hay que llamarla (el siguiente nivel).",
             pistas=["Fíjate: la máquina aparece, pero no entra ninguna caja de materiales.", "Las líneas de dentro del def llevan sangría."]),
        fase("48.2", "PREDECIR", "¿Qué muestra?", "En Python, ¿qué muestra este programa?", PF1,
             codigo=L("def pitar():", '    print("¡Piii!")'),
             opciones=[("a", "No muestra nada"), ("b", "¡Piii!"), ("c", "Un error")], correcta="a",
             retro="Correcto: definir no ejecuta. La máquina pitar() existe, pero nadie la ha encendido.", pistas=["¿Hay alguna línea que llame a pitar()?"]),
        fase("48.3", "MODIFICAR", "Abre la fábrica",
             "Esta máquina está construida pero el programa no muestra nada. Modifícalo (sin cambiar la máquina) para que se vea Fábrica abierta.", PF1,
             codigo=L("def abrir_fabrica():", '    print("Fábrica abierta")'),
             solucion=L("def abrir_fabrica():", '    print("Fábrica abierta")', "abrir_fabrica()"),
             validacion=todos(lineas("Fábrica abierta"), def_("abrir_fabrica", 0), llamada("abrir_fabrica", 1), requiere={"construcciones": ["def"]}),
             retro="Para encender una máquina se escribe su nombre con paréntesis.", pistas=["Falta una línea, sin sangría, debajo del def."],
             no_logrado="Debe verse Fábrica abierta: la máquina hay que encenderla escribiendo abrir_fabrica().",
             trampas=['print("Fábrica abierta")']),
        fase("48.4", "ESCRIBIR", "Construye tu primera máquina",
             "Construye una función llamada saludar que muestre Hola fábrica, y enciéndela una vez.", PF1,
             solucion=L("def saludar():", '    print("Hola fábrica")', "saludar()"),
             validacion=todos(lineas("Hola fábrica"), def_("saludar", 0), llamada("saludar", 1), requiere={"construcciones": ["def"]}),
             retro="Definiste una máquina y la encendiste: ¡ya hay producción!",
             pistas=["def saludar():  y dentro, con sangría, el print.", "Después, en otra línea sin sangría: saludar()"],
             no_logrado="Debe haber una función saludar y llamarse una vez (se verá Hola fábrica).",
             trampas=[L('print("Hola fábrica")'), L("def saludar():", '    print("Hola fábrica")')]),
    ]))

    # ---------------------------------------------------- Nivel 2 · Activando la producción (LLAMADAS)
    maquinas_def = L("def cortar():", '    print("Cortando")', "def soldar():", '    print("Soldando")', "def pintar():", '    print("Pintando")')
    n.append(nivel(49, 4, "Activando la producción", "llamar funciones ya definidas", "funciones_llamadas",
                   "Las máquinas ya están construidas. Ahora hay que encenderlas, y el orden de las llamadas decide el orden de la producción.", FAB, [
        fase("49.1", "EXPLORAR", "Cada llamada enciende una máquina",
             "Estas dos máquinas ya están definidas. Cada línea saludar() o despedir() enciende UNA máquina; una misma máquina se puede encender las veces que quieras. Ejecuta y cuenta las veces que trabaja cada una.",
             PF1, codigo=L("def saludar():", '    print("Hola")', "def despedir():", '    print("Adiós")', "saludar()", "saludar()", "despedir()"),
             retro="saludar() trabajó dos veces y despedir() una: cada llamada es un encendido.", pistas=["Cuenta las cajas de materiales que entran a cada máquina."]),
        fase("49.2", "PREDECIR", "¿En qué orden?", "En Python, ¿qué muestra este programa?", PF1,
             codigo=L("def a():", '    print("A")', "def b():", '    print("B")', "b()", "a()", "b()"),
             opciones=[("a", "A, B, A"), ("b", "B, A, B"), ("c", "A, B")], correcta="b",
             retro="Las máquinas trabajan en el orden de las LLAMADAS, no en el orden en que se definieron.", pistas=["Mira solo las líneas que llaman: b(), a(), b()."]),
        fase("49.3", "RESOLVER", "Activa la línea de producción",
             "Las máquinas cortar(), soldar() y pintar() ya están definidas. Escribe las llamadas para que la producción sea: primero cortar, luego soldar y por último pintar.", PF1,
             codigo=maquinas_def,
             solucion=L(maquinas_def, "cortar()", "soldar()", "pintar()"),
             validacion=todos(lineas("Cortando", "Soldando", "Pintando"), llamada("cortar", 1), llamada("soldar", 1), llamada("pintar", 1)),
             retro="Llamaste a cada máquina en el orden correcto.", pistas=["Debajo de los tres def, una llamada por línea."],
             no_logrado="Debe mostrar Cortando, Soldando y Pintando, en ese orden (llama a las tres máquinas).",
             trampas=[maquinas_def, L(maquinas_def, "pintar()", "soldar()", "cortar()")]),
        fase("49.4", "RESOLVER", "Una máquina con el robot",
             "La máquina paso() ya está definida: avanza 1 casilla. Úsala dentro de un ciclo for para que Robot1 llegue a la bandera, en la casilla (5,0).", PF2, RB,
             codigo=L("def paso():", "    robot1.avanzar(1)"),
             solucion=L("def paso():", "    robot1.avanzar(1)", "for i in range(5):", "    paso()"),
             escenario={**FABR, "objetivoPosicion": [5, 0]},
             validacion=todos({"tipo": "posicion", "valorEsperado": [5, 0]}, llamada("paso", 5), requiere={"construcciones": ["for"]}),
             retro="Máquina pequeña + ciclo = un trayecto largo.", pistas=["for i in range(5): y dentro paso()"],
             no_logrado="Robot1 debe llegar a (5,0) llamando a paso() cinco veces dentro de un for.",
             trampas=[L("def paso():", "    robot1.avanzar(1)", "robot1.avanzar(5)")]),
    ]))

    # ---------------------------------------------------- Nivel 3 · Personalizando productos (PARÁMETROS)
    n.append(nivel(50, 4, "Personalizando productos", "parámetros de una función", "funciones_parametros",
                   "Una máquina que siempre hace lo mismo sirve poco. Con parámetros, la misma máquina fabrica productos distintos según los materiales que reciba.", FAB, [
        fase("50.1", "EXPLORAR", "La caja de materiales",
             "Concepto nuevo: un PARÁMETRO es una ranura de entrada de la máquina. Cada llamada lleva una caja de materiales con los valores (los argumentos). Mira cómo n recibe 2 y luego 4.",
             PF1, RB, codigo=L("def avanzar_n(n):", "    robot1.avanzar(n)", "avanzar_n(2)", "avanzar_n(4)"),
             escenario={**FABR, "objetivoPosicion": [6, 0]},
             retro="La misma máquina avanzó 2 y luego 4: lo que cambia es el valor que entra por el parámetro.", pistas=["Mira la caja azul que entra a la máquina y el chip n = ... que aparece dentro."]),
        fase("50.2", "PREDECIR", "¿Qué entra y qué sale?", "En Python, ¿qué muestra este programa?", PF2,
             codigo=L("def repetir(texto, veces):", "    for i in range(veces):", "        print(texto)", 'repetir("ok", 2)'),
             opciones=[("a", "ok una sola vez"), ("b", "ok dos veces"), ("c", "texto veces")], correcta="b",
             retro="texto vale \"ok\" y veces vale 2: el for muestra ok dos veces. Una función puede tener varios parámetros.",
             pistas=["Primero reemplaza los parámetros por los valores de la llamada."]),
        fase("50.3", "ESCRIBIR", "Una máquina que repite lo que le dan",
             "Construye la función decir(mensaje) que muestre el mensaje que reciba. Llámala con \"A\" y después con \"B\".", PF1,
             solucion=L("def decir(mensaje):", "    print(mensaje)", 'decir("A")', 'decir("B")'),
             validacion=todos(lineas("A", "B"), def_("decir", 1), llamada("decir", 2), requiere={"construcciones": ["def"]}),
             retro="Un parámetro hace que una sola máquina sirva para muchas piezas.", pistas=["def decir(mensaje): y dentro print(mensaje)."],
             no_logrado="Debe verse A y luego B, usando la función decir con un parámetro.",
             trampas=[L('print("A")', 'print("B")')]),
        fase("50.4", "ESCRIBIR", "Fabrica productos distintos",
             "Construye la función fabricar(producto, cantidad) que muestre una línea con el producto, una x y la cantidad (por ejemplo: tornillos x 5). Úsala para fabricar tornillos (5) y luego tuercas (3).", PFS,
             solucion=L("def fabricar(producto, cantidad):", '    print(producto + " x " + str(cantidad))', 'fabricar("tornillos", 5)', 'fabricar("tuercas", 3)'),
             validacion=todos(lineas("tornillos x 5", "tuercas x 3"), def_("fabricar", 2), llamada("fabricar", 2), requiere={"construcciones": ["def"]}),
             retro="Dos parámetros: una sola máquina, dos productos distintos.", pistas=["Recuerda que para unir un texto con un número hay que usar str()."],
             no_logrado="Debe mostrar tornillos x 5 y tuercas x 3 con una función fabricar de dos parámetros.",
             trampas=[L('print("tornillos x 5")', 'print("tuercas x 3")')]),
    ]))

    # ---------------------------------------------------- Nivel 4 · El producto terminado (RETURN)
    n.append(nivel(51, 4, "El producto terminado", "return y valor de retorno", "funciones_retorno",
                   "Hasta ahora las máquinas mostraban cosas. Una buena máquina ENTREGA un producto terminado: un valor que el programa puede guardar y usar.", FAB, [
        fase("51.1", "EXPLORAR", "La bandeja de salida",
             "Concepto nuevo: return devuelve un valor a quien llamó la función: sale de la máquina en una caja de producto terminado. Ese valor se puede guardar en una variable. Ejecuta y mira la caja que sale.",
             PFR, codigo=L("def calcular_doble(x):", "    return x * 2", "resultado = calcular_doble(21)", "print(resultado)"),
             retro="return entrega 42 al programa; la variable resultado lo recibe y print lo muestra.", pistas=["La caja verde que sale de la máquina lleva el valor 42."]),
        fase("51.2", "PREDECIR", "¿Qué devuelve?", "En Python, ¿qué muestra este programa?", PFR,
             codigo=L("def suma(a, b):", "    return a + b", "print(suma(2, 3) * 2)"),
             opciones=[("a", "5"), ("b", "10"), ("c", "7")], correcta="b",
             retro="suma(2, 3) devuelve 5 y después 5 * 2 es 10: la llamada se reemplaza por lo que devuelve.", pistas=["Primero calcula suma(2, 3)."]),
        fase("51.3", "DEBUG", "Muestra, pero no entrega",
             "Esta máquina MUESTRA el doble con print, pero no lo DEVUELVE: la variable resultado se queda con None (caja gris) y el programa imprime dos líneas. Arréglala para que la máquina entregue el valor con return y el programa muestre solo 42.", PFR,
             codigo=L("def calcular_doble(x):", "    print(x * 2)", "resultado = calcular_doble(21)", "print(resultado)"),
             solucion=L("def calcular_doble(x):", "    return x * 2", "resultado = calcular_doble(21)", "print(resultado)"),
             validacion=todos(lineas("42"), retorna("calcular_doble"), requiere={"construcciones": ["return"]}),
             retro="print solo MUESTRA un valor; return lo ENTREGA para que el programa lo use. La diferencia es la caja verde frente a la gris.", pistas=["Cambia print por return dentro de la función."],
             no_logrado="Debe mostrarse solo 42, y la función tiene que devolver el valor con return.", trampas=['print(42)']),
        fase("51.4", "DEBUG", "¿Es par? (otra vez sin entregar)",
             "Esta máquina debería DEVOLVER True si el número es par, pero solo lo muestra. Corrígela para que es_par(8) y es_par(7) entreguen su valor y el programa muestre True y False (una sola vez cada uno).", PFR,
             codigo=L("def es_par(n):", "    print(n % 2 == 0)", "print(es_par(8))", "print(es_par(7))"),
             solucion=L("def es_par(n):", "    return n % 2 == 0", "print(es_par(8))", "print(es_par(7))"),
             validacion=todos(lineas("True", "False"), retorna("es_par"), requiere={"construcciones": ["return"]}),
             retro="Una función puede devolver también True o False.", pistas=["return n % 2 == 0 devuelve True o False."],
             no_logrado="Debe mostrar True y luego False, devolviendo el resultado con return.", trampas=[L("print(True)", "print(False)")]),
    ]))

    # ---------------------------------------------------- Nivel 5 · Información confidencial (ÁMBITO LOCAL)
    n.append(nivel(52, 4, "Información confidencial", "variables locales y ámbito", "funciones_ambito",
                   "Lo que ocurre dentro de una máquina es confidencial: sus variables locales no se ven desde fuera. Solo sale lo que la máquina entrega con return.", FAB, [
        fase("52.1", "EXPLORAR", "El cuarto interno de la máquina",
             "Concepto nuevo: las variables que se crean dentro de una función son LOCALES. Mira cómo aparece el chip interno = 20 dentro de la máquina… y desaparece cuando la máquina termina. Solo sale lo que se devuelve.",
             PFR, codigo=L("def calcular():", "    interno = 5 * 4", "    return interno", "resultado = calcular()", "print(resultado)"),
             retro="interno vivió solo mientras la máquina trabajaba. Lo único que salió fue el valor devuelto.", pistas=["El chip dentro de la máquina es la variable local."]),
        fase("52.2", "PREDECIR", "Lo que pasa dentro, se queda dentro", "En Python, ¿qué pasa al ejecutar este programa?", PFR,
             codigo=L("def calcular():", "    resultado = 5 * 4", "calcular()", "print(resultado)"),
             opciones=[("a", "Muestra 20"), ("b", "Error: resultado solo existe dentro de la función"), ("c", "Muestra None")], correcta="b",
             retro="resultado es una variable LOCAL: nace y muere dentro de calcular(). Desde fuera no existe (NameError).", pistas=["¿Dónde se creó resultado?"]),
        fase("52.3", "PREDECIR", "¿La de afuera cambia?", "En Python, ¿qué muestra este programa?", PFR,
             codigo=L("x = 10", "def cambiar():", "    x = 99", "cambiar()", "print(x)"),
             opciones=[("a", "99"), ("b", "10"), ("c", "Un error")], correcta="b",
             retro="Dentro de cambiar(), x = 99 crea OTRA variable local con el mismo nombre. La x de afuera sigue valiendo 10.", pistas=["¿Cuántas variables llamadas x hay?"]),
        fase("52.4", "DEBUG", "Saca el valor de la máquina",
             "Este programa da error porque resultado es local. Corrígelo para que muestre 20: haz que la función devuelva el valor con return y guárdalo en resultado.", PFR,
             codigo=L("def calcular():", "    resultado = 5 * 4", "calcular()", "print(resultado)"),
             solucion=L("def calcular():", "    return 5 * 4", "resultado = calcular()", "print(resultado)"),
             validacion=todos({"tipo": "output_con_variable", "valorEsperado": "20", "variableRequerida": "resultado"}, retorna("calcular"), requiere={"construcciones": ["return"]}),
             retro="Para sacar un valor de una función se usa return.", pistas=["Cambia la asignación de dentro por return 5 * 4.", "Afuera: resultado = calcular()"],
             no_logrado="Debe mostrar 20 devolviendo el valor con return.", trampas=["print(20)"]),
    ]))

    # ---------------------------------------------------- Nivel 6 · Producción en cadena (ENCADENAMIENTO)
    n.append(nivel(53, 4, "Producción en cadena", "usar el return de una función como parámetro de otra", "funciones_encadenamiento",
                   "Las máquinas se pueden conectar: lo que sale de una entra a la siguiente. Así se arma una cadena de producción.", FAB, [
        fase("53.1", "EXPLORAR", "Una máquina alimenta a otra",
             "El producto terminado de una máquina puede ser el material de la siguiente: doble(sumar(2, 3)). Python primero ejecuta la máquina de adentro y su resultado entra a la de afuera. Mira cómo la caja verde de sumar pasa a ser la caja de materiales de doble.",
             PFR, codigo=L("def sumar(a, b):", "    return a + b", "def doble(x):", "    return x * 2", "print(doble(sumar(2, 3)))"),
             retro="sumar(2, 3) devolvió 5, y ese 5 fue el material de doble(5), que devolvió 10.", pistas=["Se ejecuta primero lo que está más adentro de los paréntesis."]),
        fase("53.2", "PREDECIR", "¿Qué sale de la cadena?", "En Python, ¿qué muestra este programa?", PFR,
             codigo=L("def doble(x):", "    return x * 2", "def sumar_uno(x):", "    return x + 1", "print(doble(sumar_uno(4)))"),
             opciones=[("a", "9"), ("b", "10"), ("c", "8")], correcta="b",
             retro="sumar_uno(4) devuelve 5 y doble(5) devuelve 10. Si el orden fuera al revés (sumar_uno(doble(4))) saldría 9.", pistas=["Empieza por la máquina de adentro."]),
        fase("53.3", "RESOLVER", "Conecta dos máquinas",
             "Construye cuadrado(n), que devuelva n * n, y mitad(n), que devuelva n // 2. Muestra el resultado de pasar el cuadrado de 6 por la máquina mitad (18), conectándolas en una sola línea.", PFR,
             solucion=L("def cuadrado(n):", "    return n * n", "def mitad(n):", "    return n // 2", "print(mitad(cuadrado(6)))"),
             validacion=todos(lineas("18"), retorna("cuadrado"), retorna("mitad"), llamada("cuadrado", 1), llamada("mitad", 1), requiere={"construcciones": ["return"]}),
             retro="Encadenaste dos funciones: el return de una fue el parámetro de la otra.", pistas=["mitad(cuadrado(6))"],
             no_logrado="Debe mostrar 18 usando las dos funciones, una dentro de la otra.", trampas=["print(18)"]),
        fase("53.4", "RESOLVER", "La cadena de tres",
             "Construye tres máquinas: quitar_dos(n) devuelve n - 2, duplicar(n) devuelve n * 2 y sumar_tres(n) devuelve n + 3. Pasa el número 10 por las tres, en ese orden, y muestra el resultado final (19).", PFR,
             solucion=L("def quitar_dos(n):", "    return n - 2", "def duplicar(n):", "    return n * 2", "def sumar_tres(n):", "    return n + 3", "print(sumar_tres(duplicar(quitar_dos(10))))"),
             validacion=todos(lineas("19"), retorna("quitar_dos"), retorna("duplicar"), retorna("sumar_tres"), requiere={"construcciones": ["return"]}),
             retro="Una cadena de producción de tres pasos: cada máquina recibe lo que entregó la anterior.", pistas=["La primera en ejecutarse es la más interna: quitar_dos(10)."],
             no_logrado="Debe mostrar 19: ((10 - 2) * 2) + 3, pasando el valor por las tres máquinas.", trampas=["print(19)"]),
    ]))

    # ---------------------------------------------------- Nivel 7 · Reparando la fábrica (DEPURACIÓN)
    n.append(nivel(54, 4, "Reparando la fábrica", "depurar funciones", "funciones_depuracion",
                   "La fábrica sufrió un apagón y varias máquinas fallan. Reparar es leer el error y encontrar qué le falta a cada máquina.", FAB, [
        fase("54.1", "DEBUG", "Falta el return",
             "Este programa muestra None en lugar de 8: a la máquina le falta algo. Corrígela para que muestre 8.", PFR,
             codigo=L("def doble(x):", "    x * 2", "print(doble(4))"),
             solucion=L("def doble(x):", "    return x * 2", "print(doble(4))"),
             validacion=todos(lineas("8"), retorna("doble"), requiere={"construcciones": ["return"]}),
             retro="Sin return la función devuelve None. Calcular x * 2 no basta: hay que entregarlo.", pistas=["Falta una palabra antes de x * 2."],
             no_logrado="Debe mostrar 8: la función doble tiene que devolver el resultado.", trampas=["print(8)"]),
        fase("54.2", "DEBUG", "Mal parámetro",
             "Este programa da un error de tipos: la máquina pide dos valores y solo le dan uno. Corrígelo para que muestre 8.", PFR,
             codigo=L("def sumar(a, b):", "    return a + b", "print(sumar(5))"),
             solucion=L("def sumar(a, b):", "    return a + b", "print(sumar(5, 3))"),
             validacion=todos(lineas("8"), llamada("sumar", 1), requiere={"construcciones": ["return"]}),
             retro="Al llamar una función hay que dar un valor por cada parámetro.", pistas=["sumar necesita a y b."],
             no_logrado="Debe mostrar 8 llamando a sumar con sus dos valores.", trampas=["print(8)"]),
        fase("54.3", "DEBUG", "La máquina que nadie enciende",
             "Este programa debería mostrar Hola, pero no muestra nada. Corrígelo.", PFR,
             codigo=L("def saludar():", '    print("Hola")'),
             solucion=L("def saludar():", '    print("Hola")', "saludar()"),
             validacion=todos(lineas("Hola"), def_("saludar", 0), llamada("saludar", 1), requiere={"construcciones": ["def"]}),
             retro="Definir una función no la ejecuta: hay que llamarla.", pistas=["¿Quién enciende la máquina?"],
             no_logrado="Debe mostrar Hola: llama a la función saludar.", trampas=['print("Hola")']),
        fase("54.4", "DEBUG", "Los tres fallos juntos",
             "El código tiene TRES errores a la vez: a una máquina le falta el return, otra llamada no recibe todos sus valores y hay una máquina que nadie enciende. Repáralos para que el programa muestre 10 y luego Listo (suma 4 y 6, y anuncia Listo con la máquina anunciar).", PFR,
             codigo=L("def sumar(a, b):", "    a + b", "def anunciar(texto):", "    print(texto)", "total = sumar(4)", "print(total)"),
             solucion=L("def sumar(a, b):", "    return a + b", "def anunciar(texto):", "    print(texto)", "total = sumar(4, 6)", "print(total)", 'anunciar("Listo")'),
             validacion=todos(lineas("10", "Listo"), retorna("sumar"), llamada("anunciar", 1), requiere={"construcciones": ["return"]}),
             retro="¡Fábrica reparada! Falta de return, parámetros que no coinciden y funciones sin llamar: los tres fallos más comunes.", pistas=["Arregla una máquina a la vez, leyendo el error que aparece.", "sumar necesita 2 valores y anunciar nunca se llama."],
             no_logrado="Debe mostrar 10 y luego Listo: revisa el return, los valores de sumar y la llamada a anunciar.", trampas=[L('print(10)', 'print("Listo")')]),
    ]))
    for x in n:
        guardar(x)


# =============================================================== NIVELES JEFE (uno al final de cada mundo)
# Sin pistas, editor en blanco y un único enunciado.
def jefe(n, fase_, eficiencia=True):
    n["jefe"] = True
    if eficiencia:
        # Reto de optimización: solo un mensaje motivacional (no quita estrellas ni bloquea). Se usa el largo de la solución de referencia.
        n["max_lineas_recomendadas"] = len([l for l in fase_["solucionReferencia"].split("\n") if l.strip()])
    fase_["sinPistas"] = True
    fase_.pop("pistas", None)
    fase_["codigoInicial"] = ""
    return n


def jefes():
    # ---- Mundo 1 · Laberinto ciego (Nivel 14: jefe intermedio, cierra los Bloques A a C)
    muros = [[6, 0]] + [[x, 1] for x in range(0, 5)] + [[6, 1], [6, 2]] + [[x, 3] for x in range(1, 7)] + [[x, 5] for x in range(0, 7)]
    lab = {"tipo": "laboratorio", "ancho": 8, "alto": 6, "robotPosicion": [0, 0], "robotDireccion": "este", "objetivoPosicion": [7, 5], "obstaculos": muros, "mostrarEnergia": False}
    f1 = fase("44.1", "RESOLVER", "Laberinto ciego",
              "El laberinto está a oscuras y esta vez nadie te dirá cuántos pasos dar. Mira el mapa, cuenta las casillas libres y programa a Robot1 para llegar a la meta, en la casilla (7,5), sin chocar con ningún muro.",
              ["print"], M1_ROBOT,
              solucion=L("robot1.avanzar(5)", 'robot1.girar("sur")', "robot1.avanzar(2)", 'robot1.girar("oeste")', "robot1.avanzar(5)", 'robot1.girar("sur")', "robot1.avanzar(2)",
                         'robot1.girar("este")', "robot1.avanzar(7)", 'robot1.girar("sur")', "robot1.avanzar(1)"),
              validacion={"tipo": "posicion", "valorEsperado": [7, 5]},
              retro="¡Jefe derrotado! Calculaste cada tramo del laberinto sin ayuda.",
              no_logrado="Robot1 debe llegar a la meta (7,5) sin chocar con los muros.",
              trampas=[L("robot1.avanzar(7)", 'robot1.girar("sur")', "robot1.avanzar(5)"), L("robot1.avanzar(5)", 'robot1.girar("sur")', "robot1.avanzar(5)")])
    n1 = nivel_m1(44, 14, "Laberinto ciego", "integración de los Bloques A a C", "jefe_intermedio_mundo_1",
                  "Antes del último tramo del pueblo, Robot1 debe atravesar el viejo almacén: un laberinto a oscuras. Aquí nadie te dará pasos: tendrás que calcularlos tú.", lab, [f1])
    guardar(jefe(n1, f1))

    # ---- Mundo 1 · La Caja Fuerte (Nivel 20: jefe final del mundo)
    def codigo_caja(a, b, c, d):
        return str((a + b) * c - d % 7)

    entradas = [(12, 5, 3, 40), (7, 8, 2, 50), (20, 1, 4, 23), (0, 0, 9, 6)]
    casos = [{"etiqueta": f"Caja {i}", "entradas": [str(v) for v in e],
              "escenario": {"combinacion": codigo_caja(*e), "indice": i, "total": len(entradas)},
              "esperado": {"tipo": "output_lineas", "valores": [codigo_caja(*e)]}} for i, e in enumerate(entradas, 1)]
    f2 = fase("45.1", "RESOLVER", "La Caja Fuerte",
              "El tesoro del pueblo está repartido en 4 cajas fuertes. Cada una se abre con un código que tú calculas. La terminal te enviará, uno por uno y como texto, cuatro números: a, b, c y d. El código es: la suma de a y b, multiplicada por c, menos el residuo de dividir d entre 7, es decir (a + b) * c - d % 7. Muéstralo con print(). Se prueba con las 4 cajas.",
              P3,
              solucion=L("a = int(input())", "b = int(input())", "c = int(input())", "d = int(input())", "codigo = (a + b) * c - d % 7", "print(codigo)"),
              casos=casos, validacion=casos_val({"construcciones": ["int", "input"], "operadores": ["+", "*", "-", "%"]}),
              etiqueta_entrada="La caja fuerte pide un número (a, b, c y d, en ese orden)",
              retro="¡Jefe derrotado! Convertiste los datos, usaste cuatro operaciones y las 4 cajas se abrieron.",
              no_logrado="El código debe ser (a + b) * c - d % 7 para las 4 cajas. Recuerda convertir lo que llega de input().",
              trampas=[L("print(46)"), L("a = int(input())", "b = int(input())", "c = int(input())", "d = int(input())", "print((a + b) * c - d // 7)")])
    n2 = nivel_m1(45, 20, "La Caja Fuerte", "integración del Mundo 1", "jefe_mundo_1",
                  "El alcalde guardó el tesoro del pueblo en 4 cajas fuertes y olvidó los códigos. Solo queda una fórmula y los datos que llegan por la terminal.", {"tipo": "cajafuerte", "total": 4}, [f2],
                  siguiente="¡Las 4 cajas están abiertas y el pueblo está a salvo! Robot1 ya domina los fundamentos y los datos. Ahora una mesa de cartas holográfica lo espera para enseñarle a decidir. Entra al Mundo 2: Lógica.")
    guardar(jefe(n2, f2))

    # ---- Mundo 2 · Torneo de cartas (Nivel 13)
    def regla_bj(total, cantidad):
        if total == 21 and cantidad == 2:
            return "Blackjack"
        if total > 21:
            return "Bust"
        if total == 21:
            return "21"
        if total >= 17:
            return "Plantarse"
        return "Pedir carta"

    manos = [[10, 11], [7, 7, 7], [10, 9, 5], [10, 7], [10, 10], [5, 6, 4], [6, 5], [9, 8, 4], [10, 10, 2], [10, 6]]
    casos3 = []
    for i, m in enumerate(manos, 1):
        total = sum(m)
        casos3.append({"etiqueta": f"Mano {i} · {total}", "escenario": {"cartas": mano(*m), "mostrarCartas": True, "variables": {"cantidad": len(m)}},
                       "esperado": {"tipo": "output_lineas", "valores": [regla_bj(total, len(m))]}})
    f3 = fase("46.1", "RESOLVER", "Torneo de cartas",
              "Eres el crupier del gran torneo. Escribe las reglas completas para una mano (usa total y cantidad, el número de cartas que hay) y muestra UNA sola palabra: Blackjack (suma 21 con exactamente 2 cartas), Bust (se pasa de 21), 21 (suma 21 con 3 o más cartas), Plantarse (de 17 a 20) o Pedir carta (menos de 17). Se prueba con 10 manos distintas.",
              P_ELIF,
              solucion=L("if total == 21 and cantidad == 2:", '    print("Blackjack")', "elif total > 21:", '    print("Bust")', "elif total == 21:", '    print("21")',
                         "elif total >= 17:", '    print("Plantarse")', "else:", '    print("Pedir carta")'),
              casos=casos3, validacion=casos_val({"construcciones": ["if", "elif", "and"]}),
              retro="¡Jefe derrotado! Tus reglas funcionan en cualquier mano: el orden de los if hizo la diferencia.",
              no_logrado="Revisa el orden de las reglas: Blackjack va antes que el 21 normal, y Bust antes de comparar con 17.",
              trampas=[L("if total > 21:", '    print("Bust")', "elif total == 21:", '    print("21")', "elif total >= 17:", '    print("Plantarse")', "else:", '    print("Pedir carta")')])
    n3 = nivel(46, 2, "Torneo de cartas", "integración del Mundo 2", "jefe_mundo_2",
               "El torneo final de la Sala de Estrategia empieza. El crupier ya no te dirá qué regla aplicar: tendrás que escribirlas todas.", {"tipo": "cartas"}, [f3],
               siguiente="¡La sala de estrategia se abre! Pero al cruzar, Robot1 oye un zumbido: un edificio entero depende de un elevador que no deja de fallar. Entra al Mundo 3: Automatización.")
    guardar(jefe(n3, f3))

    # ---- Mundo 3 · Evacuación crítica (Nivel 13)
    edificios = [[2, 3, 4, 5], [3, 3, 5, 5], [2, 2, 4, 5], [5, 5, 5, 5], [2, 3, 3, 4]]
    casos4 = [caso_elev(f"Edificio {i}", p, ENTREGA, energiaInicial=10) for i, p in enumerate(edificios, 1)]
    f4 = fase("47.1", "RESOLVER", "Evacuación crítica",
              "¡Alarma en el edificio! Hay pasajeros esperando en todos los pisos y la batería del elevador solo alcanza para recorrer 10 pisos (cada piso recorrido gasta 1). Evacúa a todos hasta la planta baja sin quedarte sin energía. Se prueba con 5 edificios distintos.",
              FOR, TODOS_M,
              solucion=L("for i in range(4):", "    elevador.subir(1)", "    if elevador.hayPasajero():", "        elevador.recoger()", "for i in range(4):", "    elevador.bajar(1)", "elevador.soltar()"),
              casos=casos4, validacion=casos_val(),
              retro="¡Jefe derrotado! Recogiste a todos en un solo viaje y sobró energía.",
              no_logrado="Deben quedar todos en la planta baja sin agotar la batería: planea un solo viaje de subida y bajada.",
              trampas=[L("for v in range(2):", "    for i in range(4):", "        elevador.subir(1)", "        if elevador.hayPasajero():", "            elevador.recoger()", "    for i in range(4):", "        elevador.bajar(1)", "    elevador.soltar()")],
              escenario={"energiaInicial": 10})
    n4 = nivel(47, 3, "Evacuación crítica", "integración del Mundo 3", "jefe_mundo_3",
               "El complejo entero está en llamas y el elevador tiene la batería casi agotada. Cada piso cuenta.", {**E, "energiaInicial": 10}, [f4],
               siguiente="¡Evacuación completada! Robot1 descubre una puerta con luces parpadeantes: es la entrada a una fábrica de robots gigante. Allí lo espera el Mundo 4: Modularidad.")
    guardar(jefe(n4, f4))

    # ---- Mundo 4 · El Gran Ensamblaje (Nivel 8)
    solucion5 = L("def cabeza():", '    print("Cabeza lista")', "def brazos():", '    print("Brazos listos")', "def piernas():", '    print("Piernas listas")', "cabeza()", "brazos()", "piernas()")
    f5 = fase("55.1", "RESOLVER", "El Gran Ensamblaje",
              "¡El pedido final! La fábrica debe construir un Robot1 gigante. Define EXACTAMENTE tres funciones: cabeza(), brazos() y piernas() (cada una muestra con print un mensaje de lo que ensambla) y llámalas, una vez cada una, en ese orden. El robot gigante se irá armando mientras tu código se ejecuta.",
              PFA, solucion=solucion5,
              escenario={**FAB, "ensamble": True},
              validacion=todos({"tipo": "ensamble", "partes": ["cabeza", "brazos", "piernas"]}, def_("cabeza", 0), def_("brazos", 0), def_("piernas", 0), requiere={"construcciones": ["def"]}),
              retro="¡Jefe derrotado! Dividiste el trabajo en tres máquinas y las pusiste a trabajar en orden: eso es modularidad.",
              no_logrado="El robot está incompleto. Asegúrate de definir las 3 funciones y llamarlas en el orden correcto (cabeza, brazos, piernas).",
              trampas=[L("def cabeza():", '    print("Cabeza lista")', "def brazos():", '    print("Brazos listos")', "cabeza()", "brazos()"),
                       L("def cabeza():", '    print("Cabeza lista")', "def brazos():", '    print("Brazos listos")', "def piernas():", '    print("Piernas listas")', "piernas()", "brazos()", "cabeza()"),
                       L("def cabeza():", '    print("Cabeza lista")', "def brazos():", '    print("Brazos listos")', "def piernas():", '    print("Piernas listas")'),
                       L("def cabeza():", '    print("Cabeza lista")', "def brazos():", '    print("Brazos listos")', "def piernas():", '    print("Piernas listas")', "def pies():", '    print("Pies listos")', "cabeza()", "brazos()", "piernas()"),
                       L('print("Cabeza lista")', 'print("Brazos listos")', 'print("Piernas listas")')])
    n5 = nivel(55, 4, "El Gran Ensamblaje", "integración del Mundo 4", "jefe_mundo_4",
               "Llegó el pedido más grande de la historia de la fábrica: un Robot1 gigante. Nadie te dirá cómo hacerlo: tendrás que dividirlo en máquinas.", {**FAB, "ensamble": True}, [f5],
               siguiente="¡El Robot1 gigante está completo y la fábrica es un éxito! Robot1 ya sabe dividir un problema en máquinas. Ahora le espera el último desafío: el Mundo 5, el taller donde construirá proyectos completos por su cuenta.")
    guardar(jefe(n5, f5, eficiencia=False))


# =============================================================== NIVEL 0 · ¿QUÉ ES UN ALGORITMO? (diagramas de flujo)
def tarjeta(id, texto, forma="paso", accion=None):
    t = {"id": id, "texto": texto}
    if forma != "paso":
        t["forma"] = forma
    if accion:
        t["accion"] = accion
    return t


def nivel0():
    ini, fin = tarjeta("inicio", "Inicio", "inicio"), tarjeta("fin", "Fin", "fin")
    caminar = lambda n: tarjeta(f"caminar{n}", f"Caminar {n} paso" + ("s" if n != 1 else ""), accion={"tipo": "caminar", "pasos": n})
    abrir = tarjeta("abrir", "Abrir la puerta", accion={"tipo": "abrir"})
    recoger = tarjeta("recoger", "Recoger la llave", accion={"tipo": "recoger"})
    encender = tarjeta("encender", "Encender a Robot1", accion={"tipo": "encender"})

    def ordenar(id, titulo, enunciado, tarjetas_barajadas, orden, escenario, pistas, retro):
        f = {"id": id, "tipo": "ORDENAR", "titulo": titulo, "enunciado": enunciado, "codigoInicial": "",
             "instruccionesPermitidas": [], "metodosPermitidos": [], "escenario": escenario,
             "tarjetas": tarjetas_barajadas, "ordenCorrecto": orden, "validacion": {"tipo": "orden"},
             "retroalimentacion": retro, "pistas": pistas,
             "mensajeNoLogrado": "Esa tarjeta no iba todavía: ¡Robot1 chocó! Piensa qué tiene que pasar primero y vuelve a empezar."}
        return f

    fases = [
        ordenar("0.1", "La puerta del laboratorio",
                "Un ALGORITMO es una lista de pasos, en orden, que resuelve un problema. Robot1 está frente a una puerta: haz clic en las tarjetas en el orden correcto para que llegue y la abra. Cada diagrama de flujo empieza en Inicio y termina en Fin.",
                [abrir, fin, ini, caminar(3)], ["inicio", "caminar3", "abrir", "fin"], {"tipo": "diagrama", "largo": 5, "puertaX": 4},
                ["Un diagrama siempre empieza con Inicio.", "Robot1 tiene que estar junto a la puerta antes de abrirla."],
                "¡Lo lograste! Escribiste tu primer algoritmo: pasos en el orden correcto. Si cambias el orden, el resultado cambia."),
        ordenar("0.2", "La puerta con llave",
                "Ahora la puerta está cerrada con llave, y la llave está tirada en el pasillo. Ordena el algoritmo completo para que Robot1 recoja la llave y abra la puerta.",
                [abrir, caminar(3), fin, recoger, ini, caminar(1)], ["inicio", "caminar1", "recoger", "caminar3", "abrir", "fin"], {"tipo": "diagrama", "largo": 6, "puertaX": 5, "llaveX": 1},
                ["La llave está a 1 paso de Robot1.", "Sin la llave, la puerta no abre."],
                "Un algoritmo más largo: cada paso depende del anterior. ¡Ya piensas como programador!"),
        ordenar("0.3", "Robot1 apagado",
                "Robot1 está apagado y no puede caminar. Ordena TODO el algoritmo: despertarlo, recoger la llave y abrir la puerta.",
                [caminar(3), fin, abrir, encender, recoger, ini, caminar(1)], ["inicio", "encender", "caminar1", "recoger", "caminar3", "abrir", "fin"],
                {"tipo": "diagrama", "largo": 6, "puertaX": 5, "llaveX": 1, "apagado": True},
                ["Un robot apagado no se mueve.", "Primero encender, luego caminar."],
                "¡Listo para programar! En el Mundo 1 escribirás estos mismos pasos como instrucciones de código."),
    ]
    n = nivel(0, 1, "Antes de empezar: el algoritmo", "algoritmo y diagrama de flujo", "algoritmo_diagrama_flujo",
              "Antes de entrar al laboratorio, Robot1 necesita aprender lo más importante: seguir un algoritmo, una lista de pasos en el orden correcto.", {"tipo": "diagrama", "largo": 5, "puertaX": 4}, fases)
    n["tutorial"] = True
    n["ordinal"] = 0
    guardar(n)


# =============================================================== MUNDO 5 · PROYECTO (El Creador, 4 niveles)
# No enseña sintaxis nueva: cada nivel es un proyecto que integra input, if, while y variables. Validación ESTRICTA con varios
# casos de prueba (si falla uno, no pasa); el Nivel 4 es el proyecto libre y cierra CodeQuest.
PRY = {"tipo": "proyecto", "capacidad": 8}
P6 = ["asignacion", "print", "input", "int", "float", "str", "if", "elif", "else", "while", "for", "and", "or", "not", "booleanos", "def", "return"]
INTRO_M5 = "Robot1 llega al Laboratorio de creación: un taller con planos holográficos donde ya no hay lecciones, solo proyectos. Aquí se junta todo lo aprendido."


def caso(etiqueta, esperado, entradas=(), variables=None):
    c = {"etiqueta": etiqueta, "entradas": list(entradas), "esperado": {"tipo": "output_lineas", "valores": list(esperado)}}
    if variables:
        c["escenario"] = {"variables": variables}
    return c


def mundo5():
    limpiar_mundo(5)

    # ---- Nivel 1 · La máquina expendedora
    sol1 = L("dinero = int(input())", "precio = int(input())", "if dinero >= precio:", '    print("Cambio: " + str(dinero - precio))', "else:", '    print("Dinero insuficiente")')
    f1 = fase("56.1", "RESOLVER", "La máquina expendedora",
              "La máquina expendedora te pide primero el DINERO que metes y después el PRECIO del producto (los dos son números enteros). Si el dinero alcanza, muestra Cambio: seguido del cambio que devuelve (por ejemplo, Cambio: 3). Si no alcanza, muestra Dinero insuficiente. Cuidado con el caso en que el dinero es justo el precio.",
              P6, solucion=sol1,
              casos=[caso("10 para un producto de 7", ["Cambio: 3"], ["10", "7"]),
                     caso("Dinero justo", ["Cambio: 0"], ["5", "5"]),
                     caso("No alcanza", ["Dinero insuficiente"], ["3", "8"]),
                     caso("Billete grande", ["Cambio: 19"], ["20", "1"]),
                     caso("Falta una moneda", ["Dinero insuficiente"], ["99", "100"])],
              etiqueta_entrada="La máquina pide un número entero (primero el dinero y luego el precio)",
              validacion={"tipo": "casos", "requiere": {"construcciones": ["input", "int", "if", "else"]}},
              retro="La máquina cobra bien: convierte lo que llega de input(), decide con if y calcula el cambio.",
              pistas=["Convierte cada entrada con int(input()).", "if dinero >= precio: ... else: ...  (con >= el dinero justo también alcanza)."],
              no_logrado="Revisa los 5 casos: el dinero justo da Cambio: 0 y, si no alcanza, solo debe verse Dinero insuficiente.",
              trampas=[L("dinero = int(input())", "precio = int(input())", 'print("Cambio: " + str(dinero - precio))'),
                       L("dinero = int(input())", "precio = int(input())", "if dinero > precio:", '    print("Cambio: " + str(dinero - precio))', "else:", '    print("Dinero insuficiente")'),
                       L("dinero = int(input())", "precio = int(input())", "if dinero >= precio:", '    print("Cambio: " + str(precio - dinero))', "else:", '    print("Dinero insuficiente")'),
                       L('print("Cambio: 3")')])
    f1["sinPistas"] = False
    f1["mision"] = "Cobra: si el dinero alcanza muestra «Cambio: X» (con dinero justo, Cambio: 0); si no, «Dinero insuficiente»."
    n1 = nivel(56, 5, "La máquina expendedora", "proyecto: input, if y cálculos", "proyecto_expendedora", INTRO_M5, {"tipo": "expendedora"}, [f1])
    n1["proyecto"] = True
    guardar(n1)

    # ---- Nivel 2 · El validador de contraseñas
    sol2 = L("if longitud > 8 and tiene_numero:", '    print("Contraseña segura")', "else:", '    print("Contraseña débil")')
    vars_ = lambda c, l, t: {"contrasena": c, "longitud": l, "tiene_numero": t}
    f2 = fase("57.1", "RESOLVER", "El validador de contraseñas",
              "El sistema ya revisó la contraseña y te dejó listas tres variables en la memoria: contrasena (el texto), longitud (cuántos caracteres tiene) y tiene_numero (True si contiene algún número). Una contraseña es segura si tiene MÁS de 8 caracteres y además contiene un número. Muestra Contraseña segura o Contraseña débil.",
              P6, solucion=sol2,
              casos=[caso("Robot12345", ["Contraseña segura"], variables=vars_("Robot12345", 10, True)),
                     caso("Larga pero sin número", ["Contraseña débil"], variables=vars_("robotitos", 9, False)),
                     caso("Con número pero corta", ["Contraseña débil"], variables=vars_("R2d2", 4, True)),
                     caso("Justo 8 caracteres", ["Contraseña débil"], variables=vars_("robot123", 8, True)),
                     caso("9 caracteres con número", ["Contraseña segura"], variables=vars_("robot1234", 9, True)),
                     caso("Corta y sin número", ["Contraseña débil"], variables=vars_("abc", 3, False))],
              validacion={"tipo": "casos", "requiere": {"construcciones": ["if", "and", "else"]}},
              retro="Dos condiciones unidas con and: las dos tienen que cumplirse para que la contraseña sea segura.",
              pistas=["Las dos condiciones se unen con and: longitud > 8 and tiene_numero.", "«Más de 8» es > 8; con 8 justos no alcanza."],
              no_logrado="Una contraseña es segura SOLO si tiene más de 8 caracteres Y contiene un número. Revisa los casos que fallan.",
              trampas=[L("if longitud > 8:", '    print("Contraseña segura")', "else:", '    print("Contraseña débil")'),
                       L("if longitud >= 8 and tiene_numero:", '    print("Contraseña segura")', "else:", '    print("Contraseña débil")'),
                       L("if longitud > 8 or tiene_numero:", '    print("Contraseña segura")', "else:", '    print("Contraseña débil")'),
                       L('print("Contraseña segura")')])
    f2["mision"] = "Muestra «Contraseña segura» solo si tiene MÁS de 8 caracteres Y contiene un número; si no, «Contraseña débil»."
    n2 = nivel(57, 5, "El validador de contraseñas", "proyecto: variables, if y and", "proyecto_contrasenas", INTRO_M5, {"tipo": "puerta"}, [f2])
    n2["proyecto"] = True
    guardar(n2)

    # ---- Nivel 3 · El juego de adivinanza
    sol3 = L("intentos = 0", "acertado = False", "while intentos < 5 and not acertado:", "    intento = int(input())", "    intentos = intentos + 1",
             "    if intento == secreto:", '        print("¡Adivinaste!")', "        acertado = True", "    elif intento < secreto:", '        print("Muy bajo")',
             "    else:", '        print("Muy alto")', "if not acertado:", '    print("Perdiste")')
    f3 = fase("58.1", "RESOLVER", "El juego de adivinanza",
              "La computadora ya eligió un número secreto y lo guardó en la variable secreto. El jugador tiene como máximo 5 INTENTOS, y en cada uno escribe un número. Si acierta, muestra ¡Adivinaste! y el juego termina. Si se queda corto, muestra Muy bajo; si se pasa, Muy alto. Si gasta los 5 intentos sin acertar, muestra Perdiste. El juego no debe pedir más números de los necesarios.",
              P6, solucion=sol3,
              casos=[caso("Acierta al tercero", ["Muy bajo", "Muy alto", "¡Adivinaste!"], ["3", "9", "7"], {"secreto": 7}),
                     caso("Acierta al primero", ["¡Adivinaste!"], ["4"], {"secreto": 4}),
                     caso("Pierde", ["Muy bajo", "Muy bajo", "Muy bajo", "Muy bajo", "Muy bajo", "Perdiste"], ["1", "2", "3", "4", "5"], {"secreto": 10}),
                     caso("Acierta justo en el último intento", ["Muy alto", "Muy alto", "Muy alto", "Muy alto", "¡Adivinaste!"], ["9", "8", "7", "6", "5"], {"secreto": 5}),
                     caso("Alto, bajo y acierta", ["Muy alto", "Muy bajo", "¡Adivinaste!"], ["5", "1", "2"], {"secreto": 2})],
              etiqueta_entrada="Escribe tu intento (un número entero)",
              validacion={"tipo": "casos", "requiere": {"construcciones": ["while", "if", "int", "input"]}},
              retro="Un ciclo con límite de intentos y un if para comparar: el juego termina al acertar o al agotar los 5 intentos.",
              pistas=["Lleva la cuenta con una variable intentos y repite mientras intentos < 5.", "Usa otra variable (acertado) para salir del ciclo cuando el jugador gane."],
              no_logrado="Revisa los casos: acertar en el 5.º intento todavía gana, y no se deben pedir números de más después de acertar.",
              trampas=[L("intentos = 0", "while intentos < 5:", "    intento = int(input())", "    intentos = intentos + 1", "    if intento == secreto:", '        print("¡Adivinaste!")',
                         "    elif intento < secreto:", '        print("Muy bajo")', "    else:", '        print("Muy alto")', 'print("Perdiste")'),
                       L("intentos = 0", "acertado = False", "while intentos < 4 and not acertado:", "    intento = int(input())", "    intentos = intentos + 1", "    if intento == secreto:",
                         '        print("¡Adivinaste!")', "        acertado = True", "    elif intento < secreto:", '        print("Muy bajo")', "    else:", '        print("Muy alto")',
                         "if not acertado:", '    print("Perdiste")'),
                       L("intentos = 0", "acertado = False", "while intentos < 5 and not acertado:", "    intento = int(input())", "    intentos = intentos + 1", "    if intento == secreto:",
                         '        print("¡Adivinaste!")', "        acertado = True", "    elif intento > secreto:", '        print("Muy bajo")', "    else:", '        print("Muy alto")',
                         "if not acertado:", '    print("Perdiste")'),
                       L('print("¡Adivinaste!")')])
    f3["mision"] = "¡Juega! Tienes máximo 5 intentos: «Muy bajo», «Muy alto» o «¡Adivinaste!» (y termina); si se acaban, «Perdiste»."
    f3["entradasInteractivas"] = True  # este nivel se JUEGA: el estudiante teclea sus intentos (la evaluación prueba los 5 casos aparte)
    f3["variablesOcultas"] = ["secreto"]  # el número secreto no se muestra en Memoria
    f3["etiquetaEntrada"] = "Tu intento: un número del 1 al 10"
    n3 = nivel(58, 5, "El juego de adivinanza", "proyecto: while, límite de intentos e if", "proyecto_adivinanza", INTRO_M5, {"tipo": "radar", "maxIntentos": 5}, [f3])
    n3["proyecto"] = True
    guardar(n3)

    # ---- Nivel 4 · Proyecto libre (cierra CodeQuest)
    sol4 = L("energia = 10", "ciclos = 0", 'print("Iniciando el sistema")', "while energia > 0:", "    energia = energia - 3", "    ciclos = ciclos + 1",
             "    if energia > 5:", '        print("Energía alta")', "    else:", '        print("Energía baja")', 'print("Ciclos: " + str(ciclos))')
    f4 = fase("59.1", "RESOLVER", "Proyecto libre",
              "Este es TU proyecto: un juego, una calculadora, una simulación… lo que imagines. Escribe un programa de al menos 10 líneas de código (los comentarios y las líneas vacías no cuentan) que use un if, un while y al menos una variable. Se comprobará que se ejecute sin errores.",
              P6, solucion=sol4,
              validacion={"tipo": "todos", "condiciones": [{"tipo": "ejecutado"}, {"tipo": "min_lineas", "minimo": 10}],
                          "requiere": {"construcciones": ["if", "while"], "algunaVariable": True}},
              retro="¡Tu proyecto funciona! Usaste decisiones, ciclos y variables en un mismo programa.",
              no_logrado="Tu programa necesita al menos 10 líneas de código (sin contar comentarios ni líneas vacías) y usar un if, un while y una variable.",
              trampas=[L("energia = 10", "while energia > 0:", "    energia = energia - 3", "    if energia > 5:", '        print("alta")', "    else:", '        print("baja")'),
                       L("a = 1", "b = 2", "c = 3", "d = 4", "e = 5", "f = 6", "g = 7", "h = 8", "i = 9", "j = 10"),
                       L("n = 0", "while n < 3:", "    n = n + 1", "    print(n)", "print(1)", "print(2)", "print(3)", "print(4)", "print(5)", "print(6)"),
                       L("n = 0", "if n == 0:", '    print("cero")', "print(1)", "print(2)", "print(3)", "print(4)", "print(5)", "print(6)", "print(7)"),
                       L("# Un comentario", "# otro", "# y otro", "energia = 10", "while energia > 0:", "    energia = energia - 5", "    if energia > 5:", '        print("a")')])
    f4["mision"] = "Tu proyecto: un programa de al menos 10 líneas de código con un if, un while y una variable, sin errores."
    n4 = nivel(59, 5, "Proyecto libre", "proyecto final de CodeQuest", "jefe_mundo_5", INTRO_M5, {"tipo": "nucleo"}, [f4],
               siguiente="¡Felicidades, has completado CodeQuest! Ahora piensas como un programador.")
    guardar(jefe(n4, f4, eficiencia=False))
    n4["proyecto"] = True
    guardar(n4)


if __name__ == "__main__":
    mundo1()
    mundo2()
    mundo3()
    mundo4()
    mundo5()
    jefes()
    nivel0()
    print("Niveles generados: Mundo 1 (salvo los JSON escritos a mano: 0-5, 7 y 9), Mundos 2 a 5, los jefes y el Nivel 0.")
