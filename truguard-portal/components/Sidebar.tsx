'use client'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const repNav = [
  { href: '/reviews',  label: 'My Reviews',    icon: '📋' },
  { href: '/training', label: 'Training',       icon: '🎓' },
  { href: '/library',  label: 'Lesson Library', icon: '📚' },
]

const managerNav = [
  { href: '/queue',      label: 'Review Queue',  icon: '🔔' },
  { href: '/team',       label: 'Team Reviews',  icon: '👥' },
  { href: '/dashboards', label: 'Dashboards',    icon: '📊' },
]

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const role = (session?.user as { role?: string })?.role || 'rep'
  const name = session?.user?.name || 'Agent'

  const nav = (role === 'manager' || role === 'admin') ? managerNav : repNav

  return (
    <aside className="w-56 flex-shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center flex-shrink-0">
          <span className="text-bg font-bold text-sm">V</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary leading-none">Coach Vance</p>
          <p className="text-xs text-muted mt-0.5 truncate">
            {role === 'manager' ? 'Manager' : role === 'admin' ? 'Admin' : 'Rep'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-yellow/10 text-yellow font-medium'
                : 'text-dim hover:text-primary hover:bg-raised'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User / sign out */}
      <div className="px-4 py-4 border-t border-border space-y-1">
        <p className="text-xs text-muted truncate px-1">{session?.user?.email}</p>
        <p className="text-sm font-medium text-primary truncate px-1">{name}</p>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left px-3 py-2 text-xs text-muted hover:text-primary hover:bg-raised rounded-lg transition-colors mt-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
