import { Component, input } from '@angular/core';
import { DynamicComponent } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';

@Component({
  selector: 'a2ui-hlm-separator',
  imports: [HlmSeparatorImports],
  template: `
    <hlm-separator
      [orientation]="orientation()"
      [decorative]="decorative()"
    />
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
export class HlmSeparatorWrapperComponent extends DynamicComponent<Types.CustomNode> {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly decorative = input<boolean>(true);
}
