import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RecetaInfo } from '../models/chat.models';
import { environment } from '../../environments/environments';

/**
 * Estructura de la respuesta devuelta por el servidor al consultar recetas.
 */
export interface RecetaResponse {
  /** Listado de recetas generadas y normalizadas */
  recetas: RecetaInfo[];
  /** Mensaje opcional o contextual devuelto por la IA */
  mensaje?: string;
}

/**
 * Servicio encargado de comunicarse con el backend de ChefIA para solicitar
 * la generación de recetas en base a ingredientes ingresados en texto libre.
 */
@Injectable({
  providedIn: 'root',
})
export class RecetaService {
  private http = inject(HttpClient);

  /** URL base de la API del backend */
  private apiUrl = environment.apiUrl;

  /**
   * Envía un mensaje de texto libre al backend para extraer ingredientes
   * y generar las recetas correspondientes.
   * 
   * @param mensaje Mensaje en lenguaje natural escrito por el usuario.
   * @returns Observable con la respuesta estructurada de recetas.
   */
  generarReceta(mensaje: string): Observable<RecetaResponse> {
    // Enviamos el mensaje completo al backend.
    // El backend se encarga de extraer los ingredientes del texto libre.
    return this.http.post<RecetaResponse>(`${this.apiUrl}/api/recetas`, {
      mensaje: mensaje.trim(),
    });
  }
}


