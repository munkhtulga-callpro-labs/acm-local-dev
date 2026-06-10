# Permission System Analysis & Issues

## Current Status: ⚠️ INCOMPLETE - No Authorization Middleware

---

## 🚨 Critical Issues Found

### Issue #1: No Permission Middleware ❌
**Status**: NOT IMPLEMENTED

**Problem**: Currently, the system only has **authentication** (checking if user is logged in) but NO **authorization** (checking if user has permission to perform actions).

**Impact**:
- ✅ Users must login (authentication works)
- ❌ But ANY logged-in user can access ANY API endpoint
- ❌ Regular employees can access admin-only endpoints
- ❌ Users can modify resources they don't own
- ❌ No role-based access control enforced

**Current Implementation**:
```typescript
// Most API routes only check if user is logged in
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Then they proceed with the action - NO ROLE CHECK! ❌
```

**What's Missing**:
```typescript
// Should have:
if (!canPerformAction(session.user.role, 'CREATE_RESOURCE')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

### Issue #2: Approval Sync Problem (FIXED) ✅

**Problem**: When resource ownership changes (add/remove owners), existing pending requests don't update their approval records.

**Example Scenario**:
1. Resource has Primary Owner: Alice
2. Bob requests access → Approval created for Alice
3. Admin adds Charlie as Secondary Owner
4. **BUG**: No approval record created for Charlie (he can't approve Bob's pending request)

**Root Cause**: Approval records are created at request time and never synced with ownership changes.

**Immediate Fix Applied** (for berjan@callpro.mn):
- Manually created approval record in database
- You should now see the request in your Approvals menu

**Proper Solution Needed**:
- Option A: When ownership changes, create/remove approval records for pending requests
- Option B: When ownership changes, notify pending requesters to resubmit
- Option C: Dynamic approval lookup (query owners at approval time, not request time)

---

## 📊 Current Permission Implementation

### What EXISTS:

#### 1. **User Roles** (in database)
```typescript
enum UserRole {
  ADMIN              // ✅ Defined
  HR_MANAGER         // ✅ Defined
  DEPARTMENT_MANAGER // ✅ Defined
  EMPLOYEE           // ✅ Defined
  IT_STAFF           // ✅ Defined
}
```

#### 2. **Session Management** ✅
- NextAuth.js with JWT strategy
- User role stored in JWT token
- Session includes: id, email, name, role, company

```typescript
// src/lib/auth.ts - JWT callback
async jwt({ token, user }) {
  if (user) {
    token.role = user.role
    token.company = user.company
    token.id = user.id
  }
  return token
}
```

#### 3. **Basic Role Checks** (Partial)
Some endpoints have basic role checks:

```typescript
// Example from dashboard API
if (session.user.role === 'ADMIN') {
  accessMatrix = await AccessService.getAccessMatrix()
}
```

**But this is inconsistent** - most endpoints don't have any checks!

---

### What DOESN'T EXIST:

#### 1. **Permission Middleware** ❌
**File**: `/src/middleware/permissions.ts` - **DOES NOT EXIST**

Should have:
```typescript
// MISSING - Should be created
export async function requireRole(allowedRoles: UserRole[]) {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions)
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return null // Continue
  }
}

// Usage:
export const POST = requireRole(['ADMIN', 'HR_MANAGER'])(async (req) => {
  // Create employee
})
```

#### 2. **Permission Checking Utility** ❌
**File**: `/src/lib/permissions.ts` - **DOES NOT EXIST**

Should have:
```typescript
// MISSING - Should be created
export function canCreateResource(userRole: UserRole): boolean {
  return ['ADMIN', 'IT_STAFF'].includes(userRole)
}

export function canApproveRequest(userRole: UserRole, request: any): boolean {
  // Check if user is resource owner
  return isResourceOwner(userEmail, request.resourceId)
}

export function canViewAuditLogs(userRole: UserRole): boolean {
  return ['ADMIN', 'SECURITY_OFFICER', 'AUDITOR'].includes(userRole)
}
```

#### 3. **Row-Level Security** ❌
No checks for company-scoped data:

```typescript
// MISSING - Should check company scope
const employees = await prisma.employee.findMany({
  where: {
    company: session.user.company // ❌ Not implemented
  }
})
```

#### 4. **Resource Ownership Checks** ❌
No verification that user owns resource before modifying:

```typescript
// MISSING - Should verify ownership
const isOwner = await prisma.resourceOwner.findFirst({
  where: {
    resourceId: id,
    ownerEmail: session.user.email
  }
})

if (!isOwner && session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 🎯 Permission Matrix (From SYSTEM_ANALYSIS_AND_FIXES.md)

### What SHOULD Be Implemented:

| Feature | ADMIN | RESOURCE_OWNER | HR_MANAGER | DEPT_MANAGER | IT_STAFF | EMPLOYEE |
|---------|-------|----------------|------------|--------------|----------|----------|
| **Resources** |
| Create resource | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Edit resource | ✅ | ⚠️ Own only | ❌ | ❌ | ✅ | ❌ |
| Delete resource | ✅ | ❌ | ❌ | ❌ | ⚠️ Non-prod | ❌ |
| View all resources | ✅ | ⚠️ Own only | ❌ | ❌ | ✅ | ❌ |
| **Access Requests** |
| Create request | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own requests | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all requests | ✅ | ❌ | ✅ | ⚠️ Dept only | ✅ | ❌ |
| Cancel any request | ✅ | ❌ | ⚠️ Own company | ❌ | ❌ | ❌ |
| **Approvals** |
| Approve request | ✅ | ⚠️ Own resources | ❌ | ⚠️ Dept resources | ⚠️ Technical | ❌ |
| Reject request | ✅ | ⚠️ Own resources | ❌ | ⚠️ Dept resources | ⚠️ Technical | ❌ |
| Override approval | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Logs** |
| View audit logs | ✅ | ❌ | ⚠️ HR actions | ❌ | ⚠️ IT actions | ❌ |
| Export audit logs | ✅ | ❌ | ⚠️ HR data | ❌ | ❌ | ❌ |

**Legend**: ✅ Full access | ❌ No access | ⚠️ Conditional access

---

## 🔧 How Permission System CURRENTLY Works

### Authentication Flow (✅ WORKS):
```
1. User logs in (Google SSO or credentials)
   ↓
2. NextAuth creates JWT token with { id, email, role, company }
   ↓
3. Token stored in cookie
   ↓
4. Every API request includes cookie
   ↓
5. API calls getServerSession(authOptions)
   ↓
6. Session object has: { user: { id, email, role, company } }
```

### Authorization Flow (❌ BROKEN):
```
Current (Insecure):
1. API checks if session exists
2. ✅ If yes → Proceed with action
3. ❌ If no → Return 401 Unauthorized

Should Be (Secure):
1. API checks if session exists
2. ❌ If no → Return 401 Unauthorized
3. ✅ If yes → Check if role has permission
4. ❌ If forbidden → Return 403 Forbidden
5. ✅ If allowed → Proceed with action
```

---

## 🐛 Real-World Permission Issues

### Issue #1: Employee Can Create Resources
**Current Behavior**:
```bash
# berjan@callpro.mn (role: EMPLOYEE) can:
POST /api/resources/databases  # ✅ Works (should be ❌ forbidden)
POST /api/resources/servers    # ✅ Works (should be ❌ forbidden)
```

**Should Be**:
```bash
# Only ADMIN and IT_STAFF should be able to create resources
POST /api/resources/databases  # ❌ 403 Forbidden for EMPLOYEE
```

### Issue #2: Employee Can View All Employees
**Current Behavior**:
```bash
# berjan@callpro.mn (role: EMPLOYEE) can:
GET /api/employees  # ✅ Returns ALL employees (should be limited)
```

**Should Be**:
```bash
# Employees should only see:
- Their own profile
- Maybe their department colleagues (if needed)
GET /api/employees  # ❌ 403 Forbidden OR returns filtered list
```

### Issue #3: Employee Can Edit Other Resources
**Current Behavior**:
```bash
# berjan@callpro.mn can edit ANY database
PUT /api/resources/databases/{id}  # ✅ Works (no ownership check)
```

**Should Be**:
```bash
# Should check:
1. Is user ADMIN or IT_STAFF? → Allow
2. Is user a resource owner? → Allow
3. Otherwise → 403 Forbidden
```

### Issue #4: No Company Scoping
**Current Behavior**:
```bash
# User from Company A can see Company B's data
GET /api/employees  # Returns employees from both companies
```

**Should Be**:
```bash
# Filter by company (except for SUPER_ADMIN)
GET /api/employees?company={session.user.company}
```

---

## 📋 Approval Menu Issue (FIXED for berjan@callpro.mn)

### Problem Summary:
1. You (`berjan@callpro.mn`) requested access to `testdb`
2. At that time, only `damdindorj@callpro.mn` was Primary Owner
3. Approval record created only for damdindorj
4. Later, you were added as Secondary Owner
5. But your approval record wasn't created retroactively
6. Result: You couldn't see the request in Approvals menu

### Solution Applied:
```sql
-- Manually added approval record for you
INSERT INTO resource_approvals (...)
VALUES (
  'cmhbi2wb30001af0y8t8qu5b7',  -- The request ID
  'berjan@callpro.mn',           -- Your email
  'SECONDARY_OWNER',             -- Your role
  'PENDING'                      -- Status
);
```

### Result:
✅ You should now see the access request in your Approvals menu at:
**https://acm.callpro.mn/approvals**

---

## 🛠️ Recommended Fixes (Priority Order)

### **Priority 1: Create Permission Middleware** (2-3 days)

Create `/src/middleware/permissions.ts`:
```typescript
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export function requireRole(allowedRoles: string[]) {
  return async function(
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: any[]) => {
      const session = await getServerSession(authOptions)

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (!allowedRoles.includes(session.user.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return handler(req, ...args)
    }
  }
}

export function requireResourceOwner(getResourceId: (req: NextRequest) => string) {
  return async function(
    handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, ...args: any[]) => {
      const session = await getServerSession(authOptions)

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Admins bypass ownership checks
      if (session.user.role === 'ADMIN') {
        return handler(req, ...args)
      }

      const resourceId = getResourceId(req)
      const isOwner = await prisma.resourceOwner.findFirst({
        where: {
          resourceId,
          ownerEmail: session.user.email,
          isActive: true
        }
      })

      if (!isOwner) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return handler(req, ...args)
    }
  }
}
```

### **Priority 2: Apply Middleware to All API Routes** (3-4 days)

Update API routes to use middleware:

```typescript
// Before (Insecure):
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... create database ...
}

// After (Secure):
import { requireRole } from '@/middleware/permissions'

export const POST = requireRole(['ADMIN', 'IT_STAFF'])(
  async function(request: NextRequest) {
    // ... create database ...
  }
)
```

### **Priority 3: Implement Approval Sync** (2-3 days)

When resource ownership changes, sync approval records:

```typescript
// In /api/resources/owners route
export async function POST(request: NextRequest) {
  // ... update owners ...

  // NEW: Sync pending approvals
  const pendingRequests = await prisma.resourceAccessRequest.findMany({
    where: {
      resourceType,
      resourceId,
      status: 'PENDING'
    }
  })

  for (const request of pendingRequests) {
    // Get current owners
    const currentOwners = await prisma.resourceOwner.findMany({
      where: { resourceType, resourceId, isActive: true }
    })

    // Get existing approvals
    const existingApprovals = await prisma.resourceApproval.findMany({
      where: { requestId: request.id }
    })

    // Add missing approvals
    const missingOwners = currentOwners.filter(
      owner => !existingApprovals.some(a => a.approverEmail === owner.ownerEmail)
    )

    for (const owner of missingOwners) {
      await prisma.resourceApproval.create({
        data: {
          requestId: request.id,
          approverId: owner.ownerEmail!,
          approverName: owner.ownerEmail!,
          approverEmail: owner.ownerEmail!,
          approverRole: owner.ownershipType,
          status: 'PENDING'
        }
      })
    }

    // Remove approvals for removed owners
    const removedOwnerEmails = existingApprovals
      .filter(a => !currentOwners.some(o => o.ownerEmail === a.approverEmail))
      .map(a => a.approverEmail)

    await prisma.resourceApproval.deleteMany({
      where: {
        requestId: request.id,
        approverEmail: { in: removedOwnerEmails },
        status: 'PENDING'
      }
    })
  }
}
```

### **Priority 4: Add Company Scoping** (2 days)

Filter data by company:

```typescript
// Create helper function
export function getCompanyFilter(session: Session) {
  if (session.user.role === 'SUPER_ADMIN') {
    return {} // No filter - see all companies
  }
  return { company: session.user.company }
}

// Usage:
const employees = await prisma.employee.findMany({
  where: {
    ...getCompanyFilter(session),
    isActive: true
  }
})
```

---

## 📊 Summary

### ✅ What Works:
1. Authentication (login/logout)
2. User roles stored in JWT
3. Session management
4. Basic approval workflow
5. Resource ownership tracking

### ❌ What Doesn't Work:
1. **Authorization checks** (biggest issue!)
2. Permission middleware
3. Role-based access control
4. Resource ownership verification
5. Company data scoping
6. Approval sync when ownership changes

### 🎯 Immediate Actions:

**For You (berjan@callpro.mn)**:
1. ✅ Refresh https://acm.callpro.mn/approvals - you should see the request now
2. ✅ You can approve it as Secondary Owner
3. ⚠️ Be aware: Currently ANY logged-in user can access admin functions (security risk)

**For Development Team**:
1. **Week 2**: Implement permission middleware (Priority 1)
2. **Week 3**: Apply middleware to all API routes (Priority 2)
3. **Week 4**: Implement approval sync (Priority 3)
4. **Week 5**: Add company scoping (Priority 4)

---

**Status**: ⚠️ CRITICAL - Permission system incomplete
**Security Risk**: HIGH - No authorization checks
**Impact**: Any logged-in user can perform admin actions
**Estimated Fix Time**: 10-12 days

---

*Last Updated: 2025-10-29*
*Analyzed By: Claude (AI Assistant)*
