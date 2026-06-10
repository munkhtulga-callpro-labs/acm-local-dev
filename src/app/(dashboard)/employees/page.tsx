'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmployeesDataTable, Employee } from '@/components/employees-data-table'
import { EmployeeModal } from '@/components/employee-modal'

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('create')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>()

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
    fetchCompanies()
    fetchPositions()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      // Fetch all employees without pagination
      const response = await fetch('/api/employees?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.data || [])
      } else {
        setError('Failed to fetch employees')
      }
    } catch (error) {
      setError('Error fetching employees')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data.data || data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/positions')
      if (response.ok) {
        const data = await response.json()
        setPositions(data.data || data)
      }
    } catch (error) {
      console.error('Error fetching positions:', error)
    }
  }

  const handleCreateEmployee = () => {
    setSelectedEmployee(undefined)
    setModalMode('create')
    setIsModalOpen(true)
  }

  const handleSaveEmployee = async (employeeData: Partial<Employee>) => {
    try {
      if (modalMode === 'create') {
        const response = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        })
        
        if (!response.ok) {
          throw new Error('Failed to create employee')
        }
        
        setSuccess('Employee created successfully!')
        fetchEmployees() // Refresh the list
      } else if (modalMode === 'edit' && selectedEmployee) {
        const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(employeeData),
        })
        
        if (!response.ok) {
          throw new Error('Failed to update employee')
        }
        
        setSuccess('Employee updated successfully!')
        fetchEmployees() // Refresh the list
      }
    } catch (error) {
      setError('Failed to save employee')
      console.error('Error saving employee:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
          <p className="text-muted-foreground">Manage employee access and permissions</p>
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

        {/* Employees Table */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Employees ({employees.length})</CardTitle>
            <CardDescription>Manage employee information and access</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No employees found</div>
            ) : (
              <EmployeesDataTable data={employees} onAddEmployee={handleCreateEmployee} />
            )}
          </CardContent>
        </Card>

        {/* Employee Modal */}
        <EmployeeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employee={selectedEmployee}
          mode={modalMode}
          onSave={handleSaveEmployee}
          companies={companies}
          departments={departments}
          positions={positions}
        />
      </div>
  )
}
