from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.recetas_routes import router as recetas_routes
from app.config.settings import settings

# Inicialización de la aplicación FastAPI con metadatos descriptivos
app = FastAPI(
    title="ChefIA Backend",
    description="Servicio API para la generación automática de recetas utilizando Gemini AI.",
    version="1.0.0"
)

# Configuración de CORS (Cross-Origin Resource Sharing) para permitir solicitudes
# desde cualquier origen (por ejemplo, el cliente Angular corriendo en localhost:4200)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de los enrutadores del módulo de recetas bajo el prefijo '/api'
app.include_router(recetas_routes, prefix="/api")


@app.get("/")
def root():
    """
    Endpoint raíz de verificación de salud (healthcheck).
    Permite confirmar que el servicio se encuentra activo y respondiendo.
    """
    return {
        "message": "ChefIA API funcionando 🚀"
    }