import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Supabase OAuth callback handler.
 *
 * Google redirects back to /auth/callback?code=xxx after the user signs in.
 * We exchange the code for a session, look up the user's role, then redirect
 * them to the appropriate dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Surface OAuth errors back to the login page
  if (error) {
    const params = new URLSearchParams({ error: errorDescription ?? error })
    return NextResponse.redirect(`${origin}/login?${params}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    const params = new URLSearchParams({ error: exchangeError.message })
    return NextResponse.redirect(`${origin}/login?${params}`)
  }

  // Fetch the newly created session's user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  // Look up role to decide which dashboard to send them to
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'student'
  const destination = role === 'teacher' || role === 'admin' ? '/teacher' : '/student'

  return NextResponse.redirect(`${origin}${destination}`)
}
