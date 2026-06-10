import { User, Employee, System, AccessPermission, AccessRequest, Approval, AuditLog, ManualTask, EmailTemplate as PrismaEmailTemplate } from '@prisma/client'

// Extended types with relations
export type UserWithRelations = User & {
  employee?: Employee
  createdUsers?: User[]
}

export type EmployeeWithRelations = Employee & {
  user: User
  accessPermissions?: AccessPermission[]
  accessRequests?: AccessRequest[]
}

export type SystemWithRelations = System & {
  accessPermissions?: AccessPermission[]
  accessRequests?: AccessRequest[]
  apiCredentials?: any[]
  manualTasks?: ManualTask[]
}

export type AccessPermissionWithRelations = AccessPermission & {
  employee: Employee
  system: System
}

export type AccessRequestWithRelations = AccessRequest & {
  employee: Employee
  systems?: any[]
  approvals?: Approval[]
}

export type ApprovalWithRelations = Approval & {
  accessRequest: AccessRequest
}

export type AuditLogWithRelations = AuditLog & {
  user?: User
  employee?: Employee
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard types
export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  pendingRequests: number
  expiringAccess: number
  recentActivity: AuditLogWithRelations[]
}

export interface AccessMatrix {
  employee: Employee
  systems: {
    system: System
    permission?: AccessPermission
  }[]
}

// Excel Import types
export interface ExcelRow {
  department: string
  accessSystem: string
  systems: string
  users: string
  accessLevel: string
  location: string
  createdBy: string
}

export interface ImportResult {
  success: number
  errors: number
  warnings: number
  details: {
    row: number
    message: string
    type: 'success' | 'error' | 'warning'
  }[]
}

// Email types
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface EmailData {
  to: string
  subject: string
  template: string
  variables: Record<string, string>
}

// Integration types
export interface IntegrationConfig {
  systemId: string
  credentials: Record<string, string>
  settings: Record<string, any>
}

export interface ProvisioningResult {
  success: boolean
  systemId: string
  userId: string
  accessLevel: string
  credentials?: Record<string, string>
  error?: string
}

// Approval workflow types
export interface ApprovalStep {
  step: number
  role: string
  condition?: string
  isRequired: boolean
}

export interface ApprovalWorkflow {
  id: string
  name: string
  description?: string
  steps: ApprovalStep[]
  isActive: boolean
}

// Notification types
export interface NotificationData {
  type: 'approval_required' | 'access_granted' | 'access_revoked' | 'expiry_reminder'
  userId: string
  data: Record<string, any>
}

// Search and filter types
export interface SearchFilters {
  search?: string
  department?: string
  company?: string
  role?: string
  isActive?: boolean
  startDate?: Date
  endDate?: Date
}

export interface AccessRequestFilters extends SearchFilters {
  status?: string
  requestType?: string
  priority?: string
}

export interface AuditLogFilters extends SearchFilters {
  action?: string
  entityType?: string
  userId?: string
}

// Form types
export interface AccessRequestForm {
  employeeId: string
  requestType: string
  title: string
  description?: string
  priority: string
  systems: {
    systemId: string
    accessLevel: string
    isRequired: boolean
  }[]
}

export interface EmployeeForm {
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  department: string
  position: string
  manager?: string
  company?: string
  startDate: Date
}

export interface SystemForm {
  name: string
  description?: string
  category: string
  hasApi: boolean
  apiEndpoint?: string
  requiresManual: boolean
}

// Job queue types
export interface JobData {
  type: string
  payload: Record<string, any>
  priority?: number
  delay?: number
}

export interface EmailJobData extends JobData {
  type: 'send_email'
  payload: {
    to: string
    subject: string
    template: string
    variables: Record<string, string>
  }
}

export interface ProvisioningJobData extends JobData {
  type: 'provision_access'
  payload: {
    requestId: string
    systemId: string
    employeeId: string
    accessLevel: string
  }
}

export interface ExpiryCheckJobData extends JobData {
  type: 'check_expiry'
  payload: {
    days: number
  }
}
