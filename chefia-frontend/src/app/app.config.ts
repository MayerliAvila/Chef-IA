import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

/**
 * Configuración global de proveedores para la inicialización de la aplicación Angular.
 * Configura los manejadores de errores en el navegador, el enrutador y el cliente HTTP.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Registra escuchadores globales para capturar excepciones del navegador
    provideBrowserGlobalErrorListeners(),
    // Registra la configuración de rutas de la aplicación
    provideRouter(routes),
    // Proveedor del cliente HTTP global de Angular para consumo de servicios API
    provideHttpClient()
  ]
};

