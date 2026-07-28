import { z } from 'zod'

export const TEMPLATE_KINDS = ['SYSTEM', 'RESOURCE'] as const

// Shared columns. The two kinds carry mutually exclusive pointer fields, so each
// branch below merges these in and nulls out the fields it does not use — that
// keeps a SYSTEM template from ever persisting a stray resourceId.
const commonFields = {
  // Checked against the trimmed value — `.min(1)` alone would accept "   ".
  accessLevel: z
    .string()
    .refine(value => value.trim().length > 0, 'Access level is required'),
  isRequired: z.boolean().default(true),
  isActive: z.boolean().default(true),
}

const systemTemplateSchema = z.object({
  kind: z.literal('SYSTEM'),
  systemId: z.string().min(1, 'System is required'),
  ...commonFields,
})

const resourceTemplateSchema = z.object({
  kind: z.literal('RESOURCE'),
  resourceType: z.string().min(1, 'Resource type is required'),
  resourceId: z.string().min(1, 'Resource is required'),
  resourceName: z.string().min(1, 'Resource name is required'),
  ...commonFields,
})

const toRow = (data: z.infer<typeof systemTemplateSchema> | z.infer<typeof resourceTemplateSchema>) => ({
  kind: data.kind,
  systemId: data.kind === 'SYSTEM' ? data.systemId : null,
  resourceType: data.kind === 'RESOURCE' ? data.resourceType.trim() : null,
  resourceId: data.kind === 'RESOURCE' ? data.resourceId : null,
  resourceName: data.kind === 'RESOURCE' ? data.resourceName.trim() : null,
  accessLevel: data.accessLevel.trim(),
  isRequired: data.isRequired,
  isActive: data.isActive,
})

export const accessTemplateSchema = z
  .discriminatedUnion('kind', [systemTemplateSchema, resourceTemplateSchema])
  .transform(toRow)

export const createAccessTemplateSchema = accessTemplateSchema

// Edits keep the same kind — switching a template between SYSTEM and RESOURCE
// changes what it points at entirely, so that is a delete plus a create.
export const updateAccessTemplateSchema = accessTemplateSchema

export type AccessTemplateInput = z.infer<typeof accessTemplateSchema>
