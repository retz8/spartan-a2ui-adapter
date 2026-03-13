import { Component, computed, input } from '@angular/core';
import { DynamicComponent, Renderer } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'a2ui-hlm-card',
  imports: [HlmCardImports, Renderer],
  template: `
    <section hlmCard [size]="$any(size())">
      <div hlmCardContent>
        @for (child of children(); track child) {
          <ng-container
            a2ui-renderer
            [surfaceId]="surfaceId()!"
            [component]="child"
          />
        }
      </div>
    </section>
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
export class HlmCardWrapperComponent extends DynamicComponent<Types.CardNode> {
  readonly size = input<'sm' | 'default'>('default');

  readonly children = computed(() => {
    const props = this.component().properties;
    return props.children?.length ? props.children : [props.child];
  });
}
