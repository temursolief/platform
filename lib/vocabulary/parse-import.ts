import { readFileSync } from 'fs'
import { resolve } from 'path'
import JSZip from 'jszip'
import initSqlJs, { type Database as SqlDatabase } from 'sql.js'
import { decompress as zstdDecompress } from 'fzstd'

export interface ParsedVocabularyEntry {
  word: string
  definition: string
  example_sentence: string
  translation: string
  notes: string
}

// ─── HTML + Anki markup stripping ────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    // Anki cloze: {{c1::word}} or {{c1::word::hint}} → keep the word part
    .replace(/\{\{c\d+::([^:}]+)(?:::[^}]*)?\}\}/g, '$1')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Field name → vocabulary role mapping ─────────────────────────────────────
const WORD_FIELDS    = /^(front|word|term|english|vocabulary|vocab|expression|headword|question|chunk|phrase|collocation|q|w)$/i
const DEF_FIELDS     = /^(back|definition|meaning|explanation|description|desc|gloss|answer|a)$/i
const EXAMPLE_FIELDS = /^(example|sentence|usage|context|example[_\s]?sentence|sample)$/i
const TRANS_FIELDS   = /^(translation|native|l1|uzbek|russian|korean|japanese|chinese|mother|tr|translate|native[_\s]?language)$/i
const NOTES_FIELDS   = /^(note|notes|extra|hint|memory|mnemonic|tags?|comment|remarks?|wordform|word[_\s]?form|pos|part[_\s]?of[_\s]?speech|transcription|pronunciation|phonetic|ipa)$/i

function mapFields(
  rawFields: string[],
  fieldNames: string[]
): ParsedVocabularyEntry {
  const clean = rawFields.map(stripHtml)
  let word = '', definition = '', example_sentence = '', translation = '', notes = ''

  if (fieldNames.length >= 1) {
    for (let i = 0; i < fieldNames.length; i++) {
      const name = fieldNames[i]
      const val = clean[i] ?? ''
      if (!word && WORD_FIELDS.test(name)) word = val
      else if (!definition && DEF_FIELDS.test(name)) definition = val
      else if (!example_sentence && EXAMPLE_FIELDS.test(name)) example_sentence = val
      else if (!translation && TRANS_FIELDS.test(name)) translation = val
      else if (!notes && NOTES_FIELDS.test(name)) notes = val
    }
  }

  // Fallback: positional mapping if name-based found nothing useful
  if (!word) word = clean[0] ?? ''
  // For definition: try clean[1], but if it's empty skip to next non-empty slot
  // (some decks have Transcription/pronunciation at position 1 which is often empty)
  if (!definition) {
    for (let i = 1; i < clean.length; i++) {
      if (clean[i]) { definition = clean[i]; break }
    }
  }
  if (!example_sentence) {
    const idx = clean.findIndex((v, i) => i > 1 && v && v !== definition)
    if (idx !== -1) example_sentence = clean[idx]
  }

  return { word, definition, example_sentence, translation, notes }
}

// ─── Open SQLite bytes with sql.js ────────────────────────────────────────────
async function openSqlite(bytes: Uint8Array) {
  const wasmPath = resolve(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm')
  const wasmBuffer = readFileSync(wasmPath)
  const wasmBinary = wasmBuffer.buffer.slice(
    wasmBuffer.byteOffset,
    wasmBuffer.byteOffset + wasmBuffer.byteLength
  ) as ArrayBuffer
  const SQL = await initSqlJs({ wasmBinary })
  return new SQL.Database(bytes)
}

// ─── Extract field names from col table ───────────────────────────────────────
function extractFieldNames(db: SqlDatabase): string[] {
  try {
    // Anki 2.1 stores models JSON in `col` table
    const colRows = db.exec('SELECT models FROM col LIMIT 1')
    const modelsJson = colRows[0]?.values[0]?.[0] as string | undefined
    if (modelsJson) {
      const models = JSON.parse(modelsJson) as Record<string, { flds?: { name: string }[] }>
      // Use the first model's field names
      const firstModel = Object.values(models)[0]
      return firstModel?.flds?.map((f) => f.name) ?? []
    }
  } catch {
    // col table may not exist or have different structure
  }

  // Anki 2.1 new schema stores models differently
  try {
    const rows = db.exec("SELECT config FROM config WHERE KEY = 'models' LIMIT 1")
    const json = rows[0]?.values[0]?.[0] as string | undefined
    if (json) {
      const models = JSON.parse(json) as Record<string, { flds?: { name: string }[] }>
      const firstModel = Object.values(models)[0]
      return firstModel?.flds?.map((f) => f.name) ?? []
    }
  } catch {
    // ignore
  }

  return []
}

// ─── Extract notes from SQLite ────────────────────────────────────────────────
function extractNotes(db: SqlDatabase, fieldNames: string[]): ParsedVocabularyEntry[] {
  const entries: ParsedVocabularyEntry[] = []

  // Try `notes` table (standard Anki format)
  try {
    const notesRows = db.exec('SELECT flds FROM notes')
    for (const row of notesRows[0]?.values ?? []) {
      const rawFields = String(row[0]).split('\x1f')
      const entry = mapFields(rawFields, fieldNames)
      if (entry.word) entries.push(entry)
    }
    if (entries.length > 0) return entries
  } catch {
    // try alternate table
  }

  // Some decks use `note` (singular)
  try {
    const notesRows = db.exec('SELECT flds FROM note')
    for (const row of notesRows[0]?.values ?? []) {
      const rawFields = String(row[0]).split('\x1f')
      const entry = mapFields(rawFields, fieldNames)
      if (entry.word) entries.push(entry)
    }
  } catch {
    // ignore
  }

  return entries
}

// ─── APKG parser ──────────────────────────────────────────────────────────────
export async function parseApkg(buffer: ArrayBuffer): Promise<ParsedVocabularyEntry[]> {
  const zip = await JSZip.loadAsync(buffer)

  // Try all known Anki database file names in order of preference
  const candidates = ['collection.anki21b', 'collection.anki21', 'collection.anki2']
  let dbBytes: Uint8Array | null = null
  let usedFile = ''

  for (const name of candidates) {
    const file = zip.file(name)
    if (file) {
      const ab = await file.async('arraybuffer')
      dbBytes = new Uint8Array(ab)
      usedFile = name
      break
    }
  }

  if (!dbBytes) {
    // List what's actually in the zip to help debug
    const fileList = Object.keys(zip.files).join(', ')
    throw new Error(
      `Invalid .apkg: no Anki database found. Files in archive: ${fileList || '(empty)'}`
    )
  }

  // .anki21b is Zstd-compressed — decompress before passing to sql.js
  if (usedFile === 'collection.anki21b') {
    dbBytes = zstdDecompress(dbBytes)
  }

  const db = await openSqlite(dbBytes)
  const fieldNames = extractFieldNames(db)
  const entries = extractNotes(db, fieldNames)
  db.close()

  return entries
}

// ─── JSON parser ──────────────────────────────────────────────────────────────
export function parseVocabJson(text: string): ParsedVocabularyEntry[] {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Invalid JSON: could not parse file.')
  }

  const arr = Array.isArray(raw) ? raw : [raw]

  const entries: ParsedVocabularyEntry[] = []
  for (const item of arr) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>

    const word = String(
      obj.word ?? obj.front ?? obj.term ?? obj.expression ?? ''
    ).trim()
    const definition = String(
      obj.definition ?? obj.back ?? obj.meaning ?? obj.explanation ?? ''
    ).trim()

    if (!word) continue

    entries.push({
      word,
      definition,
      example_sentence: String(obj.example_sentence ?? obj.example ?? obj.sentence ?? '').trim(),
      translation: String(obj.translation ?? obj.native ?? '').trim(),
      notes: String(obj.notes ?? obj.note ?? obj.extra ?? '').trim(),
    })
  }

  return entries
}
