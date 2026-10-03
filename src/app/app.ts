import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { UiToasterComponent } from '@/app/components/ui/sonner'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiToasterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
