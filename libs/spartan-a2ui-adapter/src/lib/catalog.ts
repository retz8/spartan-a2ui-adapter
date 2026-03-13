import { Catalog, DEFAULT_CATALOG } from '@a2ui/angular';
import { inputBinding } from '@angular/core';

export const SPARTAN_CATALOG = {
  ...DEFAULT_CATALOG,
  Button: {
    type: () =>
      import('./components/hlm-button/hlm-button-wrapper.component').then(
        (r) => r.HlmButtonWrapperComponent,
      ),
    bindings: ({ properties }) => [
      inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
      inputBinding('size', () => ('size' in properties && properties['size']) || 'default'),
      inputBinding('disabled', () => ('disabled' in properties && !!properties['disabled']) || false),
      inputBinding('href', () => ('href' in properties ? (properties['href'] as string) : undefined)),
    ],
  },
  Badge: {
    type: () =>
      import('./components/hlm-badge/hlm-badge-wrapper.component').then(
        (r) => r.HlmBadgeWrapperComponent,
      ),
    bindings: ({ properties }) => [
      inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
    ],
  },
  Card: {
    type: () =>
      import('./components/hlm-card/hlm-card-wrapper.component').then(
        (r) => r.HlmCardWrapperComponent,
      ),
    bindings: ({ properties }) => [
      inputBinding('size', () => ('size' in properties && properties['size']) || 'default'),
    ],
  },
  CheckBox: {
    type: () =>
      import('./components/hlm-checkbox/hlm-checkbox-wrapper.component').then(
        (r) => r.HlmCheckboxWrapperComponent,
      ),
    bindings: ({ properties }) => [
      inputBinding('value', () => {
        const props = properties as Record<string, unknown>;
        const v = props['value'] as { literalBoolean?: boolean } | undefined;
        return v?.literalBoolean ?? false;
      }),
      inputBinding('disabled', () => ('disabled' in properties && !!(properties as Record<string, unknown>)['disabled']) || false),
    ],
  },
} as Catalog;
