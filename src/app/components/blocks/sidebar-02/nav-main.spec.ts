// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from 'vitest'
import { provideZonelessChangeDetection, Component } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { LayoutDashboard } from 'lucide-angular'
import { NavMainComponent } from '@/app/components/blocks/sidebar-02/nav-main.component'
import { UiSidebarProviderComponent } from '@/app/components/ui/sidebar/sidebar.component'

@Component({
  standalone: true,
  imports: [UiSidebarProviderComponent, NavMainComponent],
  template: `
    <ui-sidebar-provider>
      <nav-main [items]="items" />
    </ui-sidebar-provider>
  `,
})
class NavMainHost {
  items = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    {
      title: 'Settings',
      url: '/settings',
      icon: LayoutDashboard,
      isActive: true,
      items: [
        { title: 'General', url: '/settings/general' },
        { title: 'Team', url: '/settings/team', isActive: true },
      ],
    },
  ]
}

describe('NavMainComponent (group toggle behaviour)', () => {
  let fixture: ComponentFixture<NavMainHost>

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavMainHost],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents()
    fixture = TestBed.createComponent(NavMainHost)
    fixture.detectChanges()
    await fixture.whenStable()
  })

  it('opens the group whose child is active', () => {
    const links = [...fixture.nativeElement.querySelectorAll('a[href]')] as HTMLAnchorElement[]
    expect(links.map((a) => a.getAttribute('href'))).toContain('/settings/team')
  })

  it('renders the parent as a toggle button, not a link', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]
    expect(buttons.some((b) => b.textContent?.includes('Settings'))).toBe(true)
    expect(fixture.nativeElement.querySelectorAll('a[href="/settings"]').length).toBe(0)
  })
})
