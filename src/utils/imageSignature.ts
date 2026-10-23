/**
 * Detección de MIME por magic bytes (sniffing del contenido real del archivo).
 * El header Content-Type que envía el cliente es declarativo y puede mentir:
 * esta firma comprueba que los primeros bytes del buffer coinciden con una
 * imagen de verdad antes de subirla al bucket.
 */

export const detectImageMime = (buf: Buffer): string | undefined => {
  if (buf.length < 12) return undefined
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png'
  }
  // WEBP: RIFF....WEBP
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'image/webp'
  }
  // AVIF: ....ftyp + major brand avif/avis/av01/mif1
  if (buf.subarray(4, 8).toString('latin1') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('latin1').toLowerCase()
    if (brand.startsWith('av') || brand === 'mif1') return 'image/avif'
    return undefined
  }
  // GIF: GIF87a / GIF89a
  if (buf.subarray(0, 3).toString('latin1') === 'GIF') return 'image/gif'
  return undefined
}
