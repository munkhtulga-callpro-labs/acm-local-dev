import { BaseIntegration, IntegrationConfig, ProvisioningResult } from './base-integration'

export class MondayIntegration extends BaseIntegration {
  private apiKey: string
  private boardId: string

  constructor(config: IntegrationConfig) {
    super(config)
    this.apiKey = process.env.MONDAY_API_KEY || ''
    this.boardId = process.env.MONDAY_BOARD_ID || ''
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
      // Add user to Monday.com board
      const userData = {
        query: `
          mutation {
            add_users_to_board(
              board_id: ${this.boardId},
              user_ids: [${employeeId}]
            ) {
              id
            }
          }
        `,
      }

      const response = await this.makeRequest({
        url: 'https://api.monday.com/v2',
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
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
          boardId: this.boardId,
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
      // Remove user from Monday.com board
      const userData = {
        query: `
          mutation {
            remove_users_from_board(
              board_id: ${this.boardId},
              user_ids: [${employeeId}]
            ) {
              id
            }
          }
        `,
      }

      await this.makeRequest({
        url: 'https://api.monday.com/v2',
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
        },
        body: userData,
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
      // Update user permissions in Monday.com
      console.log('Updating Monday.com user permissions:', { email, accessLevel })
      
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

  async checkHealth(): Promise<boolean> {
    try {
      // Check Monday.com API health
      const response = await this.makeRequest({
        url: 'https://api.monday.com/v2',
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
        },
        body: {
          query: '{ me { id } }',
        },
      })

      return response.data?.me?.id ? true : false
    } catch (error) {
      console.error('Monday.com health check failed:', error)
      return false
    }
  }
}
