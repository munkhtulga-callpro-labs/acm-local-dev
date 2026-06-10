import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ExcelParser } from '@/utils/excel-parser'
import { AuditService } from '@/services/audit-service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = ExcelParser.parseFile(buffer)

    const results = {
      success: 0,
      errors: 0,
      warnings: 0,
      details: [] as Array<{
        row: number
        message: string
        type: 'success' | 'error' | 'warning'
      }>,
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const validation = ExcelParser.validateRow(row, i)

      if (validation) {
        results.errors++
        results.details.push(validation)
        continue
      }

      try {
        const { employees, systems, departments } = ExcelParser.processImportData([row])

        // Create systems if they don't exist
        for (const systemName of systems) {
          await prisma.system.upsert({
            where: { name: systemName },
            update: {},
            create: {
              name: systemName,
              description: `Imported system: ${systemName}`,
              category: 'OTHER',
              hasApi: false,
              requiresManual: true,
            },
          })
        }

        // Create departments if they don't exist
        // Note: Using a default company for imported departments
        const defaultCompany = 'CallPro LLC'

        for (const departmentName of departments) {
          await prisma.department.upsert({
            where: {
              name_company: {
                name: departmentName,
                company: defaultCompany
              }
            },
            update: {},
            create: {
              name: departmentName,
              company: defaultCompany,
              description: `Imported department: ${departmentName}`,
            },
          })
        }

        // Create employees and their access
        for (const employeeData of employees) {
          // Check if user already exists
          let user = await prisma.user.findUnique({
            where: { email: employeeData.email },
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                name: employeeData.name,
                email: employeeData.email,
                role: 'EMPLOYEE',
              },
            })
          }

          // Create or update employee record
          const employee = await prisma.employee.upsert({
            where: { employeeId: employeeData.email }, // Using email as employee ID for import
            update: {
              department: employeeData.department,
            },
            create: {
              employeeId: employeeData.email,
              firstName: employeeData.name.split(' ')[0],
              lastName: employeeData.name.split(' ').slice(1).join(' '),
              email: employeeData.email,
              department: employeeData.department,
              position: 'Employee',
              startDate: new Date(),
              userId: user.id,
            },
          })

          // Create access permissions
          for (const systemAccess of employeeData.systems) {
            const system = await prisma.system.findUnique({
              where: { name: systemAccess.system },
            })

            if (system) {
              await prisma.accessPermission.upsert({
                where: {
                  employeeId_systemId: {
                    employeeId: employee.id,
                    systemId: system.id,
                  },
                },
                update: {
                  accessLevel: systemAccess.accessLevel,
                  isActive: true,
                },
                create: {
                  employeeId: employee.id,
                  systemId: system.id,
                  accessLevel: systemAccess.accessLevel,
                  grantedBy: session.user.id,
                },
              })
            }
          }

          results.success++
          results.details.push({
            row: i + 1,
            message: `Successfully imported ${employeeData.name}`,
            type: 'success',
          })
        }
      } catch (error) {
        results.errors++
        results.details.push({
          row: i + 1,
          message: `Error processing row: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
        })
      }
    }

    // Log the import action
    await AuditService.logAction({
      action: 'IMPORT_EMPLOYEES',
      entityType: 'Employee',
      entityId: 'bulk_import',
      newValues: { results },
      userId: session.user.id,
    })

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Error importing employees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const template = ExcelParser.generateTemplate()
    
    return new NextResponse(template as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="access_control_template.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
