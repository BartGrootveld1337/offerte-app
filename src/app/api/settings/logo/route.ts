import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// Max 2MB logo upload
const MAX_FILE_SIZE = 2 * 1024 * 1024

// Allowed extensions — SVG excluded (XSS risk via <script> tags)
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

// Allowed MIME types (must match extension AND actual content-type)
const ALLOWED_MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

// Magic byte signatures for image validation (prevent content-type spoofing)
const MAGIC_BYTES: Record<string, number[][]> = {
  png:  [[0x89, 0x50, 0x4E, 0x47]],
  jpg:  [[0xFF, 0xD8, 0xFF]],
  jpeg: [[0xFF, 0xD8, 0xFF]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF header (WebP)
}

function validateMagicBytes(buffer: ArrayBuffer, ext: string): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 12))
  const signatures = MAGIC_BYTES[ext]
  if (!signatures) return false
  return signatures.some(sig => sig.every((byte, i) => bytes[i] === byte))
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Geen bestand opgegeven' }, { status: 400 })

  // File size check (before reading into memory)
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Bestand te groot (max 2MB)' }, { status: 400 })
  }

  // Extension check — no SVG allowed
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json({ error: 'Bestandstype niet toegestaan. Gebruik PNG, JPG of WebP.' }, { status: 400 })
  }

  // MIME type must match extension (don't trust client-provided Content-Type)
  const expectedMime = ALLOWED_MIME_TYPES[ext]
  const actualMime = file.type.toLowerCase().split(';')[0].trim()
  if (actualMime !== expectedMime) {
    return NextResponse.json({ error: 'Bestandstype klopt niet overeen met extensie' }, { status: 400 })
  }

  // Read file into buffer
  const buffer = await file.arrayBuffer()

  // Magic bytes validation (actual file content check — prevents spoofing)
  if (!validateMagicBytes(buffer, ext)) {
    return NextResponse.json({ error: 'Bestand is geen geldig afbeeldingsbestand' }, { status: 400 })
  }

  // Store with a fixed safe filename (no user-controlled path)
  const path = `${user.id}/logo.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(path, buffer, {
      contentType: expectedMime, // Use validated MIME, not client-provided
      upsert: true,
    })

  if (uploadError) {
    console.error('[logo upload]', uploadError.message)
    return NextResponse.json({ error: 'Upload mislukt' }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ logo_url: publicUrl })
    .eq('id', user.id)

  if (updateError) {
    console.error('[logo profile update]', updateError.message)
    return NextResponse.json({ error: 'Profiel bijwerken mislukt' }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
