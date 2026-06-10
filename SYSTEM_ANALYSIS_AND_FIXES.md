# HR Access Control System - Complete Analysis & Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Current Implementation Status](#current-implementation-status)
3. [Critical Database Issues](#critical-database-issues)
4. [Permission System Design](#permission-system-design)
5. [Required Fixes](#required-fixes)
6. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview

**Purpose**: Comprehensive HR Access Control Management System for Onlime Network LLC and CallPro LLC with ISO 27001 compliance.

**Technology Stack**:
- **Frontend/Backend**: Next.js 16.0.0 (App Router), React 19.2.0, TypeScript 5
- **Database**: PostgreSQL 15+ with Prisma 6.18.0 ORM
- **Authentication**: NextAuth.js 4.24.11 (Google SSO + Credentials)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI
- **Background Jobs**: BullMQ + Redis (planned)
- **Email**: Nodemailer (planned)

**Core Features**:
- 12 Resource Types Management (Database, Server, Software License, SaaS, Cloud Account, Device, Internal Tool, VPN/Network, Code Repository, API Key, File Storage, Physical Access)
- Multi-owner resource management (Department, Main Owner, Secondary Owners)
- Access request and approval workflow
- Assignment tracking with expiry
- Audit logging (partially implemented)
- ISO 27001 compliance tracking

---

## Current Implementation Status

### ✅ **Phase 1: Core System (100% Complete)**
- [x] Authentication (Google SSO + Credentials)
- [x] User management with roles
- [x] Employee CRUD operations
- [x] Company & Department management
- [x] Position management
- [x] Basic access control structure
- [x] Old System-based access permissions

### 🚧 **Phase 2: Resource Access Management (70% Complete)**

**Completed**:
- [x] 12 resource type tables created
- [x] Resource CRUD operations for all types
- [x] Database resource modal updated (new ownership model)
- [x] ResourceOwner model for multi-owner support
- [x] ResourceAccessRequest workflow
- [x] ResourceApproval multi-level approval
- [x] ResourceAssignment tracking
- [x] Searchable employee combobox for Database modal
- [x] Request Access page with all 12 resource types
- [x] Approvals page (UI complete)
- [x] Access Control page (UI complete)

**Incomplete (30%)**:
- [ ] 11 resource modals still have old ISO 27001 fields (only Database updated)
- [ ] Approval workflow logic broken (see Critical Issues)
- [ ] Auto-assignment creation after approval
- [ ] Email notifications
- [ ] API provisioning for supported resources
- [ ] Manual task creation for non-API resources
- [ ] Comprehensive audit logging
- [ ] Access expiry automation
- [ ] Bulk operations

### 📋 **Phase 3: Advanced Features (0% Complete)**
- [ ] Self-service portal enhancements
- [ ] CallPro Teams bot integration
- [ ] Advanced reporting and analytics
- [ ] Mobile responsiveness improvements
- [ ] Export functionality (CSV/Excel/PDF)

### 📋 **Phase 4: Enterprise Features (0% Complete)**
- [ ] Additional SSO providers
- [ ] Advanced compliance features
- [ ] Performance optimization
- [ ] Multi-tenant support
- [ ] Scheduled background jobs

---

## Critical Database Issues

### 🚨 **Issue #1: Broken Foreign Key Relations**

**Problem**: All resource workflow tables use String fields instead of proper foreign key relations.

**Affected Models**:
```prisma
// ❌ NO FOREIGN KEYS TO Employee/User
model ResourceOwner {
  ownerId String?       // Should be FK to Employee.id
  ownerEmail String?    // Should be FK to User.email or Employee.email
}

model ResourceAccessRequest {
  requesterId String    // Should be FK to Employee.id
  requesterEmail String // Should be FK to Employee.email
  currentApproverId String? // Should be FK to User.email
}

model ResourceApproval {
  approverId String     // Should be FK to User.id or Employee.id
  approverEmail String  // Should be FK to User.email
}

model ResourceAssignment {
  assigneeId String     // Should be FK to Employee.id
  assigneeEmail String  // Should be FK to Employee.email
  grantedBy String      // Should be FK to User.id
}
```

**Impact**:
- ❌ Data integrity violations (can store non-existent employee IDs)
- ❌ Orphaned records when employees deleted
- ❌ No cascade delete/update support
- ❌ Inefficient queries (cannot use JOINs)
- ❌ Broken audit trail

**Solution**: Add proper FK relations in schema migration.

---

### 🚨 **Issue #2: Duplicate Resource Models**

**Problem**: Two sets of resource models exist simultaneously.

**Duplicates**:
| Old Model (Phase 1) | New Model (Phase 2) | Status |
|---------------------|---------------------|--------|
| `resources` table | - | ❌ Unused, should be removed |
| `devices` table | `resource_devices` table | ❌ Both exist, confusing |
| `servers` table | `resource_servers` table | ❌ Both exist, confusing |
| `databases` table | `resource_databases` table | ❌ Both exist, confusing |

**Impact**:
- ❌ Code confusion about which model to use
- ❌ Wasted database space
- ❌ Potential data inconsistency
- ❌ Migration complexity

**Solution**: Remove old models (Resource, Device, Server, Database) via migration.

---

### 🚨 **Issue #3: Denormalized ISO 27001 Fields**

**Problem**: All 12 resource models still have approval workflow fields that belong in ResourceAccessRequest/ResourceApproval.

**Duplicate Fields** (in ALL resource tables):
```prisma
requestedBy           String?   // ❌ Belongs in ResourceAccessRequest
approvedBy            String?   // ❌ Belongs in ResourceApproval
approvalDate          DateTime? // ❌ Belongs in ResourceApproval
businessJustification String?   // ❌ Belongs in ResourceAccessRequest
expiryDate            DateTime? // ❌ Belongs in ResourceAssignment
accessRequestTicketId String?   // ❌ Belongs in ResourceAccessRequest
```

**Impact**:
- ❌ Data duplication and inconsistency
- ❌ Workflow can be bypassed (set approvedBy without approval record)
- ❌ Harder to maintain single source of truth

**Solution**: Remove these fields from all resource models via migration.

---

### 🚨 **Issue #4: Missing Critical Relations**

**Missing Relations**:
```prisma
// 1. AccessPermission → AccessRequest (which request granted this?)
model AccessPermission {
  // MISSING:
  accessRequestId String?
  accessRequest AccessRequest? @relation(...)
}

// 2. ResourceAssignment → ResourceOwner (which owner approved?)
model ResourceAssignment {
  // MISSING:
  approvedByOwnerId String?
  approvedByOwner ResourceOwner? @relation(...)
}

// 3. AuditLog → ResourceAccessRequest (audit resource access events)
model AuditLog {
  // MISSING:
  resourceAccessRequestId String?
  resourceAccessRequest ResourceAccessRequest? @relation(...)
}

// 4. ManualTask → ResourceAccessRequest (link tasks to resource requests)
model ManualTask {
  // HAS accessRequestId but points to old AccessRequest
  // NEEDS: resourceAccessRequestId
}

// 5. COMPLETELY MISSING: EmailLog model
model EmailLog {
  id String @id
  templateId String
  template EmailTemplate @relation(...)
  resourceAccessRequestId String?
  resourceAccessRequest ResourceAccessRequest? @relation(...)
  sentTo String
  sentAt DateTime
  status String // SENT, FAILED, PENDING
  error String?
}
```

---

### 🚨 **Issue #5: Approvals Logic Broken**

**Problem**: When resource Primary Owner is updated, pending access requests still reference the old owner.

**Current Flow**:
1. User creates Database with Primary Owner = `alice@company.com`
2. ResourceOwner record created with `ownerEmail = alice@company.com`
3. Bob requests access → ResourceAccessRequest created with `currentApproverId = alice@company.com`
4. Admin edits Database, changes Primary Owner to `charlie@company.com`
5. ResourceOwner updated to `charlie@company.com`
6. **BUG**: ResourceAccessRequest still has `currentApproverId = alice@company.com`
7. Charlie logs in → Approvals menu empty (filtered by charlie's email)
8. Alice logs in → Still sees the request but she's no longer the owner

**Solutions**:
- **Option A**: Update `currentApproverId` when resource owners change (complex, many updates)
- **Option B**: Remove `currentApproverId` field, query ResourceOwner dynamically (preferred)
- **Option C**: Add versioning to ResourceOwner and track changes

---

## Permission System Design

### Current Roles (Incomplete)
```prisma
enum UserRole {
  ADMIN              // ✅ Exists
  HR_MANAGER         // ✅ Exists
  DEPARTMENT_MANAGER // ✅ Exists
  EMPLOYEE           // ✅ Exists
  IT_STAFF           // ✅ Exists
}
```

### **Proposed Complete Role System**
```prisma
enum UserRole {
  SUPER_ADMIN        // NEW: System configuration, can create admins
  ADMIN              // Full access to all features (company-scoped)
  RESOURCE_OWNER     // NEW: Implicit via ResourceOwner table
  APPROVER           // NEW: Implicit via ResourceOwner table
  HR_MANAGER         // Employee lifecycle, onboarding/offboarding
  DEPARTMENT_MANAGER // Department-level resource approvals
  IT_ADMIN           // NEW: Technical administration, API credentials
  IT_STAFF           // Execute provisioning tasks
  SECURITY_OFFICER   // NEW: Audit logs, compliance, security reviews
  AUDITOR            // NEW: Read-only audit logs and reports
  EMPLOYEE           // Basic access, can request resources
  READONLY           // NEW: View-only access for reports
}
```

### **Permission Implementation Strategy**

**1. Role-Based Permissions** (Table in [Permission Matrix](#-comprehensive-permission-matrix))

**2. Row-Level Security (RLS)**:
```typescript
// Middleware checks
function canViewResource(user: User, resource: Resource): boolean {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true
  if (user.role === 'RESOURCE_OWNER') {
    return isResourceOwner(user.email, resource.id, resource.type)
  }
  if (user.role === 'DEPARTMENT_MANAGER') {
    return resource.ownerDepartment === user.employee.department
  }
  return false
}

function canApproveRequest(user: User, request: ResourceAccessRequest): boolean {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true

  // Check if user is a resource owner
  const owners = await getResourceOwners(request.resourceType, request.resourceId)
  return owners.some(owner => owner.ownerEmail === user.email)
}
```

**3. Company-Scoped Data**:
```typescript
// Users can only see data from their company
async function getEmployees(user: User) {
  if (user.role === 'SUPER_ADMIN') {
    return prisma.employee.findMany() // All companies
  }
  return prisma.employee.findMany({
    where: { company: user.company } // Scoped to user's company
  })
}
```

---

## Required Fixes

### **Priority 1: Critical Workflow Fixes** (Week 1)

#### Fix 1.1: Approvals Logic
**File**: `/src/app/api/resources/access-requests/route.ts`

Change from cached `currentApproverId` to dynamic owner lookup:

```typescript
// GET /api/resources/access-requests?view=pending-approvals
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userEmail = session?.user?.email

  // ❌ OLD WAY: Filter by cached currentApproverId
  // const requests = await prisma.resourceAccessRequest.findMany({
  //   where: { currentApproverId: userEmail }
  // })

  // ✅ NEW WAY: Get requests for resources user owns
  const ownedResourceIds = await prisma.resourceOwner.findMany({
    where: {
      ownerEmail: userEmail,
      isActive: true
    },
    select: { resourceType: true, resourceId: true }
  })

  const requests = await prisma.resourceAccessRequest.findMany({
    where: {
      OR: ownedResourceIds.map(owner => ({
        resourceType: owner.resourceType,
        resourceId: owner.resourceId,
        status: 'PENDING'
      })),
      approvals: {
        some: {
          approverEmail: userEmail,
          status: 'PENDING'
        }
      }
    },
    include: { approvals: true }
  })

  return NextResponse.json({ data: requests })
}
```

#### Fix 1.2: Auto-Assignment After Approval
**File**: `/src/app/api/resources/approvals/[id]/route.ts`

```typescript
// POST /api/resources/approvals/:id/approve
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const body = await request.json()

  // Update approval status
  await prisma.resourceApproval.update({
    where: { id: params.id },
    data: {
      status: 'APPROVED',
      decision: 'APPROVED',
      comments: body.comments,
      decidedAt: new Date()
    }
  })

  // Get the request
  const approval = await prisma.resourceApproval.findUnique({
    where: { id: params.id },
    include: {
      request: {
        include: { approvals: true }
      }
    }
  })

  // ✅ NEW: Check if all required approvals are complete
  const allApproved = approval.request.approvals.every(
    a => a.status === 'APPROVED'
  )

  if (allApproved) {
    // Update request status
    await prisma.resourceAccessRequest.update({
      where: { id: approval.requestId },
      data: { status: 'APPROVED' }
    })

    // ✅ NEW: Create ResourceAssignment
    await prisma.resourceAssignment.create({
      data: {
        requestId: approval.requestId,
        resourceType: approval.request.resourceType,
        resourceId: approval.request.resourceId,
        resourceName: approval.request.resourceName,
        assigneeId: approval.request.requesterId,
        assigneeName: approval.request.requesterName,
        assigneeEmail: approval.request.requesterEmail,
        assigneeDepartment: approval.request.requesterDepartment,
        accessLevel: approval.request.accessLevel,
        accessDetails: approval.request.accessDetails,
        grantedBy: session.user.email,
        grantedAt: new Date(),
        validFrom: approval.request.validFrom || new Date(),
        validTo: approval.request.validTo,
        status: 'ACTIVE',
        isActive: true
      }
    })

    // ✅ NEW: Send email notification
    await sendAccessGrantedEmail({
      to: approval.request.requesterEmail,
      resourceName: approval.request.resourceName,
      resourceType: approval.request.resourceType,
      accessLevel: approval.request.accessLevel,
      validFrom: approval.request.validFrom,
      validTo: approval.request.validTo
    })

    // ✅ NEW: Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'GRANT_ACCESS',
        entityType: 'ResourceAssignment',
        entityId: assignment.id,
        userId: session.user.id,
        newValues: assignment,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent')
      }
    })
  }

  return NextResponse.json({ success: true })
}
```

#### Fix 1.3: Add Permission Middleware
**File**: `/src/middleware/permissions.ts` (NEW)

```typescript
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, company: true }
    })

    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return null // Continue
  }
}

export async function requireResourceOwner(resourceType: string, resourceId: string) {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions)

    // Admins can access everything
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return null // Continue
    }

    // Check if user is a resource owner
    const owner = await prisma.resourceOwner.findFirst({
      where: {
        resourceType,
        resourceId,
        ownerEmail: session.user.email,
        isActive: true
      }
    })

    if (!owner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return null // Continue
  }
}

// Usage in API routes:
// export const GET = requireRole(['ADMIN', 'HR_MANAGER'])(async (req) => { ... })
```

---

### **Priority 2: Update All Resource Modals** (Week 2)

Apply the Database modal pattern to all 11 remaining resources:

**Files to Update**:
1. `/src/components/server-modal.tsx`
2. `/src/components/software-license-modal.tsx`
3. `/src/components/saas-subscription-modal.tsx`
4. `/src/components/device-modal.tsx`
5. `/src/components/cloud-account-modal.tsx`
6. `/src/components/internal-tool-modal.tsx`
7. `/src/components/vpn-network-access-modal.tsx`
8. `/src/components/code-repository-modal.tsx`
9. `/src/components/api-key-modal.tsx`
10. `/src/components/file-storage-modal.tsx`
11. `/src/components/physical-access-modal.tsx`

**Changes for Each Modal**:
1. Remove ISO 27001 section (requestedBy, approvedBy, approvalDate, etc.)
2. Add Resource Ownership section with:
   - Primary Owner field using EmployeeCombobox
   - ResourceOwnerManager for additional owners
3. Add proper form reset in useEffect with `setOwners([])`

**Files to Update** (Parent pages):
1. `/src/app/(dashboard)/resources/servers/page.tsx`
2. (... and 10 others)

**Changes for Each Page**:
1. Fetch departments: `const [departments, setDepartments] = useState([])`
2. Fetch all employees: `fetch('/api/employees?limit=1000')`
3. Update save handler to combine Primary Owner + Additional Owners:
```typescript
const allOwners = [
  { ownershipType: 'MAIN_OWNER', ownerEmail: resourceData.owner },
  ...owners
]
await fetch('/api/resources/owners', {
  method: 'POST',
  body: JSON.stringify({
    resourceType: 'SERVER', // Change per resource
    resourceId: resource.id,
    owners: allOwners
  })
})
```

---

### **Priority 3: Schema Migration** (Week 3)

#### Step 1: Add Foreign Key Relations
**File**: `prisma/migrations/YYYYMMDD_add_fk_relations/migration.sql`

```sql
-- Add FK from ResourceOwner to Employee
ALTER TABLE resource_owners
ADD COLUMN owner_employee_id VARCHAR;

-- Populate from ownerEmail (match to employees table)
UPDATE resource_owners ro
SET owner_employee_id = e.id
FROM employees e
WHERE ro.owner_email = e.email;

-- Add FK constraint
ALTER TABLE resource_owners
ADD CONSTRAINT fk_resource_owner_employee
FOREIGN KEY (owner_employee_id)
REFERENCES employees(id)
ON DELETE SET NULL;

-- Add FK from ResourceAccessRequest to Employee
ALTER TABLE resource_access_requests
ADD COLUMN requester_employee_id VARCHAR;

UPDATE resource_access_requests rar
SET requester_employee_id = e.id
FROM employees e
WHERE rar.requester_email = e.email;

ALTER TABLE resource_access_requests
ADD CONSTRAINT fk_request_employee
FOREIGN KEY (requester_employee_id)
REFERENCES employees(id)
ON DELETE CASCADE;

-- Add FK from ResourceApproval to Employee
ALTER TABLE resource_approvals
ADD COLUMN approver_employee_id VARCHAR;

UPDATE resource_approvals ra
SET approver_employee_id = e.id
FROM employees e
WHERE ra.approver_email = e.email;

ALTER TABLE resource_approvals
ADD CONSTRAINT fk_approval_employee
FOREIGN KEY (approver_employee_id)
REFERENCES employees(id)
ON DELETE CASCADE;

-- Add FK from ResourceAssignment to Employee
ALTER TABLE resource_assignments
ADD COLUMN assignee_employee_id VARCHAR;

UPDATE resource_assignments ra
SET assignee_employee_id = e.id
FROM employees e
WHERE ra.assignee_email = e.email;

ALTER TABLE resource_assignments
ADD CONSTRAINT fk_assignment_employee
FOREIGN KEY (assignee_employee_id)
REFERENCES employees(id)
ON DELETE CASCADE;
```

#### Step 2: Remove Duplicate Models
```sql
-- Migrate data from old models to new (if any exists)
-- Then drop old tables
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS servers;
DROP TABLE IF EXISTS databases;
```

#### Step 3: Remove ISO 27001 Fields from Resource Models
```sql
-- Remove from all 12 resource tables
ALTER TABLE resource_databases
DROP COLUMN IF EXISTS requested_by,
DROP COLUMN IF EXISTS approved_by,
DROP COLUMN IF EXISTS approval_date,
DROP COLUMN IF EXISTS business_justification,
DROP COLUMN IF EXISTS expiry_date,
DROP COLUMN IF EXISTS review_date,
DROP COLUMN IF EXISTS access_request_ticket_id;

-- Repeat for all resource tables...
```

---

### **Priority 4: Audit Logging** (Week 4)

#### Create Audit Logger Utility
**File**: `/src/lib/audit-logger.ts` (NEW)

```typescript
import { prisma } from './prisma'

interface AuditLogOptions {
  action: string
  entityType: string
  entityId: string
  userId?: string
  employeeId?: string
  oldValues?: any
  newValues?: any
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(options: AuditLogOptions) {
  return prisma.auditLog.create({
    data: {
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      userId: options.userId,
      employeeId: options.employeeId,
      oldValues: options.oldValues,
      newValues: options.newValues,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      createdAt: new Date()
    }
  })
}

// Actions enum
export const AuditAction = {
  // Resource actions
  CREATE_RESOURCE: 'CREATE_RESOURCE',
  UPDATE_RESOURCE: 'UPDATE_RESOURCE',
  DELETE_RESOURCE: 'DELETE_RESOURCE',

  // Access request actions
  CREATE_ACCESS_REQUEST: 'CREATE_ACCESS_REQUEST',
  CANCEL_ACCESS_REQUEST: 'CANCEL_ACCESS_REQUEST',

  // Approval actions
  APPROVE_REQUEST: 'APPROVE_REQUEST',
  REJECT_REQUEST: 'REJECT_REQUEST',
  DELEGATE_APPROVAL: 'DELEGATE_APPROVAL',

  // Assignment actions
  GRANT_ACCESS: 'GRANT_ACCESS',
  REVOKE_ACCESS: 'REVOKE_ACCESS',
  EXTEND_ACCESS: 'EXTEND_ACCESS',
  MODIFY_ACCESS: 'MODIFY_ACCESS',

  // User actions
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  CHANGE_ROLE: 'CHANGE_ROLE',

  // Employee actions
  CREATE_EMPLOYEE: 'CREATE_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',

  // System actions
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_API_CREDENTIAL: 'UPDATE_API_CREDENTIAL'
}
```

#### Add to All CRUD Operations
Example for databases:
```typescript
// In /src/app/api/resources/databases/route.ts
import { createAuditLog, AuditAction } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  // ... create database ...

  await createAuditLog({
    action: AuditAction.CREATE_RESOURCE,
    entityType: 'ResourceDatabase',
    entityId: database.id,
    userId: session.user.id,
    newValues: database,
    ipAddress: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent')
  })
}
```

---

## Implementation Roadmap

### **Sprint 1: Fix Critical Workflow (5 days)**
- [ ] Day 1: Fix Approvals logic (dynamic owner lookup)
- [ ] Day 2: Implement auto-assignment after approval
- [ ] Day 3: Add email notification system
- [ ] Day 4: Create permission middleware
- [ ] Day 5: Test end-to-end workflow

### **Sprint 2: Update All Resource Types (7 days)**
- [ ] Day 1-2: Update Server, Software License, SaaS modals
- [ ] Day 3-4: Update Device, Cloud Account, Internal Tool modals
- [ ] Day 5-6: Update VPN, Code Repo, API Key, File Storage, Physical Access modals
- [ ] Day 7: Test all resource types

### **Sprint 3: Database Schema Fixes (5 days)**
- [ ] Day 1: Create and test FK relations migration
- [ ] Day 2: Remove duplicate models migration
- [ ] Day 3: Remove ISO 27001 fields migration
- [ ] Day 4: Update all API endpoints for new schema
- [ ] Day 5: Full regression testing

### **Sprint 4: Audit & Permissions (5 days)**
- [ ] Day 1-2: Implement comprehensive audit logging
- [ ] Day 3-4: Add role-based permissions to all endpoints
- [ ] Day 5: Test permissions and audit logs

### **Sprint 5: UX Improvements (5 days)**
- [ ] Day 1: Add tooltips to all complex fields
- [ ] Day 2: Standardize badge colors and add loading states
- [ ] Day 3: Make dashboard cards clickable
- [ ] Day 4: Add bulk operations
- [ ] Day 5: Form validation improvements

### **Sprint 6: Reporting & Export (5 days)**
- [ ] Day 1-2: CSV/Excel export for all entities
- [ ] Day 3: Compliance reports
- [ ] Day 4: Access review reports
- [ ] Day 5: Dashboard analytics

**Total Estimated Time**: 32 days (6-7 weeks)

---

## Testing Checklist

### **Workflow Testing**
- [ ] Create resource with owners
- [ ] Edit resource and change Primary Owner
- [ ] Request access to resource
- [ ] Owner receives approval notification
- [ ] Owner approves request
- [ ] Assignment automatically created
- [ ] Requester receives access granted email
- [ ] Access appears in Access Control menu
- [ ] Audit log records all actions
- [ ] Access expires correctly
- [ ] Access can be revoked

### **Permission Testing**
- [ ] SUPER_ADMIN can access everything
- [ ] ADMIN can access company-scoped data only
- [ ] RESOURCE_OWNER can only see/approve own resources
- [ ] HR_MANAGER can manage employees
- [ ] DEPARTMENT_MANAGER can approve department resources
- [ ] EMPLOYEE can only request access and view own data
- [ ] READONLY can view reports only

### **Edge Cases**
- [ ] Employee deleted with pending approvals
- [ ] Resource deleted with active assignments
- [ ] Multiple owners approve same request
- [ ] Owner delegates approval
- [ ] Admin overrides approval
- [ ] Access expired but not revoked
- [ ] Bulk approval of 50+ requests

---

## Appendix: Complete Permission Matrix

[See detailed table in main analysis above]

---

**Document Version**: 1.0
**Last Updated**: 2025-10-29
**Author**: Claude (AI Assistant)
**Status**: ✅ Complete Analysis
