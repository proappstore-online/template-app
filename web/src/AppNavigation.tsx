import type { MouseEvent, ReactNode } from 'react'
import type { AppShellNavContext, LocalAppShellRenderContext } from '@proappstore/sdk'
import { Avatar, Button } from '@proappstore/sdk/ui'

export function NavigationIcon({ path }: { path: string }) {
  return <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>
}

function follow(event: MouseEvent<HTMLAnchorElement>, href: string, navigate: (href: string) => void) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigate(href)
}

/** AppShell remains responsible for routing, titles, focus and the navigation slot. */
export function IconNavigation({ items, currentPath, onNavigate, activity }: AppShellNavContext & { activity?: { href: string; label: string } }) {
  return <nav aria-label="Main" className="flex min-w-0 flex-1">
    <ul className="m-0 flex w-full list-none items-center justify-evenly gap-1 p-0 sm:justify-start">
      {items.filter(item => item.href !== '/profile').map(item => <li key={item.href}>
        <a href={item.href} title={item.label} aria-current={currentPath === item.href ? 'page' : undefined}
          onClick={event => follow(event, item.href, onNavigate)}
          className="relative flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[10px] text-sm font-semibold text-[var(--muted)] no-underline aria-[current=page]:bg-[var(--line)] aria-[current=page]:text-[var(--accent)] sm:px-3">
          {item.icon ?? <NavigationIcon path="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>}
          <span className="sr-only sm:not-sr-only">{item.label}</span>
          {activity?.href === item.href && <span role="img" aria-label={activity.label} className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--danger)]"/>}
        </a>
      </li>)}
    </ul>
  </nav>
}

export function AppTopbar({ appName, nav, user, currentPath, onNavigate }: Pick<LocalAppShellRenderContext, 'appName' | 'nav' | 'user'> & { currentPath: string; onNavigate: (href: string) => void }) {
  const profile: ReactNode = user ? <Avatar user={user} size={32}/> : <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="9" r="3"/><path d="M5 19a7 7 0 0 1 14 0"/></svg>
  return <header className="sticky top-0 z-20 flex min-h-[60px] items-center justify-between gap-1 border-b border-[var(--line)] bg-[var(--paper)] px-2.5 py-2 sm:gap-3 sm:px-4">
    <a href="/" onClick={event => follow(event, '/', onNavigate)} className="flex min-h-11 min-w-11 max-w-[30vw] shrink-0 items-center text-2xl font-extrabold tracking-tighter text-[var(--ink)] no-underline"><span className="truncate">{appName}</span></a>
    {nav}
    <Button variant="ghost" aria-label="Open profile" title="Profile" aria-current={currentPath === '/profile' ? 'page' : undefined}
      onClick={() => onNavigate('/profile')} style={{ width: 44, minWidth: 44, height: 44, padding: 6, flexShrink: 0, background: currentPath === '/profile' ? 'var(--line)' : undefined }}>
      {profile}
    </Button>
  </header>
}
