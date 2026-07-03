from urllib.parse import quote_plus

from fastapi import APIRouter, HTTPException

from app.models.request import RecetaRequest
from app.models.response import RecetaResponse, RecetaItem
from app.services.ai_service import (
    IAServiceUnavailableError,
    generar_receta_con_ia,
    extraer_ingredientes_de_mensaje,
)

router = APIRouter()


def _crear_urls_receta(nombre: str, termino_imagen: str | None) -> tuple[str, str]:
    """
    Genera URLs dinámicas para la receta: una imagen referencial usando Unsplash
    y un enlace de búsqueda en Google para consultar preparaciones similares.

    Args:
        nombre (str): Nombre de la receta.
        termino_imagen (str | None): Término de búsqueda específico para la imagen de Unsplash.

    Returns:
        tuple[str, str]: Una tupla conteniendo (imagen_url, fuente_url).
    """
    termino = termino_imagen or nombre
    consulta_imagen = quote_plus(f"{termino} comida plato")
    consulta_fuente = quote_plus(f"receta {nombre}")

    imagen_url = f"https://source.unsplash.com/640x420/?{consulta_imagen}"
    fuente_url = f"https://www.google.com/search?q={consulta_fuente}"

    return imagen_url, fuente_url


def _entero_seguro(valor, fallback: int) -> int:
    """
    Intenta convertir un valor de tipo desconocido a un entero de manera segura.
    Soporta enteros, flotantes y cadenas numéricas (extrayendo solo los dígitos).

    Args:
        valor: El valor original a convertir.
        fallback (int): El valor por defecto a retornar en caso de fallo.

    Returns:
        int: El valor convertido a entero, o el fallback en su defecto.
    """
    if isinstance(valor, int):
        return valor

    if isinstance(valor, float):
        return int(valor)

    if isinstance(valor, str):
        digitos = "".join(caracter for caracter in valor if caracter.isdigit())
        if digitos:
            return int(digitos)

    return fallback


def _lista_segura(valor) -> list[str]:
    """
    Convierte un valor de tipo desconocido en una lista de cadenas limpias.
    Si el valor es una lista, filtra elementos vacíos y convierte todo a string.
    Si es un string no vacío, lo envuelve en una lista de un elemento.

    Args:
        valor: El valor original (lista, string o None).

    Returns:
        list[str]: Una lista limpia de cadenas de texto.
    """
    if isinstance(valor, list):
        return [str(item) for item in valor if str(item).strip()]

    if isinstance(valor, str) and valor.strip():
        return [valor.strip()]

    return []


@router.post("/recetas", response_model=RecetaResponse)
def generar_receta(data: RecetaRequest):
    """
    Endpoint principal para generar recetas basadas en ingredientes.
    Si el cliente provee una lista explícita de ingredientes, se usa directamente.
    De lo contrario, extrae los ingredientes a partir del mensaje de texto libre
    utilizando procesamiento de lenguaje natural básico. Luego, consulta al
    servicio de inteligencia artificial (Gemini) para generar exactamente
    tres sugerencias de recetas personalizadas.

    Args:
        data (RecetaRequest): Petición que contiene el mensaje de texto libre
                             y/o la lista opcional de ingredientes.

    Returns:
        RecetaResponse: Respuesta con el listado de recetas estructurado y enriquecido.

    Raises:
        HTTPException 400: Si no se detectan ingredientes en la solicitud.
        HTTPException 502: Si la respuesta de la IA no es válida o no se pudieron generar recetas.
        HTTPException 503: Si el servicio de IA no está disponible temporalmente o por cuota excedida.
        HTTPException 500: Ante cualquier otro error inesperado.
    """
    try:
        # Si ya vienen ingredientes explícitos, los usamos directamente.
        # De lo contrario, los extraemos del mensaje de texto libre.
        if data.ingredientes and len(data.ingredientes) > 0:
            ingredientes = data.ingredientes
        else:
            ingredientes = extraer_ingredientes_de_mensaje(data.mensaje)

        print(f"=== INGREDIENTES DETECTADOS: {ingredientes} ===")

        if not ingredientes:
            raise HTTPException(
                status_code=400,
                detail="No se encontraron ingredientes en el mensaje. Por favor menciona qué ingredientes tienes.",
            )

        lista_recetas = generar_receta_con_ia(ingredientes)
        recetas = []

        for receta_raw in lista_recetas:
            if not isinstance(receta_raw, dict):
                continue

            nombre = receta_raw.get("nombre", "Receta sin nombre")
            if not isinstance(nombre, str) or not nombre.strip():
                nombre = "Receta sin nombre"

            termino_imagen = receta_raw.get("termino_imagen") or nombre
            if not isinstance(termino_imagen, str):
                termino_imagen = nombre

            imagen_url, fuente_url = _crear_urls_receta(nombre, termino_imagen)

            recetas.append(
                RecetaItem(
                    nombre=nombre,
                    descripcion=str(receta_raw.get("descripcion", "")),
                    tiempo_preparacion=_entero_seguro(
                        receta_raw.get("tiempo_preparacion"), 30
                    ),
                    dificultad=str(receta_raw.get("dificultad", "Fácil")),
                    ingredientes=_lista_segura(receta_raw.get("ingredientes")),
                    instrucciones=_lista_segura(receta_raw.get("instrucciones")),
                    porciones=_entero_seguro(receta_raw.get("porciones"), 2),
                    termino_imagen=termino_imagen,
                    imagen_url=receta_raw.get("imagen_url") or imagen_url,
                    fuente_url=receta_raw.get("fuente_url") or fuente_url,
                )
            )

        if not recetas:
            raise HTTPException(
                status_code=502,
                detail="La IA respondió, pero no devolvió recetas válidas. Intenta de nuevo.",
            )

        return RecetaResponse(recetas=recetas)

    except HTTPException:
        raise
    except IAServiceUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error inesperado al generar las recetas.",
        )

