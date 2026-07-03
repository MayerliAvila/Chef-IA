from pydantic import BaseModel, Field
from typing import List, Optional


class RecetaRequest(BaseModel):
    """
    Representa la solicitud de recetas enviada por el cliente.
    
    Permite enviar un mensaje en texto libre (lenguaje natural) que será procesado
    para extraer los ingredientes, y/o proveer una lista explícita de ingredientes ya procesados.
    """
    mensaje: str = Field(
        ..., 
        description="Mensaje en lenguaje natural escrito por el usuario (ej: 'Tengo papas y carne')"
    )
    ingredientes: Optional[List[str]] = Field(
        None, 
        description="Lista opcional de ingredientes extraídos previamente o especificados de forma estructurada"
    )