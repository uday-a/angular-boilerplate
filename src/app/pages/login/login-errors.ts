// Maps short ?error= codes from the /auth/magic-link + /auth/github redirects
// to user-facing copy. Extracted pure (no Angular imports) so it's trivially
// unit-testable; Login renders the result via Sonner toast.
export function loginErrorMessage(code: string | null): string | null {
  switch (code) {
    case 'magic-link-expired': return 'That sign-in link expired. Request a fresh one below.'
    case 'magic-link-used': return 'That sign-in link was already used. Request a fresh one below.'
    case 'magic-link-invalid': return 'That sign-in link is invalid. Request a fresh one below.'
    case 'magic-link-missing-token': return 'Sign-in link was missing a token. Request a fresh one below.'
    case 'magic-link-db-required': return 'Magic-link sign-in needs a DATABASE_URL configured. Use GitHub instead.'
    case 'magic-link-failed': return 'Sign-in failed. Try again or use GitHub.'
    case 'oauth': return 'GitHub sign-in failed. Try again.'
    default: return null
  }
}
