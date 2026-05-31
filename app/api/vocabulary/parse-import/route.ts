import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseApkg, parseVocabJson } from '@/lib/vocabulary/parse-import'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

// POST /api/vocabulary/parse-import
// Accepts multipart/form-data with a "file" field (.apkg or .json)
// Returns parsed entries for preview — does NOT save to database
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '"file" field is required.' }, { status: 400 })

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: `File too large (max 20 MB).` }, { status: 400 })
  }

  const name = file.name.toLowerCase()
  const isApkg = name.endsWith('.apkg')
  const isJson = name.endsWith('.json') || file.type === 'application/json'

  if (!isApkg && !isJson) {
    return NextResponse.json(
      { error: 'Unsupported file type. Upload a .apkg or .json file.' },
      { status: 400 }
    )
  }

  try {
    if (isApkg) {
      const buffer = await file.arrayBuffer()
      const entries = await parseApkg(buffer)
      return NextResponse.json({ entries, format: 'apkg', total: entries.length })
    } else {
      const text = await file.text()
      const entries = parseVocabJson(text)
      return NextResponse.json({ entries, format: 'json', total: entries.length })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse file.'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
