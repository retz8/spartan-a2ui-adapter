import { Catalog, DEFAULT_CATALOG } from '@a2ui/angular';
import { inputBinding } from '@angular/core';

export const SPARTAN_CATALOG = {
  ...DEFAULT_CATALOG,
  HlmButton: {
    type: () =>
      import('./components/hlm-button/hlm-button-wrapper.component').then(
        (r) => r.HlmButtonWrapperComponent,
      ),
    bindings: ({ properties }) => [
      inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
      inputBinding('size', () => ('size' in properties && properties['size']) || 'default'),
      inputBinding('disabled', () => ('disabled' in properties && !!properties['disabled']) || false),
    ],
  },
  HlmBadge: {
    type: () =>
      import('./components/hlm-badge/hlm-badge-wrapper.component').then(
        (r) => r.HlmBadgeWrapperComponent,
      ),
    bindings: ({ properties }) => [
      inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
    ],
  },
} as Catalog;
