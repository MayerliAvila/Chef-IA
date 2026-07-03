import { Component, inject, signal } from '@angular/core';
import { Sidebar } from './components/sidebar/sidebar';
import { Chat } from './components/chat/chat';
import { CommonModule } from '@angular/common';
import { Theme } from './services/theme';

/**
 * Componente raíz de la aplicación ChefIA.
 * Coordina la composición global de la UI (Barra lateral y Ventana de Chat)
 * y provee acceso global al ThemeService para gestionar los estilos de tema visual.
 */
@Component({
  selector: 'app-root',
  imports: [Sidebar, Chat, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  /** Nombre representativo de la aplicación */
  protected readonly title = signal('chefia-frontend');

  /** Inyección reactiva del ThemeService para alternar modo claro/oscuro */
  themeService = inject(Theme);
}
