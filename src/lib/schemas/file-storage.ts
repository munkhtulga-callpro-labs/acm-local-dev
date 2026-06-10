import { z } from 'zod'

const optEmail = z.string().optional()
  .refine(
    v => !v?.trim() || z.email().safeParse(v.trim()).success,
    'Must be a valid email address'
  )

export const fileStorageBaseSchema = z.object({
  storageType: z.enum(['Network Share', 'OneDrive', 'Google Drive', 'SharePoint', 'S3', 'NFS', 'Other']),
  pathLocation: z.string().min(1, 'Path / location is required'),
  permissionLevel: z.enum(['Read', 'Write', 'Full Control']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']),
  quotaLimit: z.string().optional(),
  assignedTo: optEmail,
  encryptionStatus: z.string().optional(),
  ownerDepartment: z.string().optional(),
  notes: z.string().optional(),
  sharingSettings: z.string().optional(),
  retentionPolicy: z.string().optional(),
  expiryDate: z.string().optional(),
})

const transformFields = (data: z.infer<typeof fileStorageBaseSchema>) => ({
  quotaLimit: data.quotaLimit?.trim() || null,
  assignedTo: data.assignedTo?.trim() || null,
  encryptionStatus: data.encryptionStatus?.trim() || null,
  ownerDepartment: data.ownerDepartment?.trim() || null,
  notes: data.notes?.trim() || null,
  sharingSettings: data.sharingSettings?.trim() || null,
  retentionPolicy: data.retentionPolicy?.trim() || null,
  expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
})

export const createFileStorageSchema = fileStorageBaseSchema.transform(data => ({
  ...data,
  ...transformFields(data),
}))

export const updateFileStorageSchema = createFileStorageSchema

export type FileStorageFormData = z.infer<typeof fileStorageBaseSchema>
export type CreateFileStorageInput = z.infer<typeof createFileStorageSchema>
export type UpdateFileStorageInput = z.infer<typeof updateFileStorageSchema>
