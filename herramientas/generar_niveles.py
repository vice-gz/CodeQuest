#!/usr/bin/env python3
"""
Genera los JSON de los niveles de los Mundos 2, 3 y 4 (Avance 3).

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


# =============================================================== MUNDO 2
D = {"tipo": "datos", "capacidad": 8}
P1 = ["asignacion", "print"]
P2 = ["asignacion", "print", "input"]
P3 = ["asignacion", "print", "input", "int", "float", "str"]  # + conversiones de tipo de Python


def mundo2():
    n = []
    n.append(nivel(9, 2, "Necesito recordar", "variable, asignación, identificador, literal", "variables",
        "En la terminal, cada valor que escribías se usaba y se perdía. Robot1 despierta en el Centro de Recuperación: para recordar, necesita módulos de memoria.",
        D, [
        fase("9.1", "EXPLORAR", "El primer módulo",
             "Concepto nuevo: el signo = guarda un valor con un nombre en un módulo de memoria. Ese nombre es una variable. Ejecuta y mira cómo se ilumina un chip.",
             P1, codigo=L('nombre = "Robot1"', "print(nombre)"),
             retro="El signo = guarda un valor con un nombre. El chip muestra lo guardado.",
             pistas=["Mira los chips morados: el nombre está arriba y el valor al centro."]),
        fase("9.2", "PREDECIR", "¿Qué muestra print?",
             'Con nombre = "Robot1", ¿qué muestra print(nombre), sin comillas?', P1,
             codigo=L('nombre = "Robot1"', "print(nombre)"),
             opciones=[("a", "La palabra nombre"), ("b", "El texto Robot1"), ("c", "Un error, porque faltan comillas")], correcta="b",
             retro="Correcto: sin comillas, nombre es una variable y print muestra su contenido.",
             pistas=["print(\"nombre\") y print(nombre) son cosas distintas."]),
        fase("9.3", "ESCRIBIR", "Guarda y reutiliza",
             'Crea una variable llamada mision con el texto "Explorar" y muéstrala con print().', P1,
             solucion=L('mision = "Explorar"', "print(mision)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "Explorar", "variableRequerida": "mision"},
             retro="Ya sabes crear una variable y asignarle un valor.",
             pistas=['Primero mision = "Explorar".', "Luego print(mision), sin comillas."],
             no_logrado="Debes usar una variable llamada mision y mostrarla con print().",
             trampas=['print("Explorar")']),
    ]))
    n.append(nivel(10, 2, "Cambia de opinión", "reasignación, estado", "reasignacion",
        "Un módulo de memoria no es una caja sellada: puede guardar otro valor cuando el programa lo decide.", D, [
        fase("10.1", "EXPLORAR", "Un valor nuevo",
             "Concepto nuevo: reasignar es darle otro valor a una variable que ya existe. El valor anterior se pierde. Ejecuta y mira el chip.",
             P1, codigo=L("energia = 50", "print(energia)", "energia = 80", "print(energia)"),
             retro="Reasignar reemplaza el valor anterior: el chip muestra «antes» y el valor nuevo.",
             pistas=["Fíjate en el texto pequeño «antes:» dentro del chip."]),
        fase("10.2", "PREDECIR", "¿Con qué valor termina?", "¿Qué muestra este programa?", P1,
             codigo=L("puntos = 10", "puntos = 25", "print(puntos)"),
             opciones=[("a", "10"), ("b", "25"), ("c", "35")], correcta="b",
             retro="Correcto: la segunda asignación reemplaza a la primera, no se suman.",
             pistas=["Una variable guarda UN solo valor a la vez."]),
        fase("10.3", "RESOLVER", "Carga la batería",
             "La variable bateria vale 20. Cámbiala a 90 y muestra su valor.", P1,
             codigo="bateria = 20", solucion=L("bateria = 20", "bateria = 90", "print(bateria)"),
             validacion={"tipo": "todos", "condiciones": [{"tipo": "variables", "variables": {"bateria": 90}},
                                                         {"tipo": "output_lineas", "valores": ["90"]}]},
             retro="Reasignaste una variable para cambiar su estado.",
             pistas=["Escribe bateria = 90 debajo de la primera línea.", "Después usa print(bateria)."],
             no_logrado="bateria debe terminar valiendo 90 y debes mostrarla una sola vez.",
             trampas=['print(90)']),
    ]))
    n.append(nivel(11, 2, "No todo es lo mismo", "entero, decimal, texto", "tipos_de_datos",
        "La información llega en formas distintas: números enteros, decimales y textos. Cada chip lo indica con una etiqueta.", D, [
        fase("11.1", "EXPLORAR", "Tres tipos de dato",
             "Concepto nuevo: los datos tienen tipo. 15 es un ENTERO, 1.75 es un DECIMAL (con punto) y \"Ana\" es un TEXTO (entre comillas). Mira la etiqueta de cada chip.",
             P1, codigo=L("edad = 15", "altura = 1.75", 'nombre = "Ana"', "print(edad)", "print(altura)", "print(nombre)"),
             retro="El tipo depende de cómo escribes el valor: sin comillas es número, con comillas es texto.",
             pistas=["Compara las etiquetas ENTERO, DECIMAL y TEXTO en la parte baja de los chips."]),
        fase("11.2", "PREDECIR", "Unir textos",
             'Concepto nuevo: en CQL, sumar dos textos los une en uno solo (se llama concatenar). Aquí a y b son textos porque están entre comillas. ¿Qué muestra este programa?', P1,
             codigo=L('a = "5"', 'b = "3"', "print(a + b)"),
             opciones=[("a", "8"), ("b", "53"), ("c", "Un error")], correcta="b",
             retro='Correcto: con textos, + los une uno detrás de otro (53), no los suma. ¡Cuidado! Esto solo funciona con textos: si intentas sumar un texto y un número (por ejemplo "5" + 3), el programa dará un error.',
             pistas=["Las comillas convierten al 5 y al 3 en textos.", "Unir textos no es lo mismo que sumar números."]),
        fase("11.3", "DEBUG", "El número disfrazado",
             'Este programa debería mostrar 16, pero da un error: edad está entre comillas, así que es un TEXTO, y no se puede sumar un texto con un número. Corrígelo.', P1,
             codigo=L('edad = "15"', "print(edad + 1)"), solucion=L("edad = 15", "print(edad + 1)"),
             validacion={"tipo": "output_lineas", "valores": ["16"], "requiere": {"operador": "+", "variable": "edad"}},
             retro="Sin comillas, 15 es un número y se puede sumar. Con comillas es un texto, y sumarlo con un número da error.", pistas=["¿Las comillas son necesarias aquí?"],
             no_logrado="La salida debe ser exactamente 16.", trampas=["edad = 15\nprint(16)\nedad = \"15\"\nprint(edad + 1)"]),
        fase("11.4", "DEBUG", "El decimal con coma",
             "En CQL los decimales se escriben con punto, no con coma. Corrige el programa para que precio valga 2.5 y se muestre.", P1,
             codigo=L("precio = 2,5", "print(precio)"), solucion=L("precio = 2.5", "print(precio)"),
             validacion={"tipo": "todos", "condiciones": [{"tipo": "variables", "variables": {"precio": 2.5}},
                                                         {"tipo": "output_lineas", "valores": ["2.5"]}]},
             retro="Los decimales usan punto: 2.5.", pistas=["Cambia la coma por un punto."]),
    ]))
    n.append(nivel(12, 2, "Cálculo de energía", "operadores, expresiones", "operadores",
        "Los módulos pueden calcular. Los valores viajan por cables luminosos de un chip a otro.", D, [
        fase("12.1", "EXPLORAR", "Sumar módulos",
             "Concepto nuevo: los operadores + y - calculan con variables. Mira cómo los valores de a y b fluyen hacia total.",
             P1, codigo=L("a = 40", "b = 25", "total = a + b", "print(total)"),
             retro="Una expresión se calcula primero y su resultado se guarda en la variable.",
             pistas=["Sigue los cables: salen de a y b y llegan a total."]),
        fase("12.2", "MODIFICAR", "¿Cuánta queda?",
             "La reserva es 80 y se usaron 35. Modifica UNA línea para que el programa muestre cuánta energía queda (45).", P1,
             codigo=L("reserva = 80", "usada = 35", "restante = reserva + usada", "print(restante)"),
             solucion=L("reserva = 80", "usada = 35", "restante = reserva - usada", "print(restante)"),
             validacion={"tipo": "output_exacto", "valorEsperado": "45", "requiere": {"operador": "-"}},
             retro="La resta - calcula lo que queda.", pistas=["Lo que queda se calcula restando."],
             no_logrado="Debe mostrar 45 usando una resta.", trampas=["reserva = 80\nusada = 35\nprint(45)"]),
        fase("12.3", "RESOLVER", "Dos módulos, una suma",
             "Dos módulos tienen 30 y 45 de energía. Guarda cada valor en una variable, suma ambas en total y muestra total (75).", P1,
             solucion=L("a = 30", "b = 45", "total = a + b", "print(total)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "75", "variableRequerida": "total", "requiere": {"operador": "+"}},
             retro="Combinaste variables con un operador.", pistas=["Primero a = 30 y b = 45.", "Luego total = a + b."],
             no_logrado="Debes calcular total con + y mostrarlo.", trampas=["total = 75\nprint(total)"]),
    ]))
    n.append(nivel(13, 2, "Calcula el reparto", "multiplicación, división, división entera y residuo", "operadores_aritmeticos",
        "Repartir recursos exige más que sumar: multiplicar, dividir y averiguar qué sobra.", D, [
        fase("13.1", "EXPLORAR", "Cuatro operadores nuevos",
             "Conceptos nuevos (como en Python): * multiplica; / divide y SIEMPRE da un decimal (17 / 4 es 4.25); // es la división entera: solo la parte entera (17 // 4 es 4); y % da el RESIDUO: lo que sobra al dividir.",
             P1, codigo=L("a = 17", "print(a * 2)", "print(a / 4)", "print(a // 4)", "print(a % 5)"),
             retro="17 / 4 da 4.25 (decimal), 17 // 4 da 4 (cuántas veces cabe, entero) y 17 % 5 da 2 (lo que sobra).",
             pistas=["% no es porcentaje: es el residuo de la división.", "Fíjate en la etiqueta DECIMAL del chip cuando usas /."]),
        fase("13.2", "PREDECIR", "La división siempre da decimal", "En Python, ¿qué muestra este programa?", P1,
             codigo=L("a = 10", "b = 2", "print(a / b)"),
             opciones=[("a", "5"), ("b", "5.0"), ("c", "2")], correcta="b",
             retro="Correcto: / SIEMPRE devuelve un decimal, aunque la división sea exacta (10 / 2 es 5.0). Para obtener un entero se usa //.",
             pistas=["Si quisieras un entero usarías //."]),
        fase("13.3", "PREDECIR", "¿Cuánto sobra?", "¿Qué muestra este programa?", P1,
             codigo=L("x = 14", "y = x % 4", "print(y)"),
             opciones=[("a", "2"), ("b", "3"), ("c", "3.5")], correcta="a",
             retro="14 entre 4 cabe 3 veces (12) y sobran 2.", pistas=["14 = 4 × 3 + ?"]),
        fase("13.4", "RESOLVER", "Cajas de cinco",
             "Hay 23 baterías y se guardan en cajas de 5. Muestra primero cuántas cajas se llenan (4, usa la división entera) y luego cuántas baterías sobran (3), en ese orden.", P1,
             solucion=L("baterias = 23", "print(baterias // 5)", "print(baterias % 5)"),
             validacion={"tipo": "output_lineas", "valores": ["4", "3"], "requiere": {"operadores": ["//", "%"]}},
             retro="Usaste // para repartir en cajas completas y % para el sobrante.", pistas=["Cajas llenas: baterias // 5.", "Sobrante: baterias % 5."],
             no_logrado="Debe mostrar 4 y luego 3, usando // y %.",
             trampas=[L("baterias = 23", "print(baterias / 5)", "print(baterias % 5)")]),
    ]))
    n.append(nivel(14, 2, "Información del exterior", "input(), int() y float()", "entrada_con_variables",
        "Hasta ahora todos los datos los escribía el programa. Ahora un sensor externo va a enviar un valor.", D, [
        fase("14.1", "EXPLORAR", "El sensor pregunta",
             "Concepto nuevo: input() pausa el programa y espera un dato de quien juega; se guarda en una variable. OJO, como en Python: input() SIEMPRE lee TEXTO, aunque escribas un número. Cuando la terminal te lo pida, escribe 12 y mira qué muestra valor + valor.",
             P2, codigo=L("valor = input()", "print(valor)", "print(valor + valor)"), entradas=["12"], etiqueta_entrada="El sensor pregunta: ¿qué valor envía?",
             retro='valor + valor mostró 1212, no 24: input() devolvió el TEXTO "12", y sumar textos los une (concatena).', pistas=["Escribe 12 en el campo de la terminal y pulsa Enter.", "Compara lo que muestra valor con lo que muestra valor + valor."]),
        fase("14.2", "PREDECIR", "Convertir con int()",
             'En Python, si necesitas un número debes convertir el texto: int("12") lo vuelve el número entero 12. ¿Qué muestra este programa?', P3,
             codigo=L('numero = int("12")', "print(numero + 1)"),
             opciones=[("a", "13"), ("b", "121"), ("c", "Un error")], correcta="a",
             retro='Correcto: int("12") es el número 12, y 12 + 1 es 13. Con el texto "12" + 1 habría dado error.',
             pistas=["int() convierte texto en número entero.", "float() hace lo mismo pero con decimales."]),
        fase("14.3", "ESCRIBIR", "Suma con el sensor",
             "Pide el valor del sensor (escribe 12), conviértelo con int(input()), guárdalo en una variable, súmale 5 en total y muestra total (17).", P3,
             solucion=L("valor = int(input())", "total = valor + 5", "print(total)"), entradas=["12"], etiqueta_entrada="El sensor pregunta: ¿qué valor envía?",
             validacion={"tipo": "output_con_variable", "valorEsperado": "17", "variableRequerida": "total", "requiere": {"construcciones": ["int"]}},
             retro="Combinaste input, int(), variables y operadores.", pistas=["valor = int(input())", "total = valor + 5"],
             no_logrado="Con el valor 12, total debe ser 17. Recuerda convertir con int().",
             trampas=[L("valor = input()", "total = valor + 5", "print(total)")]),
        fase("14.4", "RESOLVER", "La mitad del tramo",
             "Pide el valor del sensor como número decimal con float(input()) (escribe 7) y muestra su mitad (3.5) usando una división.", P3,
             solucion=L("tramo = float(input())", "print(tramo / 2)"), entradas=["7"], etiqueta_entrada="¿Cuánto mide el tramo?",
             validacion={"tipo": "output_exacto", "valorEsperado": "3.5", "requiere": {"operador": "/", "construcciones": ["float"]}},
             retro="float() convierte el texto en decimal. Lo que escribe la persona entra al programa como un dato más.", pistas=["Guarda float(input()) y divide entre 2."],
             no_logrado="Con 7, la mitad es 3.5 (usa float y /).",
             trampas=[L("tramo = int(input())", "print(tramo // 2)")]),
    ]))
    n.append(nivel(15, 2, "El identificador incorrecto", "identificadores", "identificadores",
        "Un nombre mal escrito deja un módulo huérfano: el programa no sabe encontrarlo.", D, [
        fase("15.1", "EXPLORAR", "Nombres válidos",
             "Concepto nuevo: el nombre de una variable (identificador) puede llevar letras, números y _, pero NO empieza con número. También importa si es mayúscula o minúscula.",
             P1, codigo=L("energia_total = 90", "valor2 = 7", "print(energia_total)", "print(valor2)"),
             retro="Buenos nombres: letras, números y _ (sin empezar con número).", pistas=["energia_total usa guion bajo en vez de espacio."]),
        fase("15.2", "DEBUG", "Empieza con número",
             "El nombre 2valor no es válido porque empieza con un número. Cámbialo por valor2 para que el programa muestre 5.", P1,
             codigo=L("2valor = 5", "print(2valor)"), solucion=L("valor2 = 5", "print(valor2)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "5", "variableRequerida": "valor2"},
             retro="Un identificador no puede empezar con número.", pistas=["Pasa el 2 al final del nombre."]),
        fase("15.3", "PREDECIR", "Mayúsculas importan", "¿Qué pasa al ejecutar este programa?", P1,
             codigo=L('Nombre = "Ana"', "print(nombre)"),
             opciones=[("a", "Muestra Ana"), ("b", "Error: la variable nombre no existe"), ("c", "Muestra Nombre")], correcta="b",
             retro="Nombre y nombre son identificadores distintos.", pistas=["Compara cómo se escribe la variable en cada línea."]),
        fase("15.4", "DEBUG", "Una letra de más",
             "Corrige el programa para que muestre 10. Las dos líneas deben usar exactamente el mismo nombre.", P1,
             codigo=L("Puntos = 10", "print(puntos)"), solucion=L("puntos = 10", "print(puntos)"),
             validacion={"tipo": "output_exacto", "valorEsperado": "10"},
             retro="Los nombres deben coincidir letra por letra, también en mayúsculas.", pistas=["Usa minúscula en la primera línea."]),
    ]))
    n.append(nivel(16, 2, "Módulos que se combinan", "combinación de variables, tipos y operadores", "integracion_variables_tipos_operadores",
        "Los módulos recuperados ya pueden trabajar juntos: valores de distintos tipos y cálculos que dependen de otros.", D, [
        fase("16.1", "EXPLORAR", "Área y etiqueta",
             "Observa cómo un cálculo usa dos variables y cómo otra variable guarda un texto.", P1,
             codigo=L("ancho = 8", "alto = 5", "area = ancho * alto", 'etiqueta = "Area"', "print(etiqueta)", "print(area)"),
             retro="Variables de distintos tipos conviven en la memoria.", pistas=["Mira los tipos: dos ENTERO y un TEXTO."]),
        fase("16.2", "ESCRIBIR", "El triángulo",
             "Guarda 12 en base y 5 en altura. Calcula area = base * altura / 2 y muéstrala (recuerda que / siempre da un decimal: verás 30.0).", P1,
             solucion=L("base = 12", "altura = 5", "area = base * altura / 2", "print(area)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "30.0", "variableRequerida": "area", "requiere": {"operadores": ["*", "/"]}},
             retro="Una expresión puede mezclar varios operadores. Como / da decimal, el resultado es 30.0.", pistas=["base * altura primero, luego / 2."],
             no_logrado="area debe ser 30.0 y calcularse con * y /."),
        fase("16.3", "RESOLVER", "Mensaje recuperado",
             'Guarda en mensaje el texto "Memoria recuperada" y en modulos el resultado de 4 * 3. Muestra primero mensaje y luego modulos.', P1,
             solucion=L('mensaje = "Memoria recuperada"', "modulos = 4 * 3", "print(mensaje)", "print(modulos)"),
             validacion={"tipo": "todos", "condiciones": [
                 {"tipo": "output_lineas", "valores": ["Memoria recuperada", "12"]},
                 {"tipo": "variables", "variables": {"mensaje": "Memoria recuperada", "modulos": 12}}]},
             retro="Combinaste textos y números en un mismo programa.", pistas=["Dos variables y dos print."]),
        fase("16.4", "ESCRIBIR", "Etiqueta con número",
             'Para unir un texto con un número hay que convertir el número en texto con str(); si no, Python da un error. Guarda 12 en modulos y muestra exactamente: Modulos: 12 (uniendo el texto "Modulos: " con modulos).', P3,
             solucion=L("modulos = 12", 'print("Modulos: " + str(modulos))'),
             validacion={"tipo": "output_lineas", "valores": ["Modulos: 12"], "requiere": {"construcciones": ["str"], "variable": "modulos"}},
             retro='str(12) es el texto "12", y así se puede unir con otro texto. "Modulos: " + 12 sería un error.',
             pistas=['print("Modulos: " + str(modulos))'], no_logrado="Debe mostrar Modulos: 12 usando str().",
             trampas=[L("modulos = 12", 'print("Modulos: 12")'), L("modulos = 12", 'print("Modulos: " + modulos)')]),
    ]))
    n.append(nivel(17, 2, "El sistema de energía", "valores que cambian y valores que no", "constantes_vs_variables",
        "Algunos datos no deben cambiar nunca (como la capacidad máxima) y otros cambian todo el tiempo (la carga actual).", D, [
        fase("17.1", "EXPLORAR", "MAXIMO y actual",
             "Concepto nuevo: por costumbre, los valores que NO deben cambiar se escriben en MAYÚSCULAS (MAXIMO). Los que cambian, en minúsculas. Mira qué chip se reasigna.",
             P1, codigo=L("MAXIMO = 100", "actual = 40", "actual = actual + 25", "print(actual)", "print(MAXIMO)"),
             retro="MAXIMO se queda igual; actual cambia con el tiempo.", pistas=["Solo el chip de actual muestra «antes»."]),
        fase("17.2", "MODIFICAR", "Hasta el tope",
             "actual vale 20 y se le suma 30. Cambia el 30 por el número correcto para que actual llegue exactamente a MAXIMO (100). Debes seguir usando una suma.", P1,
             codigo=L("MAXIMO = 100", "actual = 20", "actual = actual + 30", "print(actual)"),
             solucion=L("MAXIMO = 100", "actual = 20", "actual = actual + 80", "print(actual)"),
             validacion={"tipo": "output_exacto", "valorEsperado": "100", "requiere": {"operador": "+"}},
             retro="Calculaste cuánto faltaba para llegar al máximo.", pistas=["¿Cuánto le falta a 20 para llegar a 100?"],
             trampas=["MAXIMO = 100\nactual = MAXIMO\nprint(actual)"]),
        fase("17.3", "RESOLVER", "¿Cuánto falta?",
             "Con MAXIMO = 100 y actual = 35, calcula en faltante cuánto falta para llenar y muéstralo (65).", P1,
             solucion=L("MAXIMO = 100", "actual = 35", "faltante = MAXIMO - actual", "print(faltante)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "65", "variableRequerida": "faltante", "requiere": {"operador": "-"}},
             retro="Usaste un valor fijo y uno cambiante en la misma resta.", pistas=["faltante = MAXIMO - actual"]),
    ]))
    n.append(nivel(18, 2, "El puente de datos", "variables, operadores, input y conversiones juntos", "integracion_libre",
        "Para cruzar el puente de datos hay que combinar todo lo recuperado hasta ahora.", D, [
        fase("18.1", "ESCRIBIR", "Distancia",
             "Guarda tiempo = 3 y velocidad = 12. Calcula distancia = tiempo * velocidad y muéstrala (36).", P1,
             solucion=L("tiempo = 3", "velocidad = 12", "distancia = tiempo * velocidad", "print(distancia)"),
             validacion={"tipo": "output_con_variable", "valorEsperado": "36", "variableRequerida": "distancia", "requiere": {"operador": "*"}},
             retro="Aplicaste variables y operadores.", pistas=["Tres variables: tiempo, velocidad y distancia."]),
        fase("18.2", "RESOLVER", "Cruza con el sensor",
             "Pide un valor al sensor (escribe 10), conviértelo con int(), súmale 15 y muestra el resultado (25) usando una variable llamada resultado.", P3,
             solucion=L("dato = int(input())", "resultado = dato + 15", "print(resultado)"), entradas=["10"], etiqueta_entrada="¿Qué valor envía el sensor?",
             validacion={"tipo": "output_con_variable", "valorEsperado": "25", "variableRequerida": "resultado"},
             retro="Combinaste input, int(), variables y cálculo.", pistas=["Convierte con int(input()) antes de sumar."]),
        fase("18.3", "LIBRE", "Laboratorio de memoria",
             "Experimenta: crea las variables que quieras, cambia sus valores y combínalas. Nada de esto se evalúa.", P3,
             codigo=L("# Prueba lo que quieras", "x = 5", "print(x)"), retro="Ya dominas variables, tipos, operadores, input() y las conversiones.",
             pistas=["Prueba restar, multiplicar y reasignar."]),
    ]))
    n.append(nivel(19, 2, "La puerta del Mundo 3", "integración total del Mundo 2", "integracion_mundo_2",
        "La puerta al Mundo 3 pide un código de acceso hecho con todo lo que Robot1 recuperó.", D, [
        fase("19.1", "RESOLVER", "El código de acceso",
             "Guarda a = 7 y b = 3. Muestra, en este orden: a + b, a - b, a * b y a % b.", P1,
             solucion=L("a = 7", "b = 3", "print(a + b)", "print(a - b)", "print(a * b)", "print(a % b)"),
             validacion={"tipo": "output_lineas", "valores": ["10", "4", "21", "1"], "requiere": {"operadores": ["+", "-", "*", "%"]}},
             retro="Usaste cuatro operadores con dos variables.", pistas=["Cuatro print, uno por cada operación."]),
        fase("19.2", "ESCRIBIR", "El triple",
             "Pide un número al sensor (escribe 9), conviértelo con int() y muestra su triple (27) con una variable llamada triple.", P3,
             solucion=L("n = int(input())", "triple = n * 3", "print(triple)"), entradas=["9"], etiqueta_entrada="¿Qué número envía el sensor?",
             validacion={"tipo": "output_con_variable", "valorEsperado": "27", "variableRequerida": "triple"},
             retro="input, int(), variable y operador en un solo programa.", pistas=["n = int(input())", "triple = n * 3"],
             trampas=[L("n = input()", "triple = n * 3", "print(triple)")]),
        fase("19.3", "LIBRE", "Tu mejor programa",
             "Construye el programa que quieras con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 2.", P3,
             codigo=L("# Combina variables, tipos, operadores, input() y conversiones", 'nombre = "Robot1"', "print(nombre)"),
             retro="¡Mundo 2 completado!", pistas=["Prueba pedir datos con int(input()) y calcular con ellos."]),
    ], siguiente="¡Has cruzado el puente! Pero al otro lado te espera un desafío mayor: la puerta al Mundo 3 está bloqueada. Robot1 necesitará aprender a tomar decisiones. (Próximamente en el Avance 3)."))
    for x in n:
        guardar(x)


def limpiar_mundo(m):
    for f in glob.glob(os.path.join(RAIZ, "levels", f"mundo{m}", "level*.json")):
        os.remove(f)


# =============================================================== MUNDO 3 (12 niveles)
# Bloque 1 (1-4) Aprender · Bloque 2 (5-8) Practicar · Bloque 3 (9-12) Dominar
C = {"tipo": "cartas"}
SALA = "Robot1 cruza la puerta y entra a la Sala de Estrategia: una mesa de cartas holográfica que solo se abre ante quien sabe tomar decisiones."
P_IF = ["print", "if"]
P_IFE = ["print", "if", "else"]
P_AND = ["print", "if", "else", "and", "or"]
P_LOG = ["print", "asignacion", "if", "else", "and", "or", "not", "booleanos"]
P_ELIF = ["print", "asignacion", "if", "elif", "else", "and", "or", "not", "booleanos"]
H = "H"  # (solo para legibilidad)


def mundo3():
    limpiar_mundo(3)
    n = []

    # ------------------------------------------------ Bloque 1 · APRENDER
    n.append(nivel(20, 3, "Pasarse de 21", "condicional if", "condicional_if", SALA, C, [
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

    n.append(nivel(21, 3, "Ganar o perder", "if / else", "condicional_if_else",
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

    n.append(nivel(22, 3, "Comparar es preguntar", "comparación de igualdad (==)", "comparadores_igualdad",
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

    n.append(nivel(23, 3, "Mayor, menor o igual", "comparación de orden (<, >, <=, >=)", "comparadores_orden",
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
    n.append(nivel(24, 3, "Dos condiciones a la vez", "operador lógico and", "operador_and",
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
             "Este programa da un error porque usa un símbolo de otro lenguaje para decir «y». En CQL se escribe con la palabra and. Corrígelo.", P_AND,
             codigo=L('if color1 == "roja" && total < 21:', '    print("Apuesta")', "else:", '    print("Pasa")'),
             solucion=L('if color1 == "roja" and total < 21:', '    print("Apuesta")', "else:", '    print("Pasa")'),
             escenario={"mostrarColor": True},
             casos=casos_mesas(manos_and, c_and, mostrarColor=True), validacion=casos_val({"construcciones": ["and"]}),
             retro="En CQL las condiciones se unen con las palabras and, or y not.", pistas=["Cambia && por una palabra."]),
    ]))

    n.append(nivel(25, 3, "O, y no", "operadores lógicos or y not", "operadores_or_not",
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
    n.append(nivel(26, 3, "Varios caminos", "elif", "condicional_elif",
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
    n.append(nivel(27, 3, "Decisiones dentro de decisiones", "condicionales anidados", "condicionales_anidados",
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
    n.append(nivel(28, 3, "El aviso del crupier", "reglas con elif", "reglas_con_elif",
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
    n.append(nivel(29, 3, "Pares", "pares y condiciones combinadas", "pares_y_condiciones",
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
    n.append(nivel(30, 3, "Combinaciones", "combinaciones lógicas", "combinaciones_logicas",
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
    n.append(nivel(31, 3, "El crupier final", "integración de condicionales", "integracion_mundo_3",
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
        fase("31.3", "LIBRE", "Mesa libre", "Experimenta con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 3.", P_ELIF, ["poner_carta", "voltear"],
             codigo=L("# Escribe tus propias reglas", "if total > 21:", '    print("Bust")'),
             escenario={"mostrarCartas": True, "mostrarColor": True, "cartas": mano((10, "C"), (7, "P"))},
             casos=libres([[(10, "C"), (7, "P")], [(5, "D"), (6, "T"), (9, "C")]], mostrarColor=True), retro="¡Mundo 3 completado!", pistas=["Prueba cambiar de mesa."]),
    ], siguiente="¡La sala de estrategia se abre! Pero al cruzar, Robot1 oye un zumbido: un edificio entero depende de un elevador que no deja de fallar. Entra al Mundo 4: Automatización."))
    for x in n:
        guardar(x)


# =============================================================== MUNDO 4 (12 niveles)
E = {"tipo": "elevador", "pisos": 5, "capacidad": 4, "pisoInicial": 1}
ELEV_TODOS = ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"]
ENTREGA = {"tipo": "elevador_entrega"}
INTRO_M4 = "En el complejo industrial, el elevador solo hace lo que se le ordena. Repetir la misma orden a mano es agotador: hay que enseñarle a repetirse."
W = ["print", "asignacion", "while"]
WI = ["print", "asignacion", "while", "if", "else", "not"]
FOR = ["print", "asignacion", "while", "for", "if", "else", "not", "and", "or"]
TODOS_M = ["subir", "bajar", "recoger", "soltar", "piso", "hayPasajero", "llevando"]


def caso_pasajeros(cantidad_a_estado):
    return cantidad_a_estado


def mundo4():
    limpiar_mundo(4)
    n = []

    # ------------------------------------------------ Bloque 1 · APRENDER
    n.append(nivel(32, 4, "El ascensor automático", "ciclo while", "ciclo_while", INTRO_M4, E, [
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
    n.append(nivel(33, 4, "Repetir con for", "ciclo for con range", "ciclo_for_range",
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
    n.append(nivel(34, 4, "Contar repeticiones", "contadores en un while", "contadores",
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
    n.append(nivel(35, 4, "El valor de i", "for con variable y range(inicio, fin)", "for_con_variable",
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
    n.append(nivel(36, 4, "El bucle infinito", "ciclos con condición y bucles infinitos", "bucle_infinito",
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
    n.append(nivel(37, 4, "Recoger pasajeros", "while con decisiones", "while_con_decisiones",
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
    n.append(nivel(38, 4, "For con decisiones", "for con if", "for_con_condicion",
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
    n.append(nivel(39, 4, "Cuenta lo que haces", "contadores con condición", "contadores_con_condicion",
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
    n.append(nivel(40, 4, "Evacuación completa", "evacuación con ciclos", "evacuacion_completa",
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
    n.append(nivel(41, 4, "La cabina chica", "capacidad limitada", "capacidad_limitada",
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
    n.append(nivel(42, 4, "Reportes por piso", "ciclos con reportes", "reportes_con_ciclos",
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
    n.append(nivel(43, 4, "El gran operativo", "contadores con ciclos", "integracion_mundo_4",
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
        fase("43.3", "LIBRE", "Torre libre", "Experimenta con todo lo aprendido. Nada se evalúa: es tu despedida del Mundo 4.", FOR, TODOS_M,
             codigo=L("# Prueba tus propios ciclos", "for i in range(4):", "    elevador.subir(1)"), escenario={"pasajeros": [2, 3, 5]}, retro="¡Mundo 4 completado!", pistas=["Prueba combinar while, for e if."]),
    ], siguiente="¡Evacuación completada! Robot1 descubre una puerta con luces parpadeantes: el sistema de diagnóstico del complejo está lleno de errores. Allí lo espera el Mundo 5: Programador. (Próximamente.)"))
    for x in n:
        guardar(x)


if __name__ == "__main__":
    mundo2()
    mundo3()
    mundo4()
    print("Niveles de los Mundos 2, 3 y 4 generados.")
