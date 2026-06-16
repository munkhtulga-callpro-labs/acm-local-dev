import { z } from 'zod'

const optEmail = z.string().optional()
  .refine(
    v => !v?.trim() || z.email().safeParse(v.trim()).success,
    'Must be a valid email address'
  )

export const physicalAccessBaseSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  accessType: z.enum(['Badge', 'Key', 'Biometric', 'PIN', 'Badge + PIN']),
  badgeCardNumber: z.string().optional(),
  accessSchedule: z.enum(['24/7', 'Business Hours', 'Weekdays Only', 'Custom']),
  accessZones: z.string().min(1, 'Access zones is required'),
  assignedTo: optEmail,
  validFrom: z.string().min(1, 'Valid from date is required'),
  validTo: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED']),
  escortRequired: z.boolean(),
  authorizationLevel: z.string().optional(),
  notes: z.string().optional(),
})

const transformFields = (data: z.infer<typeof physicalAccessBaseSchema>) => ({
  badgeCardNumber: data.badgeCardNumber?.trim() || null,
  assignedTo: data.assignedTo?.trim() || null,
  authorizationLevel: data.authorizationLevel?.trim() || null,
  notes: data.notes?.trim() || null,
  validFrom: new Date(data.validFrom),
  validTo: data.validTo ? new Date(data.validTo) : null,
})

export const createPhysicalAccessSchema = physicalAccessBaseSchema.transform(data => ({
  ...data,
  ...transformFields(data),
}))

export const updatePhysicalAccessSchema = createPhysicalAccessSchema

export type PhysicalAccessFormData = z.infer<typeof physicalAccessBaseSchema>
export type CreatePhysicalAccessInput = z.infer<typeof createPhysicalAccessSchema>
export type UpdatePhysicalAccessInput = z.infer<typeof updatePhysicalAccessSchema>
