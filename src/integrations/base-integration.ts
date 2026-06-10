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

export abstract class BaseIntegration {
  protected config: IntegrationConfig

  constructor(config: IntegrationConfig) {
    this.config = config
  }

  abstract provisionAccess({
    employeeId,
    email,
    accessLevel,
    firstName,
    lastName,
  }: {
    employeeId: string
    email: string
    accessLevel: string
    firstName: string
    lastName: string
  }): Promise<ProvisioningResult>

  abstract revokeAccess({
    employeeId,
    email,
  }: {
    employeeId: string
    email: string
  }): Promise<ProvisioningResult>

  abstract updateAccess({
    employeeId,
    email,
    accessLevel,
  }: {
    employeeId: string
    email: string
    accessLevel: string
  }): Promise<ProvisioningResult>

  abstract checkHealth(): Promise<boolean>

  protected async makeRequest({
    url,
    method = 'GET',
    headers = {},
    body,
  }: {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: any
  }): Promise<any> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Integration request failed:`, error)
      throw error
    }
  }

  protected async retryRequest<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        if (attempt === maxRetries) {
          throw lastError
        }
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError!
  }
}
