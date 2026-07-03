import {
  Component,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Mensaje } from '../mensaje/mensaje';
import { ChatInput } from '../chat-input/chat-input';
import { RecetaService } from '../../services/receta';
import { MensajeChat, RecetaInfo } from '../../models/chat.models';

/**
 * Componente principal del Chat de ChefIA.
 * Coordina la visualización de la conversación, la entrada de texto por parte del usuario,
 * el llamado al servicio de generación de recetas, la normalización de la respuesta
 * y el scroll automático al recibir nuevos mensajes.
 */
@Component({
  selector: 'app-chat',
  imports: [CommonModule, Mensaje, ChatInput],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements AfterViewChecked {
  /** Elemento contenedor del historial de mensajes para controlar el scroll */
  @ViewChild('mensajesContainer') mensajesContainer!: ElementRef;

  private recetaService = inject(RecetaService);

  /** Signal que maneja el estado de carga (mientras se espera respuesta de la API) */
  cargando = signal(false);

  /**
   * Signal reactiva que contiene el historial de mensajes de la sesión de chat.
   * Angular detecta cambios de referencia en la Signal para actualizar el DOM eficientemente.
   */
  historial = signal<MensajeChat[]>([
    {
      tipo: 'bot',
      texto: '¡Hola! Soy Chef-IA\nCuéntame qué ingredientes tienes y te daré recetas deliciosas.',
    },
  ]);

  /** Bandera interna para determinar si se debe realizar un scroll al final del chat en el siguiente ciclo */
  private shouldScroll = false;

  /**
   * Hook de ciclo de vida ejecutado después de verificar la vista.
   * Realiza scroll al final de la pantalla si hay mensajes nuevos.
   */
  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollAlFinal();
      this.shouldScroll = false;
    }
  }

  /**
   * Mueve el scroll del contenedor de mensajes al final de su altura disponible.
   */
  private scrollAlFinal(): void {
    if (this.mensajesContainer) {
      const el = this.mensajesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  /**
   * Obtiene la hora actual formateada en formato de 24 horas (HH:MM).
   * 
   * @returns Hora formateada.
   */
  private obtenerHora(): string {
    const ahora = new Date();
    return ahora.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Normaliza la respuesta recibida del servidor de recetas para asegurar que
   * cumpla estrictamente con la interfaz RecetaInfo.
   * 
   * @param respuesta Respuesta sin tipar o cruda de la API.
   * @returns Array de recetas normalizadas.
   */
  private normalizarRecetas(respuesta: unknown): RecetaInfo[] {
    const recetas = Array.isArray(respuesta)
      ? respuesta
      : (respuesta as { recetas?: unknown[] })?.recetas ?? [];

    return recetas.map((receta, i) => {
      const r = receta as Partial<RecetaInfo>;

      return {
        nombre: r.nombre ?? 'Receta sin nombre',
        descripcion: r.descripcion ?? '',
        tiempo_preparacion: Number(r.tiempo_preparacion ?? 30),
        dificultad: r.dificultad ?? 'Fácil',
        ingredientes: Array.isArray(r.ingredientes) ? r.ingredientes : [],
        instrucciones: Array.isArray(r.instrucciones) ? r.instrucciones : [],
        porciones: Number(r.porciones ?? 2),
        termino_imagen: r.termino_imagen,
        imagen_url: r.imagen_url,
        fuente_url: r.fuente_url,
        popular: i === 0, // La primera receta es marcada como popular/destacada
      };
    });
  }

  /**
   * Manejador invocado cuando el usuario envía un nuevo mensaje.
   * Añade el mensaje del usuario, muestra el spinner de carga,
   * y llama al recetaService para pedir recetas.
   * 
   * @param texto Texto del mensaje enviado por el usuario.
   */
  onNuevoMensaje(texto: string): void {
    if (this.cargando()) return;

    // Agregar el mensaje del usuario y un mensaje temporal de carga del bot
    this.historial.update((h) => [
      ...h,
      { tipo: 'usuario', texto, hora: this.obtenerHora(), leido: false },
      { tipo: 'bot', cargando: true },
    ]);

    this.cargando.set(true);
    this.shouldScroll = true;

    // Suscripción al endpoint de generación de recetas
    this.recetaService.generarReceta(texto).subscribe({
      next: (respuesta) => {
        const recetas = this.normalizarRecetas(respuesta);

        this.historial.update((h) => {
          // Remover el mensaje de carga temporal
          const sinCargando = h.filter((m) => !m.cargando);
          
          // Marcar el último mensaje del usuario como leído
          const ultimoIdx = [...sinCargando]
            .map((m) => m.tipo)
            .lastIndexOf('usuario');

          if (ultimoIdx !== -1) {
            sinCargando[ultimoIdx] = { ...sinCargando[ultimoIdx], leido: true };
          }

          // Retornar historial con la respuesta oficial del bot y las recetas
          return [
            ...sinCargando,
            {
              tipo: 'bot',
              texto:
                respuesta.mensaje ??
                '¡Genial! Con esos ingredientes, aquí tienes algunas opciones:',
              recetas: recetas.length > 0 ? recetas : undefined,
            },
          ];
        });

        this.cargando.set(false);
        this.shouldScroll = true;
      },
      error: (err) => {
        console.error('Error al obtener recetas:', err);

        let mensajeError =
          err?.error?.detail ??
          'Lo siento, tuve un problema al buscar las recetas. Verifica tu conexión e intenta de nuevo.';

        // Red de seguridad: si el detail viene corrupto o demasiado largo (ej. un dump crudo), usa el genérico
        if (typeof mensajeError !== 'string' || mensajeError.length > 200) {
          mensajeError = 'Lo siento, tuve un problema al buscar las recetas. Intenta de nuevo.';
        }

        this.historial.update((h) => [
          ...h.filter((m) => !m.cargando),
          { tipo: 'bot', texto: mensajeError },
        ]);

        this.cargando.set(false);
        this.shouldScroll = true;
      },
    });
  }
}