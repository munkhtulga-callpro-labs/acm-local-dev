import { BaseIntegration, IntegrationConfig, ProvisioningResult } from './base-integration'

export class CallProTeamsIntegration extends BaseIntegration {
  private apiUrl: string
  private apiKey: string

  constructor(config: IntegrationConfig) {
    super(config)
    this.apiUrl = process.env.CALLPRO_TEAMS_API_URL || 'https://teams.callpro.mn/api'
    this.apiKey = process.env.CALLPRO_TEAMS_API_KEY || ''
  }

  async provisionAccess({
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
  }): Promise<ProvisioningResult> {
    try {
      // Add user to CallPro Teams
      const userData = {
        employeeId,
        email,
        firstName,
        lastName,
        accessLevel,
        department: 'IT', // This would be passed from the request
        company: 'CallPro LLC', // This would be determined from employee data
      }

      const response = await this.makeRequest({
        url: `${this.apiUrl}/users`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: userData,
      })

      return {
        success: true,
        systemId: this.config.systemId,
        userId: employeeId,
        accessLevel,
        credentials: {
          email,
          teamsUserId: response.data?.id,
        },
      }
    } catch (error) {
      return {
        success: false,
        systemId: this.config.systemId,
        userId: employeeId,
        accessLevel,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async revokeAccess({
    employeeId,
    email,
  }: {
    employeeId: string
    email: string
  }): Promise<ProvisioningResult> {
    try {
      // Remove user from CallPro Teams
      await this.makeRequest({
        url: `${this.apiUrl}/users/${employeeId}`,
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      return {
        success: true,
        systemId: this.config.systemId,
        userId: employeeId,
        accessLevel: 'REVOKED',
      }
    } catch (error) {
      return {
        success: false,
        systemId: this.config.systemId,
        userId: employeeId,
        accessLevel: 'UNKNOWN',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async updateAccess({
    employeeId,
    email,
    accessLevel,
  }: {
    employeeId: string
    email: string
    accessLevel: string
  }): Promise<ProvisioningResult> {
    try {
      // Update user permissions in CallPro Teams
      const updateData = {
        accessLevel,
        updatedAt: new Date().toISOString(),
      }

      await this.makeRequest({
        url: `${this.apiUrl}/users/${employeeId}`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: updateData,
      })

      return {
        success: true,
        systemId: this.config.systemId,
        userId: employeeId,
        accessLevel,
      }
    } catch (error) {
      return {
        success: false,
        systemId: this.config.systemId,
        userId: employeeId,
        accessLevel,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async sendNotification({
    userId,
    message,
    type = 'info',
  }: {
    userId: string
    message: string
    type?: 'info' | 'warning' | 'error' | 'success'
  }): Promise<boolean> {
    try {
      const notificationData = {
        userId,
        message,
        type,
        timestamp: new Date().toISOString(),
      }

      await this.makeRequest({
        url: `${this.apiUrl}/notifications`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: notificationData,
      })

      return true
    } catch (error) {
      console.error('Failed to send CallPro Teams notification:', error)
      return false
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Check CallPro Teams API health
      const response = await this.makeRequest({
        url: `${this.apiUrl}/health`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      return response.status === 'healthy'
    } catch (error) {
      console.error('CallPro Teams health check failed:', error)
      return false
    }
  }
}
