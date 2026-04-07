import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_AUDIO_SIZE = 50 * 1024 * 1024   // 50 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024    // 5 MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'student') {
    return NextResponse.json({ error: 'Teachers only' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const testId = formData.get('testId') as string | null
  const fileType = formData.get('type') as 'audio' | 'passage' | null

  if (!file || !testId || !fileType) {
    return NextResponse.json({ error: 'file, testId, and type are required' }, { status: 400 })
  }

  // Validate file type and size
  const isAudio = fileType === 'audio'
  const allowedTypes = isAudio ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES
  const maxSize = isAudio ? MAX_AUDIO_SIZE : MAX_IMAGE_SIZE

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: `Invalid file type: ${file.type}` }, { status: 400 })
  }

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File too large. Max ${maxSize / (1024 * 1024)}MB` },
      { status: 400 }
    )
  }

  // Sanitize filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const bucket = isAudio ? 'audio' : 'passages'
  const path = `${testId}/${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
