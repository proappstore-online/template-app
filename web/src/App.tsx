import { useEffect, useState } from 'react'
import { initPro, AppShell, useAuth, type NavItem } from '@proappstore/sdk'
import { Card, PageHeader, ProProfilePage, SignInButtons, TextSizeToggle, ThemeToggle } from '@proappstore/sdk/ui'
import { AppTopbar, IconNavigation, NavigationIcon } from './AppNavigation'

const app = initPro({
  appId: 'APPNAME',
  authMode: 'platform-cookie',
  monitoring: { build: { sha: import.meta.env.VITE_COMMIT_SHA } },
})

// Keep Profile in NAV for page titles; its visible navigation target is the avatar.
// Give each primary screen an icon. Labels remain accessible on mobile and visible on desktop.
const NAV: NavItem[] = [
  { label: 'Home', href: '/', title: 'APPNAME', icon: <NavigationIcon path="m3 10 9-7 9 7v10H3V10Zm6 10v-7h6v7"/> },
  { label: 'About', href: '/about', title: 'About — APPNAME', icon: <NavigationIcon path="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 7v7m0-10v.01"/> },
  { label: 'Profile', href: '/profile', title: 'Profile — APPNAME' },
]

function navigate(path: string) {
  history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function App() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const changed = () => setPath(location.pathname)
    window.addEventListener('popstate', changed)
    return () => window.removeEventListener('popstate', changed)
  }, [])
  return <AppShell app={app} appName="APPNAME" nav={NAV} branding="app" access="local"
    renderNav={context => <IconNavigation {...context}/>}
    renderLocalTopbar={context => <AppTopbar {...context} currentPath={path} onNavigate={navigate}/>}
    onNavigate={navigate}>
    <Screens path={path}/>
  </AppShell>
}

function Screens({ path }: { path: string }) {
  if (path === '/profile') return <Profile/>
  if (path === '/about') return <About/>
  return <Home/>
}

function Home() {
  const { user } = useAuth()
  return <div className="mx-auto w-full max-w-3xl px-6 py-10">
    <PageHeader title="APPNAME" description={user ? `Signed in as ${user.name}.` : 'Welcome. Open Profile to sign in or change your preferences.'}/>
    <p className="text-sm text-[var(--muted)]">Build your app here. Add primary screens to NAV with icons. The avatar always opens your Profile page.</p>
  </div>
}

function About() {
  return <div className="mx-auto w-full max-w-3xl px-6 py-10">
    <PageHeader title="About" description="What APPNAME is for."/>
    <p className="text-sm text-[var(--muted)]">Replace this screen with your own. Error recovery, offline status, accessible navigation and page titles come from AppShell.</p>
  </div>
}

function Profile() {
  const { user } = useAuth()
  return <div className="mx-auto w-full max-w-3xl space-y-6 px-6 py-10">
    <PageHeader title="Profile" description="Your account and preferences."/>
    <Card><h2 className="mb-4 text-lg font-bold">Appearance</h2><div className="flex flex-wrap items-center gap-4"><ThemeToggle/><TextSizeToggle/></div></Card>
    <Card>{user ? <ProProfilePage app={app} showThemeToggle={false}/> : <><h2 className="mb-3 text-lg font-bold">Sign in</h2><p className="mb-4 text-sm text-[var(--muted)]">Use your account to access private app features.</p><SignInButtons app={app}/></>}</Card>
  </div>
}
