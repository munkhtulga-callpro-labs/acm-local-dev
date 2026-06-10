'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CodeRepositoryModal } from '@/components/code-repository-modal'
import {
  GitBranch,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Webhook
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface CodeRepositoryResource {
  id: string
  platform: string
  repositoryName: string
  organizationTeam: string
  accessLevel: string
  branchRestrictions?: string | null
  assignedTo?: string | null
  ownerDepartment?: string | null
  status: string
  notes?: string | null
  webhookAccess: boolean
  deploymentKeys?: string | null
  owner: string
  createdAt: string
}

export default function CodeRepositoriesPage() {
  const [codeRepositories, setCodeRepositories] = useState<CodeRepositoryResource[]>([])
  const [employees, setEmployees] = useState<Array<{ id: string; firstName: string; lastName: string; email: string }>>([])
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'view' | 'edit' | 'create'; codeRepository?: CodeRepositoryResource }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    fetchCodeRepositories()
    fetchEmployees()
    fetchDepartments()
  }, [])

  const fetchCodeRepositories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resources/code-repositories')
      if (response.ok) {
        const data = await response.json()
        setCodeRepositories(data.data || [])
      } else {
        setError('Failed to fetch code repositories')
      }
    } catch (error) {
      setError('Error fetching code repositories')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.data || data || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data || data || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const handleSaveCodeRepository = async (codeRepositoryData: Partial<CodeRepositoryResource>, owners?: any[]) => {
    try {
      if (modalState.mode === 'create') {
        const response = await fetch('/api/resources/code-repositories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(codeRepositoryData)
        })

        if (response.ok) {
          const data = await response.json()
          const resourceId = data.data?.id

          // Save resource owners
          if (resourceId && codeRepositoryData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: codeRepositoryData.owner },
              ...(owners || [])
            ]

            const ownersResponse = await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'CODE_REPOSITORY',
                resourceId: resourceId,
                owners: allOwners
              })
            })

            if (!ownersResponse.ok) {
              const ownersError = await ownersResponse.json()
              setError(`Code repository created but failed to save owners: ${ownersError.error || 'Unknown error'}`)
            }
          }

          setSuccess('Code repository added successfully')
          fetchCodeRepositories()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to add code repository')
          throw new Error(errorData.error || 'Failed to add code repository')
        }
      } else if (modalState.mode === 'edit' && modalState.codeRepository) {
        const response = await fetch(`/api/resources/code-repositories/${modalState.codeRepository.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(codeRepositoryData)
        })

        if (response.ok) {
          // Save resource owners
          if (codeRepositoryData.owner) {
            const allOwners = [
              { ownershipType: 'MAIN_OWNER', ownerEmail: codeRepositoryData.owner },
              ...(owners || [])
            ]

            await fetch('/api/resources/owners', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                resourceType: 'CODE_REPOSITORY',
                resourceId: modalState.codeRepository.id,
                owners: allOwners
              })
            })
          }

          setSuccess('Code repository updated successfully')
          fetchCodeRepositories()
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to update code repository')
          throw new Error(errorData.error || 'Failed to update code repository')
        }
      }
    } catch (error) {
      throw error
    }
  }

  const handleDeleteCodeRepository = async (id: string) => {
    if (!confirm('Are you sure you want to delete this code repository?')) return

    try {
      const response = await fetch(`/api/resources/code-repositories/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Code repository deleted successfully')
        fetchCodeRepositories()
      } else {
        setError('Failed to delete code repository')
      }
    } catch (error) {
      setError('Error deleting code repository')
    }
  }

  const filteredCodeRepositories = codeRepositories.filter(repo =>
    repo.repositoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.platform?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.organizationTeam?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.ownerDepartment?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPlatformBadge = (platform: string) => {
    const variants: Record<string, string> = {
      'GitHub': 'bg-orange-100 text-orange-800',
      'GitLab': 'bg-purple-100 text-purple-800',
      'Bitbucket': 'bg-blue-100 text-blue-800',
      'Azure DevOps': 'bg-cyan-100 text-cyan-800',
      'AWS CodeCommit': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    }
    return variants[platform] || 'bg-gray-100 text-gray-800'
  }

  const getAccessLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      'Read': 'bg-green-100 text-green-800',
      'Write': 'bg-blue-100 text-blue-800',
      'Admin': 'bg-red-100 text-red-800',
      'Maintain': 'bg-orange-100 text-orange-800',
      'Triage': 'bg-yellow-100 text-yellow-800'
    }
    return variants[level] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <GitBranch className="mr-3 h-8 w-8" />
          Code Repositories
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage GitHub, GitLab, and Bitbucket repository access - ISO 27001 Compliant
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search code repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
            <Plus className="mr-2 h-4 w-4" />
            Add Repository
          </Button>
        </div>
      </div>

      {/* Code Repositories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Code Repositories ({filteredCodeRepositories.length})</CardTitle>
          <CardDescription>
            Track and manage access to source code repositories across platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCodeRepositories.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Code Repositories Found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                Get started by adding your first code repository
              </p>
              <Button onClick={() => setModalState({ isOpen: true, mode: 'create' })}>
                <Plus className="mr-2 h-4 w-4" />
                Add Repository
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Organization/Team</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Branch Restrictions</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodeRepositories.map((repo) => (
                  <TableRow key={repo.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <GitBranch className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{repo.repositoryName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPlatformBadge(repo.platform)}>
                        {repo.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {repo.organizationTeam}
                    </TableCell>
                    <TableCell>
                      <Badge className={getAccessLevelBadge(repo.accessLevel)}>
                        {repo.accessLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {repo.branchRestrictions || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {repo.webhookAccess && (
                          <Badge variant="outline" className="text-xs">
                            <Webhook className="mr-1 h-3 w-3" /> Webhook
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {repo.assignedTo || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {repo.ownerDepartment || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={repo.status === 'ACTIVE' ? "default" : "secondary"}>
                        {repo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'view', codeRepository: repo })}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'edit', codeRepository: repo })}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCodeRepository(repo.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CodeRepositoryModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create' })}
        codeRepository={modalState.codeRepository}
        mode={modalState.mode}
        onSave={handleSaveCodeRepository}
        employees={employees}
        departments={departments}
      />
    </div>
  )
}
