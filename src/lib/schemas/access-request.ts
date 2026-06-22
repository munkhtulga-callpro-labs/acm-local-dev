import { z } from 'zod'

export const createAccessRequestSchema = z.object({
  resourceType: z.string().min(1, 'Resource type is required'),
  resourceId: z.string().min(1, 'Resource ID is required'),
  resourceName: z.string().min(1, 'Resource name is required'),
  accessLevel: z.string().min(1, 'Access level is required'),
  businessJustification: z.string().min(20, 'Minimum 20 characters required'),
  accessRequestTicketId: z.string().optional().nullable(),
  validFrom: z.string().min(1, 'Start date is required'),
  validTo: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
})

export type CreateAccessRequestData = z.infer<typeof createAccessRequestSchema>
