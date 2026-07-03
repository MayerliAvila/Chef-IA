/**
 * Representa la estructura de datos detallada de una receta.
 */
export interface RecetaInfo {
  /** Nombre descriptivo de la receta */
  nombre: string;
  /** Resumen o explicación introductoria de la receta */
  descripcion: string;
  /** Tiempo requerido para preparar el plato (en minutos) */
  tiempo_preparacion: number;
  /** Nivel de dificultad (Fácil, Media, Difícil) */
  dificultad: string;
  /** Listado de ingredientes y cantidades */
  ingredientes: string[];
  /** Listado secuencial de pasos para cocinar */
  instrucciones: string[];
  /** Cantidad de porciones estimadas */
  porciones: number;
  /** Término de búsqueda recomendado para encontrar imágenes relacionadas */
  termino_imagen?: string;
  /** URL de la imagen del plato */
  imagen_url?: string;
  /** URL a una búsqueda externa o fuente adicional de información */
  fuente_url?: string;
  /** Indicador de receta destacada o popular en la interfaz */
  popular?: boolean;
}

/**
 * Rol del emisor de un mensaje dentro del chat de recetas.
 */
export type TipoMensaje = 'bot' | 'usuario';

/**
 * Representa un mensaje individual dentro del historial del chat.
 */
export interface MensajeChat {
  /** Indica si el mensaje proviene del asistente ('bot') o del usuario */
  tipo: TipoMensaje;
  /** Contenido de texto del mensaje */
  texto?: string;
  /** Hora de envío formateada (HH:MM) */
  hora?: string;
  /** Indica si el mensaje ya fue leído en la sesión actual */
  leido?: boolean;
  /** Opcionalmente, recetas generadas asociadas a este mensaje (devueltas por el bot) */
  recetas?: RecetaInfo[];
  /** Indica si este mensaje representa un estado de carga (ej: spinner del bot esperando API) */
  cargando?: boolean;
}

