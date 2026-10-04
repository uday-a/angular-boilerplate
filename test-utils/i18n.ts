// Real en catalog for page specs, so copy assertions track the shipped
// strings. Add provideTestI18n() to providers, call seedI18n() before the
// first detectChanges().
import { TestBed } from '@angular/core/testing'
import { TranslateService, provideTranslateService } from '@ngx-translate/core'
import en from '../src/assets/i18n/en.json'

export const provideTestI18n = () => provideTranslateService({ fallbackLang: 'en' })

export function seedI18n(): void {
  const translate = TestBed.inject(TranslateService)
  translate.setTranslation('en', en)
  translate.use('en')
}
