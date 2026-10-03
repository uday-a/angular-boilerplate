// Onboarding wizard — mirrors nuxt-boilerplate
// `app/pages/onboarding/index.vue` 1:1: 3-step local-state flow (Profile →
// Workspace → Invite), guarded by authGuard, Skip/Finish → /dashboard.
import { Component, OnInit, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { ArrowRight, Check, LucideAngularModule } from 'lucide-angular'
import { cn } from '@/app/core/utils/cn'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { UiInputComponent } from '@/app/components/ui/input'
import { UiLabelComponent } from '@/app/components/ui/label'
import {
  UiSelectComponent,
  UiSelectContentComponent,
  UiSelectItemComponent,
  UiSelectTriggerComponent,
  UiSelectValueComponent,
} from '@/app/components/ui/select'

const STEPS = ['Profile', 'Workspace', 'Invite'] as const

@Component({
  selector: 'app-onboarding',
  imports: [
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiInputComponent,
    UiLabelComponent,
    UiSelectComponent,
    UiSelectContentComponent,
    UiSelectItemComponent,
    UiSelectTriggerComponent,
    UiSelectValueComponent,
  ],
  template: `
    <div class="bg-background text-foreground min-h-screen">
      <main class="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
        <ol class="mb-6 flex items-center gap-3 text-xs">
          @for (label of steps; track label; let i = $index) {
            <li class="flex items-center gap-2">
              <span [class]="stepBadgeClass(i)">
                @if (i < step()) {
                  <lucide-icon [img]="Check" class="size-3" />
                } @else {
                  {{ i + 1 }}
                }
              </span>
              <span [class]="i === step() ? 'font-medium' : 'text-muted-foreground'">{{ label }}</span>
              @if (i < steps.length - 1) {
                <lucide-icon [img]="ArrowRight" class="text-muted-foreground size-3" />
              }
            </li>
          }
        </ol>

        <div ui-card>
          <div ui-card-header>
            <h2
              ui-card-title
              class="text-xl"
            >
              @if (step() === 0) {
                Tell us about you
              } @else if (step() === 1) {
                Create your workspace
              } @else {
                Invite your team
              }
            </h2>
            <p ui-card-description>
              @if (step() === 0) {
                Helps us tailor the dashboard to your role.
              } @else if (step() === 1) {
                Where all your work will live. You can rename it later.
              } @else {
                Optional. You can invite more people anytime from Settings → Team.
              }
            </p>
          </div>
          <div
            ui-card-content
            class="space-y-4"
          >
            @if (step() === 0) {
              <div class="grid gap-2">
                <label ui-label for="onb-name">Full name</label>
                <ui-input
                  id="onb-name"
                  [value]="fullName()"
                  (valueChange)="fullName.set($event)"
                  placeholder="Ada Lovelace"
                />
              </div>
              <div class="grid gap-2">
                <label ui-label>Your role</label>
                <ui-select
                  [value]="role()"
                  (valueChange)="role.set($event)"
                >
                  <button ui-select-trigger>
                    <ui-select-value placeholder="Select a role" />
                  </button>
                  <ui-select-content>
                    <ui-select-item value="engineer">Engineering</ui-select-item>
                    <ui-select-item value="design">Design</ui-select-item>
                    <ui-select-item value="pm">Product</ui-select-item>
                    <ui-select-item value="ops">Operations</ui-select-item>
                    <ui-select-item value="other">Other</ui-select-item>
                  </ui-select-content>
                </ui-select>
              </div>
            } @else if (step() === 1) {
              <div class="grid gap-2">
                <label ui-label for="onb-ws">Workspace name</label>
                <ui-input
                  id="onb-ws"
                  [value]="workspaceName()"
                  (valueChange)="workspaceName.set($event)"
                  placeholder="Acme Inc"
                />
              </div>
              <div class="grid gap-2">
                <label ui-label>Team size</label>
                <ui-select
                  [value]="workspaceSize()"
                  (valueChange)="workspaceSize.set($event)"
                >
                  <button ui-select-trigger>
                    <ui-select-value />
                  </button>
                  <ui-select-content>
                    <ui-select-item value="1-5">1–5</ui-select-item>
                    <ui-select-item value="6-20">6–20</ui-select-item>
                    <ui-select-item value="21-100">21–100</ui-select-item>
                    <ui-select-item value="100+">100+</ui-select-item>
                  </ui-select-content>
                </ui-select>
              </div>
            } @else {
              <div class="grid gap-2">
                <label ui-label for="onb-invites">Emails (comma-separated)</label>
                <ui-input
                  id="onb-invites"
                  [value]="invites()"
                  (valueChange)="invites.set($event)"
                  placeholder="alice@acme.com, bob@acme.com"
                />
                <p class="text-muted-foreground text-xs">We’ll send each one an invite link.</p>
              </div>
            }
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between">
          @if (step() > 0) {
            <button
              ui-button
              variant="ghost"
              (click)="back()"
            >
              Back
            </button>
          } @else {
            <button
              ui-button
              variant="ghost"
              (click)="skip()"
            >
              Skip setup
            </button>
          }
          <button
            ui-button
            (click)="next()"
          >
            {{ step() === 2 ? 'Finish' : 'Continue' }}
          </button>
        </div>
      </main>
    </div>
  `,
})
export class Onboarding implements OnInit {
  protected readonly ArrowRight = ArrowRight
  protected readonly Check = Check

  private readonly router = inject(Router)
  private readonly title = inject(Title)

  protected readonly steps = STEPS
  protected readonly step = signal<0 | 1 | 2>(0)

  protected readonly fullName = signal('')
  protected readonly role = signal('')
  protected readonly workspaceName = signal('')
  protected readonly workspaceSize = signal('1-5')
  protected readonly invites = signal('')

  ngOnInit(): void {
    this.title.setTitle('Welcome')
  }

  stepBadgeClass(i: number): string {
    return cn(
      'flex size-6 items-center justify-center rounded-full border text-xs font-medium',
      i < this.step()
        ? 'bg-primary text-primary-foreground border-primary'
        : i === this.step()
          ? 'border-foreground text-foreground'
          : 'text-muted-foreground',
    )
  }

  next(): void {
    if (this.step() < 2) this.step.set((this.step() + 1) as 0 | 1 | 2)
    else void this.router.navigateByUrl('/dashboard')
  }

  back(): void {
    if (this.step() > 0) this.step.set((this.step() - 1) as 0 | 1 | 2)
  }

  skip(): void {
    void this.router.navigateByUrl('/dashboard')
  }
}
