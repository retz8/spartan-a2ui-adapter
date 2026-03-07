import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageProcessor, Surface } from '@a2ui/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import * as Types from '@a2ui/web_core/types/types';
import { A2aService } from './a2a.service';

@Component({
  selector: 'app-root',
  imports: [Surface, HlmButtonImports, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly processor = inject(MessageProcessor);
  private readonly a2aService = inject(A2aService);

  protected readonly prompt = signal('');
  protected readonly surface = signal<Types.Surface | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  async send() {
    const text = this.prompt().trim();
    if (!text || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const messages = await this.a2aService.sendMessage(text);
      this.processor.processMessages(messages);

      const surfaces = this.processor.getSurfaces();
      const latestSurface = [...surfaces.values()].at(-1) ?? null;
      this.surface.set(latestSurface);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      this.loading.set(false);
    }
  }
}
