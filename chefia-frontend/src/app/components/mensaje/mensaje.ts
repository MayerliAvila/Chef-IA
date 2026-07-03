import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

import { RecetaCard } from '../receta-card/receta-card';
import { MensajeChat } from '../../models/chat.models';

/**
 * Componente contenedor de un mensaje individual en la conversación.
 * Se encarga de alternar estilos visuales según el emisor ('bot' o 'usuario')
 * y de renderizar la lista de tarjetas de recetas asociadas si están presentes.
 */
@Component({
  selector: 'app-mensaje',
  standalone: true,
  imports: [
    CommonModule,
    RecetaCard
  ],
  templateUrl: './mensaje.html',
  styleUrl: './mensaje.css',
})
export class Mensaje {

  /** Información y estado detallado del mensaje de chat actual */
  @Input({ required: true })
  mensaje!: MensajeChat;

}