import { Injectable, signal } from '@angular/core';

/**
 * Servicio encargado del manejo del tema visual (claro / oscuro) en la aplicación.
 * Utiliza Signals de Angular para reactividad eficiente y manipula la clase
 * en el elemento raíz del DOM.
 */
@Injectable({
  providedIn: 'root',
})
export class Theme {
  /** Signal reactiva que indica si el tema oscuro está activado */
  oscuro = signal(false);

  /**
   * Alterna el estado del tema entre claro y oscuro, actualizando la clase
   * 'dark-theme' en el documento raíz (HTML) y el valor de la Signal.
   */
  toggle(): void {
    this.oscuro.update((v) => !v);
    document.documentElement.classList.toggle('dark-theme', this.oscuro());
  }
}

