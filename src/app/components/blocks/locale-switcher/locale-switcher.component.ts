// Header control: switch UI language. Mirrors nuxt-boilerplate's
// LocaleSwitcher.vue 1:1 (ghost sm trigger, Globe + current locale +
// chevron, w-40 dropdown with check on the active locale). Labels stay
// hardcoded English for v1; the i18n worker wires full catalogs.
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Check, ChevronDown, Globe, LucideAngularModule } from 'lucide-angular'
import { I18nService, SUPPORTED_LOCALES } from '@/app/core/i18n/i18n.service'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import {
  UiDropdownMenuComponent,
  UiDropdownMenuContentComponent,
  UiDropdownMenuItemComponent,
  UiDropdownMenuLabelComponent,
  UiDropdownMenuSeparatorComponent,
  UiDropdownMenuTriggerComponent,
} from '@/app/components/ui/dropdown-menu/dropdown-menu.component'

const LOCALE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Español',
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-locale-switcher',
  standalone: true,
  host: { class: 'contents' },
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiDropdownMenuComponent,
    UiDropdownMenuTriggerComponent,
    UiDropdownMenuContentComponent,
    UiDropdownMenuItemComponent,
    UiDropdownMenuLabelComponent,
    UiDropdownMenuSeparatorComponent,
  ],
  template: `
    <ui-dropdown-menu>
      <button
        type="button"
        ui-button
        ui-dropdown-menu-trigger
        variant="ghost"
        size="sm"
        class="text-muted-foreground hover:text-foreground h-8 max-w-40 gap-1.5 px-2.5 text-xs font-medium"
        aria-label="Language"
        title="Language"
      >
        <lucide-icon [img]="Globe" class="size-3.5 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ current() }}</span>
        <lucide-icon [img]="ChevronDown" class="size-3 shrink-0" aria-hidden="true" />
      </button>
      <ui-dropdown-menu-content align="end" class="w-40">
        <ui-dropdown-menu-label class="text-muted-foreground text-xs font-medium">Language</ui-dropdown-menu-label>
        <ui-dropdown-menu-separator />
        @for (o of options; track o.code) {
          <ui-dropdown-menu-item (select)="setLocale(o.code)">
            {{ o.label }}
            @if (o.code === locale()) {
              <lucide-icon [img]="Check" class="ml-auto size-4" aria-hidden="true" />
            }
          </ui-dropdown-menu-item>
        }
      </ui-dropdown-menu-content>
    </ui-dropdown-menu>
  `,
})
export class UiLocaleSwitcherComponent {
  private readonly i18n = inject(I18nService)

  readonly locale = toSignal(this.i18n.locale$, { initialValue: this.i18n.locale })
  readonly options = SUPPORTED_LOCALES.map((code) => ({ code, label: LOCALE_LABELS[code] ?? code.toUpperCase() }))
  readonly current = computed(() => this.options.find((o) => o.code === this.locale())?.label ?? this.locale())

  protected readonly Globe = Globe
  protected readonly ChevronDown = ChevronDown
  protected readonly Check = Check

  setLocale(code: string): void {
    this.i18n.setLocale(code)
  }
}
