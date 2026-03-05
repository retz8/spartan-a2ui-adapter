import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideA2UI } from '@a2ui/angular';
import { SPARTAN_CATALOG } from '@spartan-a2ui-adapter';
import { appRoutes } from './app.routes';
import { minimalTheme } from './theme';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideA2UI({ catalog: SPARTAN_CATALOG, theme: minimalTheme }),
  ],
};
