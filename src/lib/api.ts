export const API = {
  employees: {
    list: '/api/employees',
    detail: (id: string) => `/api/employees/${id}`,
    import: '/api/employees/import',
  },

  companies: {
    list: '/api/companies',
    detail: (id: string) => `/api/companies/${id}`,
  },

  departments: {
    list: '/api/departments',
    detail: (id: string) => `/api/departments/${id}`,
  },

  positions: {
    list: '/api/positions',
  },

  systems: {
    list: '/api/systems',
    detail: (id: string) => `/api/systems/${id}`,
  },

  requests: {
    list: '/api/requests',
    detail: (id: string) => `/api/requests/${id}`,
    approve: (id: string) => `/api/requests/${id}/approve`,
  },

  auditLogs: {
    list: '/api/audit-logs',
    byEntity: (entityType: string, entityId: string) =>
      `/api/audit-logs?entityType=${entityType}&entityId=${entityId}`,
  },

  dashboard: '/api/dashboard',

  resources: {
    catalog: '/api/resources/catalog',
    owners: {
      list: '/api/resources/owners',
      byResource: (resourceType: string, resourceId: string) =>
        `/api/resources/owners?resourceType=${resourceType}&resourceId=${resourceId}`,
    },
    assignments: {
      list: '/api/resources/assignments',
      byAssignee: (email: string) =>
        `/api/resources/assignments?assigneeEmail=${email}`,
    },
    accessRequests: {
      list: '/api/resources/access-requests',
      pendingApprovals: '/api/resources/access-requests?view=pending-approvals',
      approve: (id: string) => `/api/resources/access-requests/${id}/approve`,
    },

    cloudAccounts: {
      list: '/api/resources/cloud-accounts',
      detail: (id: string) => `/api/resources/cloud-accounts/${id}`,
    },
    databases: {
      list: '/api/resources/databases',
      detail: (id: string) => `/api/resources/databases/${id}`,
    },
    servers: {
      list: '/api/resources/servers',
      detail: (id: string) => `/api/resources/servers/${id}`,
    },
    devices: {
      list: '/api/resources/devices',
      detail: (id: string) => `/api/resources/devices/${id}`,
    },
    softwareLicenses: {
      list: '/api/resources/software-licenses',
      detail: (id: string) => `/api/resources/software-licenses/${id}`,
    },
    saasSubscriptions: {
      list: '/api/resources/saas-subscriptions',
      detail: (id: string) => `/api/resources/saas-subscriptions/${id}`,
    },
    codeRepositories: {
      list: '/api/resources/code-repositories',
      detail: (id: string) => `/api/resources/code-repositories/${id}`,
    },
    internalTools: {
      list: '/api/resources/internal-tools',
      detail: (id: string) => `/api/resources/internal-tools/${id}`,
    },
    vpnNetworkAccess: {
      list: '/api/resources/vpn-network-access',
      detail: (id: string) => `/api/resources/vpn-network-access/${id}`,
    },
    apiKeys: {
      list: '/api/resources/api-keys',
      detail: (id: string) => `/api/resources/api-keys/${id}`,
    },
    fileStorage: {
      list: '/api/resources/file-storage',
      detail: (id: string) => `/api/resources/file-storage/${id}`,
    },
    physicalAccess: {
      list: '/api/resources/physical-access',
      detail: (id: string) => `/api/resources/physical-access/${id}`,
    },
  },
} as const
