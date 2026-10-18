import { z } from 'zod'

const toNumber = (value: unknown) => {
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.')
    return normalized === '' ? undefined : Number(normalized)
  }
  return value
}

const toKarats = (value: unknown) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

const nonNegativeNumber = z.preprocess(toNumber, z.number().nonnegative())
const karats = z.preprocess(toKarats, z.array(z.number().int().positive()).min(1))

export const productInputSchema = z
  .object({
    productId: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category: z.string().trim().min(1),
    price: nonNegativeNumber,
    weight: nonNegativeNumber,
    karats,
    isActive: z.union([z.boolean(), z.number()]),
    hasDiscount: z.union([z.boolean(), z.number()]),
    pictures: z.array(z.string()).default([]),
    offerPrice: nonNegativeNumber.optional()
  })
  .refine(
    (data) => !data.hasDiscount || (data.offerPrice !== undefined && data.offerPrice < data.price),
    { message: 'offerPrice must be lower than price when hasDiscount is enabled' }
  )

export type ProductInput = z.infer<typeof productInputSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
})
