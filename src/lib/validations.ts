import { z } from 'zod'

// User schemas
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE', 'IT_STAFF']),
  company: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE', 'IT_STAFF']).optional(),
  company: z.string().optional(),
  isActive: z.boolean().optional(),
})

// Employee schemas
export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  manager: z.string().email('Invalid manager email').optional().or(z.literal('')),
  company: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
})

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required').optional(),
  position: z.string().min(1, 'Position is required').optional(),
  manager: z.string().email('Invalid manager email').optional().or(z.literal('')),
  company: z.string().optional(),
  isActive: z.boolean().optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
})

// System schemas
export const createSystemSchema = z.object({
  name: z.string().min(1, 'System name is required'),
  description: z.string().optional(),
  category: z.enum(['COMMUNICATION', 'PRODUCTIVITY', 'DEVELOPMENT', 'FINANCE', 'MARKETING', 'CUSTOMER_SERVICE', 'INFRASTRUCTURE', 'OTHER']),
  hasApi: z.boolean().default(false),
  apiEndpoint: z.string().url('Invalid API endpoint').optional(),
  requiresManual: z.boolean().default(false),
})

export const updateSystemSchema = z.object({
  name: z.string().min(1, 'System name is required').optional(),
  description: z.string().optional(),
  category: z.enum(['COMMUNICATION', 'PRODUCTIVITY', 'DEVELOPMENT', 'FINANCE', 'MARKETING', 'CUSTOMER_SERVICE', 'INFRASTRUCTURE', 'OTHER']).optional(),
  hasApi: z.boolean().optional(),
  apiEndpoint: z.string().url('Invalid API endpoint').optional(),
  requiresManual: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// Access Request schemas
export const createAccessRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  requestType: z.enum(['ONBOARDING', 'OFFBOARDING', 'ACCESS_MODIFICATION', 'ACCESS_EXTENSION', 'ACCESS_REVOCATION']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  systems: z.array(z.object({
    systemId: z.string(),
    accessLevel: z.string(),
    isRequired: z.boolean().default(true),
  })),
})

export const approveRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  comments: z.string().optional(),
})

export const rejectRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
  comments: z.string().min(1, 'Rejection reason is required'),
})

// Access Permission schemas
export const createAccessPermissionSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  systemId: z.string().min(1, 'System ID is required'),
  accessLevel: z.string().min(1, 'Access level is required'),
  expiresAt: z.string().transform((str) => new Date(str)).optional(),
})

export const updateAccessPermissionSchema = z.object({
  accessLevel: z.string().min(1, 'Access level is required').optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().transform((str) => new Date(str)).optional(),
})

// Excel Import schema
export const excelImportSchema = z.object({
  file: z.any(), // File object
})

// Email Template schemas
export const createEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  variables: z.array(z.string()).optional(),
})

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  body: z.string().min(1, 'Body is required').optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// Position schemas
export const createPositionSchema = z.object({
  name: z.string().min(1, 'Position name is required'),
  level: z.string().min(1, 'Position level is required'),
  departmentId: z.string().min(1, 'Department ID is required'),
})

export const updatePositionSchema = z.object({
  name: z.string().min(1, 'Position name is required').optional(),
  level: z.string().min(1, 'Position level is required').optional(),
  departmentId: z.string().min(1, 'Department ID is required').optional(),
  isActive: z.boolean().optional(),
})

// Company schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.string().url('Invalid URL').optional(),
})

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  website: z.string().url('Invalid URL').optional(),
  isActive: z.boolean().optional(),
})

// Query schemas
export const paginationSchema = z.object({
  page: z.string().nullable().optional().transform((val) => val ? Number(val) : 1),
  limit: z.string().nullable().optional().transform((val) => val ? Number(val) : 10),
  search: z.string().nullable().optional(),
  sortBy: z.string().nullable().optional(),
  sortOrder: z.enum(['asc', 'desc']).nullable().optional().transform((val) => val || 'desc'),
})

export const auditLogQuerySchema = z.object({
  ...paginationSchema.shape,
  action: z.string().optional(),
  entityType: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
})
