from pydantic import BaseModel, Field
from typing import List, Optional


class RecetaItem(BaseModel):
    """
    Representa una receta sugerida individual generada por la IA,
    completada con enlaces e imágenes.
    """
    nombre: str = Field(..., description="Nombre comercial o descriptivo del plato")
    descripcion: str = Field("", description="Breve descripción o presentación de la receta")
    tiempo_preparacion: int = Field(..., description="Tiempo estimado de preparación en minutos")
    dificultad: str = Field(..., description="Nivel de dificultad (ej: Fácil, Media, Difícil)")
    ingredientes: List[str] = Field(..., description="Lista de ingredientes necesarios y sus cantidades aproximadas")
    instrucciones: List[str] = Field(..., description="Lista de pasos secuenciales para realizar la preparación")
    porciones: int = Field(2, description="Número estimado de porciones que rinde la preparación")
    termino_imagen: Optional[str] = Field(None, description="Término corto de búsqueda visual para encontrar la imagen")
    imagen_url: Optional[str] = Field(None, description="URL de la imagen representativa del plato")
    fuente_url: Optional[str] = Field(None, description="URL a una búsqueda externa con recetas similares")


class RecetaResponse(BaseModel):
    """
    Representa la respuesta estructurada que el backend envía al cliente.
    Contiene un listado de sugerencias de recetas.
    """
    recetas: List[RecetaItem] = Field(..., description="Listado de recetas obtenidas para los ingredientes ingresados")

