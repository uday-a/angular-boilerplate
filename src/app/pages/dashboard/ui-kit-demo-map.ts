// LeafletMap demo for the /dashboard/ui-kit catalog (port of
// nuxt-boilerplate's LeafletMapDemo.vue). Its own lazy chunk; Leaflet itself
// only loads in the browser once the map scrolls into view.
import { ChangeDetectionStrategy, Component } from '@angular/core'
import {
  UiLeafletMapComponent,
  UiLeafletMarkerComponent,
  UiLeafletPopupComponent,
} from '@/app/components/ui/leaflet-map'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-demo-map',
  standalone: true,
  imports: [UiLeafletMapComponent, UiLeafletMarkerComponent, UiLeafletPopupComponent],
  template: `
    <ui-leaflet-map
      variant="muted"
      [center]="[-30, 45]"
      [zoom]="1.6"
      [minZoom]="1.4"
      [scrollWheelZoom]="false"
      [navigation]="false"
      class="h-56 w-full overflow-hidden rounded-lg border"
    >
      @for (office of offices; track office.city) {
        <ui-leaflet-marker [lngLat]="office.lngLat" anchor="center">
          <span class="bg-primary ring-primary/20 block size-3.5 rounded-full ring-4"></span>
          <ui-leaflet-popup [offset]="[0, -10]">
            <div class="text-foreground text-sm font-semibold">{{ office.city }}</div>
          </ui-leaflet-popup>
        </ui-leaflet-marker>
      }
    </ui-leaflet-map>
  `,
})
export class UiKitMapDemoComponent {
  protected readonly offices: { city: string, lngLat: [number, number] }[] = [
    { city: 'New York', lngLat: [-74.006, 40.7128] },
    { city: 'London', lngLat: [-0.1276, 51.5072] },
    { city: 'Berlin', lngLat: [13.405, 52.52] },
  ]
}
