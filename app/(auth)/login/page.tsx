'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(decodeURIComponent(urlError))
  }, [searchParams])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white"
              style={{ background: 'var(--primary)', fontSize: '28px', fontFamily: 'Georgia, serif' }}
            >
              I
            </div>
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}
          >
            IELTS Pro
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted)' }}>
            Sign in to start practising
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--line)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: 'var(--ink)', fontFamily: 'Georgia, serif' }}
          >
            Welcome back
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--ink-muted)' }}>
            Use your Google account to sign in or create a new account.
          </p>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm"
              style={{
                background: 'var(--rose-soft)',
                border: '1px solid var(--rose)',
                color: 'var(--rose)',
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
            style={{
              background: 'var(--surface-2)',
              border: '1.5px solid var(--line)',
              color: 'var(--ink)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {!loading && <GoogleIcon />}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <p className="text-xs text-center mt-6" style={{ color: 'var(--ink-faint)' }}>
            By signing in, you agree to our terms. New users are registered as students.
            Contact your teacher to get teacher access.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
