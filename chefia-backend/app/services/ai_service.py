import json
import re
import time
from google import genai
from app.config.settings import settings
from app.prompts.receta_prompt import RECETA_PROMPT

# Inicialización del cliente de Gemini utilizando la API Key configurada
client = genai.Client(api_key=settings.gemini_api_key)


class IAServiceUnavailableError(Exception):
    """
    Excepción personalizada para indicar que el servicio de IA de Gemini
    no está disponible temporalmente o que se ha agotado la cuota de uso.
    """
    pass


def _limpiar_y_parsear_json(texto: str):
    """
    Limpia el texto devuelto por la IA, removiendo posibles bloques de código Markdown,
    y lo parsea de forma segura a un objeto de Python (diccionario o lista).

    Soporta:
    - JSON envuelto en bloques de código Markdown (```json ... ```)
    - JSON doblemente codificado (cadenas que contienen cadenas JSON)
    - Estructuras en forma de lista o diccionarios con clave "recetas"

    Args:
        texto (str): Texto crudo obtenido de la respuesta de la IA.

    Returns:
        list: Lista de recetas parseadas y estructuradas.

    Raises:
        ValueError: Si el formato del JSON resultante no coincide con una lista o receta.
    """
    texto = texto.strip()

    # Quita bloques de markdown tipo ```json ... ``` o ``` ... ```
    texto = re.sub(r"^```(?:json)?\s*", "", texto)
    texto = re.sub(r"\s*```$", "", texto)
    texto = texto.strip()

    data = json.loads(texto)

    # Si el resultado es un string (JSON "doblemente codificado"), parsea otra vez
    if isinstance(data, str):
        data = json.loads(data)

    # Aceptar tanto lista directa como objeto con clave "recetas"
    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        # Si viene envuelto en {"recetas": [...]}
        if "recetas" in data and isinstance(data["recetas"], list):
            return data["recetas"]
        # Si viene como una sola receta, la envolvemos en lista
        return [data]

    raise ValueError(f"Se esperaba un array de recetas, se recibió: {type(data)}")


def extraer_ingredientes_de_mensaje(mensaje: str) -> list[str]:
    """
    Extrae de forma inteligente ingredientes individuales a partir de un mensaje de texto libre
    provisto por el usuario en lenguaje natural.

    Ejemplos de entrada:
      - 'tengo pollo, arroz y tomates, ¿qué puedo hacer?' -> ['pollo', 'arroz', 'tomates']
      - 'pollo; cebolla; ajo' -> ['pollo', 'cebolla', 'ajo']

    El procesamiento incluye:
      1. Normalización a minúsculas y eliminación de signos de puntuación no deseados.
      2. Reemplazo de conjunciones ('y', 'e') y signos de puntuación por comas como delimitadores.
      3. Separación por comas y eliminación de espacios en blanco excedentes.
      4. Filtrado de palabras de ruido y verbos comunes al inicio de cada fragmento.

    Args:
        mensaje (str): El mensaje original escrito por el usuario.

    Returns:
        list[str]: Lista de ingredientes detectados y limpios.
    """
    # Normalizar el texto a minúsculas para comparar patrones
    texto = mensaje.lower()

    # Quitar signos de puntuación que no sean separadores
    texto = re.sub(r"[¿?¡!\"'().]", " ", texto)

    # Reemplazar separadores alternativos por coma
    texto = re.sub(r"\s+[ye]\s+", ",", texto)
    texto = re.sub(r";", ",", texto)

    # Dividir por comas y limpiar
    partes = [p.strip() for p in texto.split(",") if p.strip()]

    # Filtrar frases que claramente no son ingredientes
    palabras_ruido = {
        "tengo", "quiero", "necesito", "qué", "que", "puedo", "hacer",
        "receta", "recetas", "con", "de", "del", "la", "el", "los", "las",
        "un", "una", "me", "puedes", "dar", "ayudar", "sugerir", "preparo",
        "ingredientes", "son", "hay", "algo", "quisiera", "como", "cómo",
        "muchas", "pocas", "algunas", "unas", "unos",
    }

    ingredientes = []
    for parte in partes:
        palabras = parte.split()
        # Quitar palabras de ruido al inicio
        while palabras and palabras[0] in palabras_ruido:
            palabras = palabras[1:]
        parte_limpia = " ".join(palabras).strip()
        if parte_limpia and len(parte_limpia) > 1:
            ingredientes.append(parte_limpia)

    return ingredientes


def generar_receta_con_ia(ingredientes: list[str]) -> list:
    """
    Consulta a la API de Gemini para generar un listado de exactamente tres recetas
    en base a los ingredientes especificados.

    Aplica políticas de reintento ante errores temporales de red/servidor (hasta 3 intentos)
    y gestiona errores de cuota diarios de manera amigable para el usuario.

    Args:
        ingredientes (list[str]): Lista de ingredientes a emplear en las recetas.

    Returns:
        list: Lista de recetas en formato estructurado (diccionarios).

    Raises:
        IAServiceUnavailableError: Si hay problemas de conexión persistentes,
                                   alta demanda en la API o cuota diaria agotada.
        ValueError: Si la respuesta de la IA no es un JSON válido o estructurado correctamente.
    """
    ingredientes_str = ", ".join(ingredientes)

    prompt = RECETA_PROMPT.format(
        ingredientes=ingredientes_str
    )

    response = None
    ultimo_error = None

    for intento in range(3):
        try:
            response = client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt
            )
            break
        except Exception as e:
            ultimo_error = e
            error_texto = str(e)
            print(f"=== ERROR GEMINI (intento {intento}): {error_texto} ===")

            # Clasificación del error de Gemini
            es_cuota_diaria = "RESOURCE_EXHAUSTED" in error_texto and "PerDay" in error_texto
            es_temporal = (
                not es_cuota_diaria and (
                    "503" in error_texto
                    or "UNAVAILABLE" in error_texto
                    or "high demand" in error_texto.lower()
                )
            )

            if es_cuota_diaria:
                raise IAServiceUnavailableError(
                    "Se agotó la cuota diaria gratuita de la IA. Intenta de nuevo mañana o contacta al administrador."
                ) from e

            if not es_temporal or intento == 2:
                raise IAServiceUnavailableError(
                    "La IA está con alta demanda en este momento. Intenta de nuevo en unos segundos."
                ) from e

            # Espera exponencial para reintentar
            time.sleep(1 + intento)

    if response is None:
        raise IAServiceUnavailableError(
            "No se pudo obtener respuesta de la IA. Intenta de nuevo en unos segundos."
        ) from ultimo_error

    texto = response.text

    print("=== RESPUESTA CRUDA DE GEMINI ===")
    print(repr(texto))
    print("==================================")

    try:
        return _limpiar_y_parsear_json(texto)
    except json.JSONDecodeError as e:
        raise ValueError(f"La IA no devolvió un JSON válido: {texto}") from e

