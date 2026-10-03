// Header "Customize" panel — a port of the uipkge.dev site customiser (via
// nuxt-boilerplate's `ThemeCustomizer.vue`, see also next-boilerplate's
// `ThemeCustomizer.tsx`): primary colour, corner radius and colour mode,
// with a reset. Icon-pack switching is Nuxt-only (generated icon-pack
// layer) — skipped here.
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import {
  Check,
  LucideAngularModule,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Sun,
} from 'lucide-angular'
import { ColorThemeService } from '@/app/core/theme/color-theme.service'
import { ThemeService, type Theme } from '@/app/core/theme/theme.service'
import { COLOR_THEMES, RADIUS_OPTIONS } from '@/app/core/theme/color-themes'
import { cn } from '@/app/core/utils/cn'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiPopoverComponent,
  UiPopoverContentComponent,
  UiPopoverTriggerComponent,
} from '@/app/components/ui/popover'

const MODES = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'dark', icon: Moon, label: 'Dark' },
  { id: 'system', icon: Monitor, label: 'System' },
] as const

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-theme-customizer, [ui-theme-customizer]',
  standalone: true,
  host: { '[attr.class]': '"contents"' },
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiPopoverComponent,
    UiPopoverContentComponent,
    UiPopoverTriggerComponent,
  ],
  template: `
    <ui-popover>
      <button
        ui-button
        ui-popover-trigger
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-foreground size-8"
        aria-label="Customize theme"
        title="Customize theme"
      >
        <lucide-icon [img]="Palette" class="size-4" />
      </button>
      <ui-popover-content align="end" class="w-[min(calc(100vw-2rem),22rem)] p-4">
        <div class="mb-4 border-b pb-3">
          <div class="flex items-baseline justify-between gap-2">
            <span class="text-sm font-semibold">Customize</span>
            <span class="text-muted-foreground text-xs">Saved automatically</span>
          </div>
          <div class="text-muted-foreground mt-0.5 truncate text-xs">
            Brand colour, corners and light/dark mode
          </div>
        </div>

        <div class="space-y-4">
          <fieldset>
            <legend class="mb-2 text-xs font-semibold">Primary colour</legend>
            <div class="grid grid-cols-3 gap-1.5">
              @for (c of themes; track c.id) {
                <button
                  type="button"
                  [attr.aria-pressed]="color.colorTheme() === c.id"
                  [class]="optionClass(color.colorTheme() === c.id) + ' flex items-center gap-2 px-2 py-1.5 text-left'"
                  [class.border-transparent]="color.colorTheme() !== c.id"
                  (click)="color.setColorTheme(c.id)"
                >
                  <span
                    class="ring-border/60 relative flex size-3.5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset"
                    [style.background]="c.swatch"
                  >
                    @if (color.colorTheme() === c.id) {
                      <lucide-icon [img]="CheckIcon" class="size-2.5 text-white" />
                    }
                  </span>
                  <span class="truncate">{{ c.label }}</span>
                </button>
              }
            </div>
          </fieldset>

          <fieldset>
            <legend class="mb-2 text-xs font-semibold">Corner radius</legend>
            <div class="grid grid-cols-5 gap-1.5">
              @for (r of radii; track r) {
                <button
                  type="button"
                  [attr.aria-pressed]="color.radius() === r"
                  [class]="optionClass(color.radius() === r) + ' px-1 py-1.5'"
                  (click)="color.setRadius(r)"
                >
                  {{ r }}
                </button>
              }
            </div>
          </fieldset>

          <fieldset>
            <legend class="mb-2 text-xs font-semibold">Colour mode</legend>
            <div class="grid grid-cols-3 gap-1.5">
              @for (m of modes; track m.id) {
                <button
                  type="button"
                  [attr.aria-pressed]="theme.theme() === m.id"
                  [class]="optionClass(theme.theme() === m.id) + ' flex items-center justify-center gap-1.5 px-2 py-1.5'"
                  (click)="theme.setTheme(m.id)"
                >
                  <lucide-icon [img]="m.icon" class="size-3.5" />
                  {{ m.label }}
                </button>
              }
            </div>
          </fieldset>

          <button ui-button variant="outline" size="sm" class="text-muted-foreground w-full gap-2 text-xs" (click)="resetAll()">
            <lucide-icon [img]="ResetIcon" class="size-3.5" />
            Reset to defaults
          </button>
        </div>
      </ui-popover-content>
    </ui-popover>
  `,
})
export class UiThemeCustomizerComponent {
  protected readonly color = inject(ColorThemeService)
  protected readonly theme = inject(ThemeService)

  protected readonly themes = COLOR_THEMES
  protected readonly radii = RADIUS_OPTIONS
  protected readonly modes = MODES

  protected readonly Palette = Palette
  protected readonly CheckIcon = Check
  protected readonly ResetIcon = RotateCcw

  optionClass(on: boolean): string {
    return cn(
      'hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 rounded-md border text-xs font-medium transition-colors outline-none focus-visible:ring-[3px]',
      on ? 'border-primary bg-secondary text-secondary-foreground' : 'border-border',
    )
  }

  resetAll(): void {
    this.color.reset()
    this.theme.setTheme('system' as Theme)
  }
}
