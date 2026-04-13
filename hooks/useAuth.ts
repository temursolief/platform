'use client'

import { useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/lib/types'

interface AuthState {
  supabaseUser: SupabaseUser | null
  profile: User | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    supabaseUser: null,
    profile: null,
    loading: true,
  })

  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, role, created_at, last_sign_in')
          .eq('id', user.id)
          .single()
        setState({ supabaseUser: user, profile, loading: false })
      } else {
        setState({ supabaseUser: null, profile: null, loading: false })
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          setState({ supabaseUser: session.user, profile, loading: false })
        } else {
          setState({ supabaseUser: null, profile: null, loading: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user: state.supabaseUser,
    profile: state.profile,
    loading: state.loading,
    isTeacher: state.profile?.role === 'teacher' || state.profile?.role === 'admin',
    isStudent: state.profile?.role === 'student',
    signOut,
  }
}
