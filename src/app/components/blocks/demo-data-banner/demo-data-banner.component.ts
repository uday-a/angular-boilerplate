// The single place a page admits it's showing sample data. Replaces the
// scattered implementation notes that used to sit in page copy.
// Port of nuxt-boilerplate's `DemoDataBanner.vue`.
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Info, LucideAngularModule } from 'lucide-angular'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-demo-data-banner, [ui-demo-data-banner]',
  standalone: true,
  host: { class: 'block' },
  imports: [LucideAngularModule],
  template: `
    <div
      class="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-xs"
      role="note"
    >
      <lucide-icon [img]="Info" class="size-3.5 shrink-0" />
      <span>{{ message }}</span>
    </div>
  `,
})
export class UiDemoDataBannerComponent {
  @Input() message = 'Sample data. Connect a database to see live records.'
  protected readonly Info = Info
}
