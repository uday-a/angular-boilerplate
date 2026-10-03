import {
  ApplicationConfig,
  ErrorHandler,
  Injectable,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withFetch } from '@angular/common/http'
import { provideClientHydration, Title, withEventReplay } from '@angular/platform-browser'
import * as Sentry from '@sentry/angular'
import { routes } from './app.routes'
import { provideI18n } from './core/i18n'
import { providePosthog } from './core/analytics'

// Matches Nuxt's site-name title template: every setTitle("<Page>") renders "<Page> | UIPKGE".
@Injectable()
class SiteTitle extends Title {
  override setTitle(title: string) {
    super.setTitle(!title || title === 'UIPKGE' || title.endsWith(' | UIPKGE') ? title || 'UIPKGE' : `${title} | UIPKGE`)
  }
}

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
    { provide: Title, useClass: SiteTitle },
  ],
}
