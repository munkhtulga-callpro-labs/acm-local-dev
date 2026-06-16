export const USER_ROLES = {
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  DEPARTMENT_MANAGER: 'DEPARTMENT_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
  IT_STAFF: 'IT_STAFF',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export const USER_ROLE_VALUES = Object.values(USER_ROLES) as [UserRole, ...UserRole[]]

export const PRIVILEGED_ROLES: Set<UserRole> = new Set([USER_ROLES.ADMIN, USER_ROLES.IT_STAFF])

export const isPrivilegedRole = (role: string): boolean => {
  return PRIVILEGED_ROLES.has(role as UserRole)
}
