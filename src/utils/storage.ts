import { createClient } from '@supabase/supabase-js'

const BUCKET = 'pictures'
const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${BUCKET}/`

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif'
}

export const isAllowedImageMime = (mime: string): boolean => mime in EXTENSION_BY_MIME

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export const isStorageConfigured = (): boolean =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)

const storage = () => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) throw new Error('Storage not configured')

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

export const uploadImage = async (buffer: Buffer, mime: string): Promise<string> => {
  const extension = EXTENSION_BY_MIME[mime]
  if (!extension) throw new Error(`Unsupported mime type: ${mime}`)

  const supabase = storage()
  const fileName = `${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, buffer, {
    contentType: mime,
    cacheControl: '31536000',
    upsert: false
  })
  if (error) throw new Error(`Image upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

export const deleteImage = async (url: string): Promise<void> => {
  const path = decodeURIComponent(new URL(url).pathname.replace(PUBLIC_PATH_MARKER, ''))
  if (!path || path.includes('/') || !path.includes('.')) throw new Error('Invalid file url')

  const supabase = storage()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) throw new Error(`Image delete failed: ${error.message}`)
}
