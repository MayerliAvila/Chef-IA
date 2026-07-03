import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecetaInfo } from '../../models/chat.models';

/**
 * Componente que representa la tarjeta visual de una receta individual.
 * Permite alternar la visibilidad de las instrucciones de preparación,
 * marcar la receta como guardada localmente (favorita), y manejar
 * la carga o ausencia de imágenes asociadas.
 */
@Component({
  selector: 'app-receta-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './receta-card.html',
  styleUrl: './receta-card.css',
})
export class RecetaCard {
  /** Objeto de entrada conteniendo toda la información de la receta */
  @Input() receta!: RecetaInfo;

  /** Indica si la receta ha sido guardada/marcada como favorita por el usuario */
  guardado = false;
  
  /** Indica si se deben desplegar las instrucciones de preparación detalladas */
  mostrarInstrucciones = false;

  /** Estado interno que indica si la imagen de la receta está disponible y se cargó correctamente */
  imagenDisponible = true;

  /**
   * Determina si se debe mostrar la imagen del plato.
   */
  get mostrarImagen(): boolean {
    return Boolean(this.receta.imagen_url && this.imagenDisponible);
  }

  /**
   * Retorna la URL de enlace destino al hacer clic sobre la imagen.
   * Prioriza la fuente original del platillo y en su defecto la URL de la imagen.
   */
  get enlaceImagen(): string {
    return this.receta.fuente_url || this.receta.imagen_url || '#';
  }

  /**
   * Texto de accesibilidad para la imagen o enlace de la receta.
   */
  get ariaImagen(): string {
    return `Ver imagen o ideas para ${this.receta.nombre}`;
  }

  /**
   * Devuelve la clase del icono de FontAwesome correspondiente al estado de expansión.
   */
  get iconoInstrucciones(): string {
    return this.mostrarInstrucciones ? 'fa-arrow-up' : 'fa-chevron-right';
  }

  /**
   * Alterna el estado de guardado/favorito de la receta.
   */
  toggleGuardado(): void {
    this.guardado = !this.guardado;
  }

  /**
   * Alterna la visibilidad del panel de instrucciones detalladas.
   */
  toggleInstrucciones(): void {
    this.mostrarInstrucciones = !this.mostrarInstrucciones;
  }

  /**
   * Callback invocado en caso de error al cargar la imagen.
   * Marca la imagen como no disponible para evitar mostrar contenedores rotos.
   */
  ocultarImagen(): void {
    this.imagenDisponible = false;
  }
}

