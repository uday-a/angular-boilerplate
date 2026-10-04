import {
  ApplicationConfig,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
  inject,
  provideAppInitializer,
  provideZoneChangeDetection,
} from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import * as Sentry from '@sentry/angular'
import { routes } from './app.routes'
import { provideI18n } from './core/i18n'
import { providePosthog } from './core/analytics'
import { AuthService } from './core/auth/auth.service'
import { provideSeo } from './core/seo/seo'

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideClientHydration(withEventReplay()),
    // Forwards uncaught errors to Sentry once main.ts runs init (inert
    // pass-through when no DSN is configured — including the SSR bundle,
    // which never inits the browser SDK).
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
    provideI18n(),
    providePosthog(),
    provideSeo(),
    // Session once at app start, so public pages (header, pricing) know a
    // signed-in user on hard load — SSR included.
    provideAppInitializer(() => inject(AuthService).init()),
  ],
}
