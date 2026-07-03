import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Componente que representa el cuadro de entrada de texto para el chat.
 * Maneja la captura de la pulsación de la tecla 'Enter' para enviar el mensaje,
 * limpia los espacios excedentes del texto y gestiona el estado deshabilitado.
 */
@Component({
  selector: 'app-chat-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.html',
  styleUrl: './chat-input.css',
})
export class ChatInput {
  /** Evento emitido cuando el usuario envía un mensaje válido */
  @Output() enviarMensaje = new EventEmitter<string>();

  /** Indica si la caja de texto y el botón de enviar deben estar bloqueados */
  @Input() disabled = false;

  /** Enlace bidireccional (ngModel) que almacena el texto ingresado por el usuario */
  texto: string = '';

  /**
   * Procesa y valida el texto actual. Si no está vacío y el componente
   * no está deshabilitado, emite el evento 'enviarMensaje' y limpia la entrada.
   */
  onEnviar(): void {
    const mensaje = this.texto.trim();
    if (!mensaje || this.disabled) {
      return;
    }
    this.enviarMensaje.emit(mensaje);
    this.texto = '';
  }

  /**
   * Manejador para el evento 'keydown'. Envía el mensaje al presionar 'Enter'
   * sin la tecla 'Shift' (evitando el salto de línea por defecto).
   * 
   * @param event Evento de teclado de navegador.
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onEnviar();
    }
  }
}

