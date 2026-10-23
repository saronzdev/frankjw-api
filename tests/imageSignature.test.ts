import { describe, expect, it } from 'vitest'
import { detectImageMime } from '../src/utils/imageSignature.js'

const bytes = (...values: number[]) => Buffer.from(values)
const latin = (s: string) => Buffer.from(s, 'latin1')

describe('detectImageMime', () => {
  it('detecta JPEG por magic bytes FF D8 FF', () => {
    expect(detectImageMime(latin('\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01'))).toBe('image/jpeg')
  })

  it('detecta PNG por firma de 8 bytes', () => {
    expect(detectImageMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0))).toBe('image/png')
  })

  it('detecta WEBP por RIFF....WEBP', () => {
    expect(detectImageMime(latin('RIFF\x00\x00\x00\x00WEBPVP8 '))).toBe('image/webp')
  })

  it('detecta GIF87a y GIF89a', () => {
    expect(detectImageMime(latin('GIF89a\x01\x00\x01\x00\x00\x00'))).toBe('image/gif')
    expect(detectImageMime(latin('GIF87a\x01\x00\x01\x00\x00\x00'))).toBe('image/gif')
  })

  it('detecta AVIF con brand avif/avis/av01/mif1', () => {
    expect(detectImageMime(latin('\x00\x00\x00\x20ftypavif\x00\x00\x00\x00'))).toBe('image/avif')
    expect(detectImageMime(latin('\x00\x00\x00\x20ftypavis\x00\x00\x00\x00'))).toBe('image/avif')
    expect(detectImageMime(latin('\x00\x00\x00\x20ftypav01\x00\x00\x00\x00'))).toBe('image/avif')
    expect(detectImageMime(latin('\x00\x00\x00\x20ftypmif1hei8'))).toBe('image/avif')
  })

  it('rechaza mp4/audio/documentos que usan ftyp sin brand de AVIF', () => {
    expect(detectImageMime(latin('\x00\x00\x00\x20ftypisom\x00\x00\x02\x00'))).toBeUndefined()
    expect(detectImageMime(latin('\x00\x00\x00\x20ftypM4A \x00\x00\x00\x00'))).toBeUndefined()
    expect(detectImageMime(latin('%PDF-1.7\nfile'))).toBeUndefined()
  })

  it('rechaza texto plano, html y buffers cortos o vacíos', () => {
    expect(detectImageMime(Buffer.from('<!DOCTYPE html>'))).toBeUndefined()
    expect(detectImageMime(Buffer.from('x'))).toBeUndefined()
    expect(detectImageMime(Buffer.alloc(0))).toBeUndefined()
  })
})
