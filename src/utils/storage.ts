const BUCKET = 'pictures'
const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${BUCKET}/`

const storageConfig = (): { url: string; key: string } | null => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return { url, key }
}

export const isStorageConfigured = (): boolean => storageConfig() !== null

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif'
}

export const isAllowedImageMime = (mime: string): boolean => mime in EXTENSION_BY_MIME

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024

const storageRequest = async (config: { url: string; key: string }, path: string, init?: RequestInit): Promise<Response> => {
  return fetch(`${config.url}/storage/v1/object/${BUCKET}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.key}`,
      ...(init?.headers ?? {})
    }
  })
}

export const uploadImage = async (buffer: Buffer, mime: string): Promise<string> => {
  const extension = EXTENSION_BY_MIME[mime]
  if (!extension) throw new Error(`Unsupported mime type: ${mime}`)

  const config = storageConfig()
  if (!config) throw new Error('Storage not configured')

  const fileName = `${crypto.randomUUID()}.${extension}`
  const response = await storageRequest(config, fileName, {
    headers: { 'Content-Type': mime, 'x-upsert': 'false' },
    body: new Uint8Array(buffer)
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Image upload failed (${response.status}): ${detail}`)
  }
  return `https://${new URL(config.url).host}${PUBLIC_PATH_MARKER}${fileName}`
}

export const deleteImage = async (url: string): Promise<void> => {
  const config = storageConfig()
  if (!config) throw new Error('Storage not configured')

  const path = decodeURIComponent(new URL(url).pathname.replace(PUBLIC_PATH_MARKER, ''))
  if (!path || path.includes('/') || !path.includes('.')) throw new Error('Invalid file url')

  const response = await storageRequest(config, path)
  if (!response.ok && response.status !== 404) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Image delete failed (${response.status}): ${detail}`)
  }
}
