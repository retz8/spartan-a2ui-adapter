import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DispatchedEvent, MessageProcessor, Surface } from '@a2ui/angular';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import * as Types from '@a2ui/web_core/types/types';
import { A2aService } from './a2a.service';

@Component({
  selector: 'app-root',
  imports: [Surface, HlmButtonImports, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly processor = inject(MessageProcessor);
  private readonly a2aService = inject(A2aService);

  protected readonly prompt = signal('');
  protected readonly surface = signal<Types.Surface | null>(null);
  protected readonly surfaceId = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.processor.events.subscribe(async (event: DispatchedEvent) => {
      try {
        const messages = await this.a2aService.sendMessage(JSON.stringify(event.message));
        this.processor.processMessages(messages);
        this.updateSurface();
        event.completion.next([]);
        event.completion.complete();
      } catch (err) {
        event.completion.error(err);
      }
    });
  }

  async send() {
    const text = this.prompt().trim();
    if (!text || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const messages = await this.a2aService.sendMessage(text);
      this.prompt.set('');
      this.processor.processMessages(messages);
      this.updateSurface();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      this.loading.set(false);
    }
  }

  private updateSurface() {
    const surfaces = this.processor.getSurfaces();
    const entries = [...surfaces.entries()];
    const latest = entries[entries.length - 1];
    if (latest) {
      this.surfaceId.set(latest[0]);
      this.surface.set(latest[1]);
    }
  }
}
