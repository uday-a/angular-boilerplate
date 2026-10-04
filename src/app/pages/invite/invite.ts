// Workspace invite — verify + accept a team invite token. Ports
// nuxt-boilerplate `app/pages/invite/[token].vue`: GET
// /api/team/invites/:param verifies (public); POST accepts (session email
// must match). A 401 shows a sign-in prompt instead of "invalid link"; a
// signed-in user whose email differs is told to switch accounts.
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { Title } from '@angular/platform-browser'
import { CircleAlert, LoaderCircle, LucideAngularModule, Mail, Users } from 'lucide-angular'
import { AuthService } from '@/app/core/auth/auth.service'
import { UiButtonComponent } from '@/app/components/ui/button'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card'
import { type ApiResponse, apiErrorMessage } from '@/app/core/api/api'

interface InvitePreview {
  email: string
  role: string
  valid: boolean
}

@Component({
  selector: 'app-invite',
  imports: [
    RouterLink,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
  ],
  template: `
    <div class="bg-background text-foreground min-h-screen">
      <main class="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-4">
        @if (verifying()) {
          <div class="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
            Verifying invite…
          </div>
        } @else if (invite() && !verifyFailed()) {
          <div ui-card>
            <div ui-card-header class="items-center text-center">
              <h1 ui-card-title class="pt-3 text-2xl">Join the workspace</h1>
              <p ui-card-description>Join the workspace as {{ invite()!.role }}.</p>
            </div>
            <div ui-card-content class="space-y-3">
              <div class="text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <lucide-icon [img]="MailIcon" class="size-4" />
                <span>Invited email: <span class="text-foreground">{{ invite()!.email }}</span></span>
              </div>
              <div class="text-muted-foreground flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <lucide-icon [img]="UsersIcon" class="size-4" />
                <span>Role: <span class="text-foreground">{{ invite()!.role }}</span></span>
              </div>
              @if (emailMismatch()) {
                <div class="text-muted-foreground text-center text-xs">
                  Sign in as {{ invite()!.email }} to accept this invite.
                </div>
              }
              @if (acceptError()) {
                <div class="text-destructive flex items-center gap-2 text-sm">
                  <lucide-icon [img]="AlertIcon" class="size-4" />
                  {{ acceptError() }}
                </div>
              }
              <div class="flex flex-col gap-2 pt-2">
                <button ui-button class="w-full" [disabled]="accepting()" (click)="accept()">
                  @if (accepting()) {
                    <lucide-icon [img]="LoaderIcon" class="size-4 animate-spin" />
                    Accepting…
                  } @else {
                    {{ ctaLabel() }}
                  }
                </button>
                <button ui-button variant="ghost" class="w-full" (click)="decline()">Decline</button>
              </div>
            </div>
          </div>
        } @else if (needsSignin()) {
          <div ui-card>
            <div ui-card-header class="items-center text-center">
              <h1 ui-card-title class="pt-3 text-2xl">Sign in to accept this invite</h1>
              <p ui-card-description>Sign in to view this invite and join the workspace.</p>
            </div>
            <div ui-card-content class="flex flex-col gap-2">
              <a ui-button class="w-full" [routerLink]="'/login'" [queryParams]="{ next: '/invite/' + token() }">
                Sign in
              </a>
              <button ui-button variant="ghost" class="w-full" (click)="decline()">Back to home</button>
            </div>
          </div>
        } @else {
          <div ui-card>
            <div ui-card-header class="items-center text-center">
              <h1 ui-card-title class="pt-3 text-2xl">Invite unavailable</h1>
              <p ui-card-description>
                This invite link is invalid, expired, or already used. Ask your admin for a new one.
              </p>
            </div>
            <div ui-card-content>
              <button ui-button variant="outline" class="w-full" (click)="decline()">Back to home</button>
            </div>
          </div>
        }
      </main>
    </div>
  `,
})
export class Invite {
  private readonly http = inject(HttpClient)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly title = inject(Title)
  private readonly auth = inject(AuthService)
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID))

  protected readonly MailIcon = Mail
  protected readonly UsersIcon = Users
  protected readonly LoaderIcon = LoaderCircle
  protected readonly AlertIcon = CircleAlert

  protected readonly token = signal(String(this.route.snapshot.paramMap.get('token') ?? ''))
  protected readonly invite = signal<InvitePreview | null>(null)
  protected readonly verifying = signal(true)
  protected readonly verifyFailed = signal(false)
  protected readonly needsSignin = signal(false)

  protected readonly accepting = signal(false)
  protected readonly acceptError = signal<string | null>(null)

  private readonly sessionUser = toSignal(this.auth.user$, { initialValue: null })

  protected readonly emailMismatch = computed(() => {
    const inv = this.invite()
    const user = this.sessionUser()
    return Boolean(inv && user && (user.email ?? '').toLowerCase() !== inv.email.toLowerCase())
  })

  protected readonly ctaLabel = computed(() => {
    const user = this.sessionUser()
    return user && !this.emailMismatch() ? 'Accept invite' : 'Sign in'
  })

  constructor() {
    this.title.setTitle('Join the workspace')
    if (!this.browser) {
      this.verifying.set(false)
      this.verifyFailed.set(true)
      return
    }
    this.auth.fetch().subscribe()
    this.http.get<ApiResponse<InvitePreview>>(`/api/team/invites/${this.token()}`, { withCredentials: true }).subscribe({
      next: (res) => {
        this.verifying.set(false)
        if (res.ok) this.invite.set(res.data)
        else if (res.error.code === 'UNAUTHORIZED') this.needsSignin.set(true)
        else this.verifyFailed.set(true)
      },
      error: (err: unknown) => {
        this.verifying.set(false)
        const status = (err as { status?: number }).status
        const code = (err as { error?: { error?: { code?: string } } }).error?.error?.code
        if (status === 401 || code === 'UNAUTHORIZED') this.needsSignin.set(true)
        else {
          this.verifyFailed.set(true)
          void apiErrorMessage(err, 'Failed to verify invite')
        }
      },
    })
  }

  accept(): void {
    if (!this.browser || this.accepting()) return
    if (!this.auth.loggedIn) {
      void this.router.navigate(['/login'], { queryParams: { next: `/invite/${this.token()}` } })
      return
    }
    this.accepting.set(true)
    this.acceptError.set(null)
    this.http
      .post<ApiResponse<{ accepted: boolean }>>(`/api/team/invites/${this.token()}`, {}, { withCredentials: true })
      .subscribe({
        next: (res) => {
          if (!res.ok) {
            this.acceptError.set(res.error.message)
            this.accepting.set(false)
            return
          }
          void this.router.navigateByUrl('/dashboard')
        },
        error: (err: unknown) => {
          this.acceptError.set(apiErrorMessage(err, 'Failed to accept invite'))
          this.accepting.set(false)
        },
      })
  }

  decline(): void {
    void this.router.navigateByUrl('/')
  }
}
