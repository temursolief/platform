'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SunIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
  </svg>
)
const MoonIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)
const UserIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const CheckIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12l5 5 11-11"/>
  </svg>
)

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sync theme from DOM (set by hydration script)
    const current = document.documentElement.getAttribute('data-theme')
    setTheme(current === 'dark' ? 'dark' : 'light')

    // Fetch profile
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setEmail(user.email ?? '')
      supabase
        .from('users')
        .select('full_name, role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setName(data.full_name ?? '')
            setRole(data.role ?? '')
          }
          setLoading(false)
        })
    })
  }, [])

  const handleThemeToggle = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    try { localStorage.setItem('ielts-theme', newTheme) } catch (_) {}
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  const handleSaveName = async () => {
    if (!name.trim()) { setError('Name cannot be empty.'); return }
    setSaving(true)
    setError(null)
    setSaved(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error: updateError } = await supabase
      .from('users')
      .update({ full_name: name.trim() })
      .eq('id', user.id)
    setSaving(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : email?.[0]?.toUpperCase() || '?'

  if (loading) {
    return (
      <div className="py-8 px-10">
        <div className="h-8 w-48 rounded-xl animate-pulse" style={{ background: 'var(--surface-2)' }} />
      </div>
    )
  }

  return (
    <div className="py-8 px-10 max-w-[720px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold leading-none" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
          Settings
        </h1>
        <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-2xl p-6 mb-6 flex items-center gap-5"
           style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
             style={{ background: 'var(--accent)' }}>
          {initials}
        </div>
        <div>
          <p className="font-bold text-lg" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>
            {name || 'Unnamed User'}
          </p>
          <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>{email}</p>
          {role && (
            <span className="inline-flex text-[10px] font-bold tracking-widest px-2 py-0.5 rounded mt-1 capitalize"
                  style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)', border: '1px solid var(--line)' }}>
              {role}
            </span>
          )}
        </div>
      </div>

      {/* Display name */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
            <UserIcon />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Display Name</h2>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>How your name appears across the platform</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSaveName()}
            placeholder="Your full name"
            className="flex-1 h-10 px-4 rounded-xl text-sm font-medium outline-none transition-all"
            style={{
              background: 'var(--surface-2)',
              border: '1.5px solid var(--line)',
              color: 'var(--ink)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)' }}
          />
          <button
            onClick={handleSaveName}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              background: saved ? 'var(--accent)' : 'var(--primary)',
              color: 'white',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saved ? <><CheckIcon /> Saved</> : saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {error && (
          <p className="text-xs mt-2" style={{ color: 'var(--rose)' }}>{error}</p>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1.5px solid var(--line)' }}>
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--gold-soft)', color: 'var(--gold-ink)' }}>
            <SunIcon />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}>Appearance</h2>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Choose light or dark theme</p>
          </div>
        </div>

        <div className="flex gap-3">
          {(['light', 'dark'] as const).map(t => {
            const active = theme === t
            return (
              <button
                key={t}
                onClick={() => handleThemeToggle(t)}
                className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                style={{
                  background: active ? (t === 'dark' ? 'var(--ink)' : 'var(--primary-soft)') : 'var(--surface-2)',
                  border: active ? `2px solid ${t === 'dark' ? 'var(--ink)' : 'var(--primary)'}` : '1.5px solid var(--line)',
                }}
              >
                <div style={{ color: active ? (t === 'dark' ? 'white' : 'var(--primary)') : 'var(--ink-muted)' }}>
                  {t === 'light' ? <SunIcon /> : <MoonIcon />}
                </div>
                <span className="text-sm font-semibold capitalize"
                      style={{ color: active ? (t === 'dark' ? 'white' : 'var(--primary-ink)') : 'var(--ink-soft)' }}>
                  {t}
                </span>
                {active && (
                  <span className="text-[10px] font-bold tracking-widest"
                        style={{ color: t === 'dark' ? 'rgba(255,255,255,0.6)' : 'var(--primary)' }}>
                    ACTIVE
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
