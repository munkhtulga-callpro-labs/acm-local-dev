# Audit Log Implementation - Phase 2

## Overview
Added comprehensive audit logging to track all critical actions in the Access Control Management System.

## Implemented Audit Actions

### 1. Access Request Workflow ✅
- **GRANT_ACCESS** - When approver grants access (ALREADY IMPLEMENTED)
  - File: `/src/app/api/resources/access-requests/[id]/approve/route.ts`
  - Captures: resource details, requester, access level, approver info
  
- **REJECT_ACCESS** - When approver rejects access request (NEW)
  - File: `/src/app/api/resources/access-requests/[id]/approve/route.ts`
  - Captures: resource details, requester, rejection reason, approver info

- **CREATE_ACCESS_REQUEST** - When user creates new access request (NEW)
  - File: `/src/app/api/resources/access-requests/route.ts`
  - Captures: resource details, requester, access level, business justification

## Audit Log Data Structure

Each audit log entry contains:
- `action`: Type of action performed (e.g., GRANT_ACCESS, REJECT_ACCESS)
- `entityType`: Type of entity affected (e.g., ResourceAssignment, ResourceAccessRequest)
- `entityId`: ID of the affected entity
- `userId`: ID of the user who performed the action
- `employeeId`: ID of the employee (if linked to user)
- `oldValues`: Previous state (for updates/deletes)
- `newValues`: New state (for creates/updates)
- `ipAddress`: IP address of the user
- `userAgent`: Browser/client information
- `createdAt`: Timestamp of the action

## Frontend Display

- **Page**: `/audit-logs`
- **Features**:
  - Filterable by action type, entity type
  - Searchable by user name/email
  - Paginated display (20 per page)
  - Color-coded badges for different action types
  - Shows timestamp, user, entity type, and details

## Database Schema

```sql
Table: audit_logs
- id (cuid)
- action (String) - indexed
- entityType (String)
- entityId (String)
- oldValues (Json, optional)
- newValues (Json, optional)
- userId (String, optional) - foreign key to users
- employeeId (String, optional) - foreign key to employees
- ipAddress (String, optional)
- userAgent (String, optional)
- createdAt (DateTime) - indexed
```

## ISO 27001 Compliance

✅ **A.9.4.5 - Access logging**: All access grants and denials are logged
✅ **A.12.4.1 - Event logging**: System activities are logged with timestamps
✅ **A.12.4.3 - Administrator and operator logs**: Admin actions are tracked

## Next Steps (Pending)

### Priority 1: Resource Management Operations
- CREATE_RESOURCE - When new database/SaaS resource added
- UPDATE_RESOURCE - When resource details updated
- DELETE_RESOURCE - When resource removed
- CREATE_RESOURCE_OWNER - When owner assigned
- UPDATE_RESOURCE_OWNER - When owner changed
- REVOKE_ACCESS - When access manually revoked

### Priority 2: Employee Management
- CREATE_EMPLOYEE
- UPDATE_EMPLOYEE  
- DELETE_EMPLOYEE

### Priority 3: Department/Company Management
- CREATE_DEPARTMENT
- UPDATE_DEPARTMENT
- CREATE_COMPANY
- UPDATE_COMPANY

### Priority 4: Authentication Events
- LOGIN - User login (requires NextAuth callback integration)
- LOGOUT - User logout

### Priority 5: Export Functionality
- Implement CSV export of audit logs for compliance reporting

## Testing

To test audit logging:

1. Create a new access request → Should create CREATE_ACCESS_REQUEST log
2. Approve the request → Should create GRANT_ACCESS log
3. Reject a request → Should create REJECT_ACCESS log
4. Check logs at `/audit-logs` page

Query to view audit logs:
```sql
SELECT 
  al.id, 
  al.action, 
  al."entityType", 
  al."createdAt", 
  u.email as user_email,
  e."firstName" as employee_name
FROM audit_logs al
LEFT JOIN users u ON al."userId" = u.id
LEFT JOIN employees e ON al."employeeId" = e.id
ORDER BY al."createdAt" DESC;
```

## Related Files

- `/src/services/audit-service.ts` - Audit logging service
- `/src/app/api/audit-logs/route.ts` - API endpoint for fetching logs
- `/src/app/(dashboard)/audit-logs/page.tsx` - Frontend display page
- `/prisma/schema.prisma` - Database schema definition

