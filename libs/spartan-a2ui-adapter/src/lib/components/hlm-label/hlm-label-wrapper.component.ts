import { Component } from '@angular/core';
import { DynamicComponent, Renderer } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { HlmLabelImports } from '@spartan-ng/helm/label';

@Component({
  selector: 'a2ui-hlm-label',
  imports: [HlmLabelImports, Renderer],
  template: `
    <label hlmLabel>
      <ng-container
        a2ui-renderer
        [surfaceId]="surfaceId()!"
        [component]="$any(component().properties['child'])"
      />
    </label>
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
export class HlmLabelWrapperComponent extends DynamicComponent<Types.CustomNode> {}
