// Validated form — reference pattern. Ports nuxt-boilerplate's
// app/pages/dashboard/form-example.vue.
//
// DIVERGENCE (documented per task): nuxt uses @tanstack/vue-form with zod 4
// Standard-Schema validators. `@tanstack/angular-form` does not exist in this
// repo's node_modules, so this page uses Angular Reactive Forms + manual zod
// validation instead: each control carries a small validator that runs its
// zod field schema and surfaces `{ message }`, which the registry's
// <ui-form-message> renders. Same schema, same messages, same UX — different
// form driver. If @tanstack/angular-form is adopted later, swap the driver
// and keep the schema + template shape.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core'
import { FormControl, FormGroup, ReactiveFormsModule, type AbstractControl, type ValidationErrors } from '@angular/forms'
import { z } from 'zod'
import {
  UiCardComponent,
  UiCardContentComponent,
  UiCardDescriptionComponent,
  UiCardHeaderComponent,
  UiCardTitleComponent,
} from '@/app/components/ui/card/card.component'
import { UiInputComponent } from '@/app/components/ui/input/input.component'
import { UiButtonComponent } from '@/app/components/ui/button/button.component'
import { UiTextareaComponent } from '@/app/components/ui/textarea/textarea.component'
import {
  UiFormControlDirective,
  UiFormDescriptionComponent,
  UiFormFieldDirective,
  UiFormItemComponent,
  UiFormLabelComponent,
  UiFormMessageComponent,
  UiFormDirective,
} from '@/app/components/ui/form/form.component'
import {
  UiPageBodyComponent,
  UiPageComponent,
  UiPageHeaderComponent,
  UiPageHeaderHeadingComponent,
} from '@/app/components/ui/page'
import { injectPageTitle } from '@/app/core/i18n'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Enter a valid email'),
  bio: z.string().max(280, 'Bio must be 280 characters or fewer'),
})

type Profile = z.infer<typeof profileSchema>

function zodField(schema: z.ZodType<string>): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl) => {
    const result = schema.safeParse(control.value ?? '')
    if (result.success) return null
    return { message: result.error.issues[0]?.message ?? 'Invalid value' }
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-form-example',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    UiButtonComponent,
    UiCardComponent,
    UiCardContentComponent,
    UiCardDescriptionComponent,
    UiCardHeaderComponent,
    UiCardTitleComponent,
    UiFormControlDirective,
    UiFormDescriptionComponent,
    UiFormDirective,
    UiFormFieldDirective,
    UiFormItemComponent,
    UiFormLabelComponent,
    UiFormMessageComponent,
    UiInputComponent,
    UiPageBodyComponent,
    UiPageComponent,
    UiPageHeaderComponent,
    UiPageHeaderHeadingComponent,
    UiTextareaComponent,
  ],
  template: `
    <ui-page>
      <ui-page-header>
        <ui-page-header-heading
          [title]="pageTitle()"
          description="A profile form that checks every field before it saves."
        />
      </ui-page-header>

      <ui-page-body class="max-w-3xl space-y-4">
        <div ui-card>
          <div ui-card-header>
            <h3 ui-card-title class="text-base">Profile</h3>
            <p ui-card-description>Validates on submit. Edit and click Save.</p>
          </div>
          <div ui-card-content>
            <form [formGroup]="form" uiForm class="space-y-4" (ngSubmit)="onSubmit()">
              <ng-container uiFormField="name">
                <ui-form-item>
                  <label ui-form-label>Name</label>
                  <ui-input formControlName="name" uiFormControl />
                  <ui-form-description>Shown to other workspace members.</ui-form-description>
                  <ui-form-message />
                </ui-form-item>
              </ng-container>

              <ng-container uiFormField="email">
                <ui-form-item>
                  <label ui-form-label>Email</label>
                  <ui-input formControlName="email" type="email" uiFormControl />
                  <ui-form-message />
                </ui-form-item>
              </ng-container>

              <ng-container uiFormField="bio">
                <ui-form-item>
                  <label ui-form-label>Bio</label>
                  <ui-textarea formControlName="bio" [rows]="3" uiFormControl />
                  <ui-form-description>280 characters max.</ui-form-description>
                  <ui-form-message />
                </ui-form-item>
              </ng-container>

              <div class="flex justify-end">
                <button ui-button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>

        @if (submitted(); as sub) {
          <div ui-card>
            <div ui-card-header>
              <h3 ui-card-title class="text-base">Saved profile</h3>
            </div>
            <div ui-card-content>
              <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt class="text-muted-foreground">Name</dt>
                <dd>{{ sub.name }}</dd>
                <dt class="text-muted-foreground">Email</dt>
                <dd>{{ sub.email }}</dd>
                <dt class="text-muted-foreground">Bio</dt>
                <dd>{{ sub.bio || '—' }}</dd>
              </dl>
            </div>
          </div>
        }
      </ui-page-body>
    </ui-page>
  `,
})
export class DashboardFormExampleComponent {
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [zodField(profileSchema.shape.name)] }),
    email: new FormControl('', { nonNullable: true, validators: [zodField(profileSchema.shape.email)] }),
    bio: new FormControl('', { nonNullable: true, validators: [zodField(profileSchema.shape.bio)] }),
  })

  readonly submitted = signal<Profile | null>(null)
  readonly pageTitle = injectPageTitle()

  onSubmit(): void {
    if (this.form.invalid) return
    const value = this.form.getRawValue()
    const parsed = profileSchema.safeParse(value)
    if (!parsed.success) return
    this.submitted.set(parsed.data)
  }
}
