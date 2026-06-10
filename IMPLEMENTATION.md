# Implementation Status

## Pages

### Done

| Page | Route |
|------|-------|
| Dashboard | `/dashboard` |
| Employees list | `/employees` |
| Employee detail | `/employees/[id]` |
| Employee edit | `/employees/[id]/edit` |
| Companies | `/companies` |
| Departments | `/departments` |
| Approvals | `/approvals` |
| Audit Logs | `/audit-logs` |
| Access Control (assignments view) | `/access` |
| Request Access (resource catalog + modal) | `/access/request` |
| Databases | `/resources/databases` |
| Servers | `/resources/servers` |
| Cloud Accounts | `/resources/cloud-accounts` |
| Code Repositories | `/resources/code-repositories` |
| Devices | `/resources/devices` |
| SaaS Subscriptions | `/resources/saas-subscriptions` |
| Software Licenses | `/resources/software-licenses` |
| VPN / Network | `/resources/vpn-network` |
| Internal Tools | `/resources/internal-tools` |

### Partial

| Page | Route | What's missing |
|------|-------|----------------|
| Settings | `/settings` | All 4 tabs (General, Security, Notifications, System) have UI but save handlers are fake — nothing persists to DB |
| Systems | `/systems` | Main systems tab works; Resources / Devices / Servers / Databases sub-tabs are "coming soon" placeholders |
| Audit Logs | `/audit-logs` | Export button exists but does nothing |
| Access Control | `/access` | "Request Access" button is unwired (no `onClick`) — `/access/request` page works fine separately |

### Stub (no UI)

| Page | Route | Notes |
|------|-------|-------|
| API Keys | `/resources/api-keys` | "Coming soon" placeholder. API routes exist. |
| File Storage | `/resources/file-storage` | "Coming soon" placeholder. API routes exist. |
| Physical Access | `/resources/physical-access` | "Coming soon" placeholder. API routes exist. Typo in button text. |

---

## API Routes

### Done

All 12 resource type CRUD routes (GET, POST, PUT, DELETE):
- `/api/resources/databases`
- `/api/resources/servers`
- `/api/resources/cloud-accounts`
- `/api/resources/code-repositories`
- `/api/resources/devices`
- `/api/resources/saas-subscriptions`
- `/api/resources/software-licenses`
- `/api/resources/vpn-network-access`
- `/api/resources/internal-tools`
- `/api/resources/api-keys`
- `/api/resources/file-storage`
- `/api/resources/physical-access`

Core routes:
- `/api/employees` — list, create, import
- `/api/employees/[id]` — get, update, delete
- `/api/companies`, `/api/companies/[id]`
- `/api/departments`
- `/api/positions`
- `/api/systems`, `/api/systems/[id]`
- `/api/dashboard` — stats + recent activity
- `/api/audit-logs` — paginated, searchable

Access workflow:
- `/api/resources/access-requests` — create request, notify owners
- `/api/resources/access-requests/[id]/approve` — approve/reject
- `/api/resources/assignments` — list active assignments
- `/api/resources/owners` — get/set resource owners
- `/api/resources/catalog` — browse all resources for request flow

### Known issues

| Route | Issue |
|-------|-------|
| `/api/audit-logs` | Auth check temporarily disabled (`// TODO: re-enable auth`) |
| `/api/resources/access-requests` POST | Fails if resource has no owners assigned — returns 400 with no fallback |

---

## What to implement next

### Priority 1 — Complete stub pages

All three have working API routes, just need the page + data table + modal (same pattern as other resource pages).

- [ ] `/resources/api-keys` — `APIKey` model, fields: serviceName, keyType, scopePermissions, expiryDate, assignedTo
- [ ] `/resources/file-storage` — `FileStorage` model, fields: storageType, pathLocation, permissionLevel, quotaLimit
- [ ] `/resources/physical-access` — `PhysicalAccess` model, fields: location, accessType, badgeCardNumber, accessZones, validFrom/validTo

### Priority 2 — Fix partial pages

- [ ] **Settings** — wire save handlers to real API endpoints (need `/api/settings` route)
- [ ] **Audit Logs export** — implement CSV/Excel export from current filtered view
- [ ] **Access Control button** — wire "Request Access" button on `/access` to open modal or navigate to `/access/request`
- [ ] **Systems sub-tabs** — implement Resources / Devices / Servers / Databases tabs (link to existing resource pages or embed filtered views)

### Priority 3 — Access workflow gaps

- [ ] Auto-assignment after approval — when all approvers approve, `ResourceAssignment` is not automatically created (currently manual)
- [ ] Access expiry automation — `expiry-service.ts` exists but is not scheduled; expired assignments are not auto-revoked
- [ ] Email notifications — `email-service.ts` and `email.ts` exist; verify SMTP config and test end-to-end

### Priority 4 — Permission system

- [ ] Role-based middleware is not enforced — any authenticated user can access any page/API
- [ ] `src/lib/validations.ts` has role definitions but no middleware wraps routes
- [ ] Need to implement per-route permission checks based on `UserRole` (ADMIN, HR_MANAGER, IT_STAFF, EMPLOYEE, etc.)
