import { Component, input } from '@angular/core';
import { DynamicComponent, Renderer } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'a2ui-hlm-button',
  imports: [HlmButtonImports, Renderer],
  template: `
    <button hlmBtn [variant]="$any(variant())" [size]="$any(size())" [disabled]="disabled()" (click)="handleClick()">
      <ng-container
        a2ui-renderer
        [surfaceId]="surfaceId()!"
        [component]="$any(component().properties['child'])"
      />
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
      }
    `,
  ],
})
export class HlmButtonWrapperComponent extends DynamicComponent<Types.CustomNode> {
  readonly variant = input<string>('default');
  readonly size = input<string>('default');
  readonly disabled = input<boolean>(false);

  handleClick(): void {
    const action = this.component().properties['action'] as unknown as Types.Action | undefined;
    if (action) super.sendAction(action);
  }
}
