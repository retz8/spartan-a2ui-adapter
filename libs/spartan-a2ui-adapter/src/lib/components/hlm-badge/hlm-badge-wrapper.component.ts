import { Component, input } from '@angular/core';
import { DynamicComponent, Renderer } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';

@Component({
  selector: 'a2ui-hlm-badge',
  imports: [HlmBadgeImports, Renderer],
  template: `
    <span hlmBadge [variant]="$any(variant())">
      <ng-container
        a2ui-renderer
        [surfaceId]="surfaceId()!"
        [component]="$any(component().properties['child'])"
      />
    </span>
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
export class HlmBadgeWrapperComponent extends DynamicComponent<Types.CustomNode> {
  readonly variant = input<string>('default');
}
