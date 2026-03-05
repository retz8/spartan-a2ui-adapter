import { Component, OnInit, inject, signal } from '@angular/core';
import { MessageProcessor, Surface } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import fixtureData from './fixtures/button-fixture.json';

@Component({
  selector: 'app-root',
  imports: [Surface, HlmButtonImports],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly processor = inject(MessageProcessor);

  protected readonly surfaceId = 'button-showcase';
  protected readonly surface = signal<Types.Surface | null>(null);

  ngOnInit(): void {
    this.processor.processMessages(
      fixtureData as unknown as Types.ServerToClientMessage[],
    );
    this.surface.set(this.processor.getSurfaces().get(this.surfaceId) ?? null);
  }
}
