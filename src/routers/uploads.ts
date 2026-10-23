import { Router, raw } from 'express'
import { auth, adminOnly } from '../middlewares/auth.js'
import { ErrorCodes } from '../utils/config.js'
import {
  MAX_IMAGE_BYTES,
  deleteImage,
  isAllowedImageMime,
  isStorageConfigured,
  uploadImage
} from '../utils/storage.js'
import { detectImageMime } from '../utils/imageSignature.js'

export const uploads = Router()

uploads.post(
  '/uploads',
  auth,
  adminOnly,
  raw({ type: () => true, limit: MAX_IMAGE_BYTES + 1 }),
  async (req, res) => {
    if (!isStorageConfigured()) {
      res.status(503).json({ code: ErrorCodes.UploadFileError })
      return
    }
    const mime = String(req.headers['content-type'] ?? '').split(';')[0].trim()
    const body = req.body as Buffer | undefined
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ code: ErrorCodes.RequiredFieldMissing })
      return
    }
    const detectedMime = detectImageMime(body)
    if (
      !isAllowedImageMime(mime) ||
      detectedMime === undefined ||
      mime !== detectedMime ||
      body.length > MAX_IMAGE_BYTES
    ) {
      res.status(400).json({ code: ErrorCodes.UploadFileError })
      return
    }
    try {
      const url = await uploadImage(body, mime)
      res.status(201).json({ url })
    } catch (error) {
      console.error('Upload error: ', error)
      res.status(502).json({ code: ErrorCodes.UploadFileError })
    }
  }
)

uploads.delete('/uploads', auth, adminOnly, async (req, res) => {
  if (!isStorageConfigured()) {
    res.status(503).json({ code: ErrorCodes.UploadFileError })
    return
  }
  const url = String(req.query.url ?? '')
  try {
    await deleteImage(url)
    res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Delete error: ', error)
    res.status(400).json({ code: ErrorCodes.UploadFileError })
  }
})
