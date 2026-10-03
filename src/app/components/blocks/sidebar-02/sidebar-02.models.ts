import type { LucideIconData } from 'lucide-angular'

export interface SidebarSubItem {
  title: string
  url: string
  isActive?: boolean
}

export interface SidebarNavItem {
  title: string
  url: string
  icon: LucideIconData
  isActive?: boolean
  items?: SidebarSubItem[]
}

export interface SidebarProject {
  name: string
  url: string
  icon: LucideIconData
  isActive?: boolean
}

/** `logo: 'uipkge'` renders the UipkgeLogo mark (inline SVG), like the Nuxt block. */
export interface SidebarTeam {
  name: string
  plan: string
  logo: LucideIconData | 'uipkge'
}

export interface SidebarUser {
  name: string
  email: string
  avatar?: string
}
