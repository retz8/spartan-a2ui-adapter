import { Component, computed, input } from '@angular/core';
import { DynamicComponent } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';

@Component({
  selector: 'a2ui-hlm-checkbox',
  imports: [HlmCheckboxImports],
  template: `
    <div class="flex items-center space-x-2">
      <hlm-checkbox [checked]="value()" [disabled]="disabled()" (checkedChange)="handleCheckedChange($event)" />
      <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {{ labelText() }}
      </label>
    </div>
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
export class HlmCheckboxWrapperComponent extends DynamicComponent<Types.CustomNode> {
  /** Extracted boolean from the schema's `value: { literalBoolean, path }` property. */
  readonly value = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  protected readonly labelText = computed(() => {
    const props = this.component().properties;
    const label = props['label'] as { literalString?: string } | undefined;
    return label?.literalString ?? '';
  });

  handleCheckedChange(checked: boolean): void {
    const value = this.component().properties['value'] as { path?: string } | undefined;
    if (value?.path) {
      this.processor.setData(this.component(), value.path, checked, this.surfaceId());
    }
  }
}
