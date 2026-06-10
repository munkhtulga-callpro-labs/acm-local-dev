# HR Access Control Management System

A comprehensive ISO 27001-compliant access control management system for Onlime Network LLC and CallPro LLC. Manages employee access to 12 types of resources with multi-owner approval workflows.

## 🎯 System Purpose

Centralized management of employee access to:
- Databases (PostgreSQL, MySQL, MongoDB, etc.)
- Servers (Physical, Virtual, Cloud)
- Software Licenses
- SaaS Subscriptions
- Cloud Accounts (AWS, Azure, GCP)
- Devices (Laptops, Desktops, Mobiles)
- Internal Tools
- VPN/Network Access
- Code Repositories
- API Keys
- File Storage
- Physical Access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- PM2 (for production)

### Installation

```bash
# Clone and install
git clone <repository-url>
cd access-control
npm install

# Configure environment
cp env.example .env
# Edit .env with your configuration

# Setup database
export DATABASE_URL="postgresql://user:pass@localhost:5432/access_control"
npx prisma generate
npx prisma migrate deploy

# Start development
npm run dev

# Or production with PM2
npm run build
pm2 start ecosystem.config.js
```

### Access the System
- URL: http://localhost:3000
- Admin: Create via seed script or manual registration

## 📋 Current Status: Phase 2 (70% Complete)

### ✅ Completed Features
- Authentication (Google SSO + Credentials)
- Employee, Company, Department management
- 12 resource types with CRUD operations
- Resource ownership model (Main/Department/Secondary owners)
- Access request workflow
- Multi-level approval system
- Assignment tracking
- Searchable employee combobox (Database modal)

### 🚧 In Progress
- Fix approval workflow logic (see SYSTEM_ANALYSIS_AND_FIXES.md)
- Update 11 remaining resource modals
- Auto-assignment after approval
- Email notifications
- Comprehensive audit logging
- Permission system implementation

### 📋 Planned
- API provisioning automation
- Access expiry automation
- Bulk operations
- Export functionality (CSV/Excel/PDF)
- Advanced reporting & analytics
- CallPro Teams bot integration

## 🔐 User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **SUPER_ADMIN** | System administrator | Full system access, can create admins |
| **ADMIN** | Company administrator | Full access to company-scoped data |
| **RESOURCE_OWNER** | Resource owner | Can approve access to owned resources |
| **HR_MANAGER** | HR department | Employee lifecycle, onboarding/offboarding |
| **DEPARTMENT_MANAGER** | Department head | Department-level approvals |
| **IT_ADMIN** | IT administration | Technical configuration, API credentials |
| **IT_STAFF** | IT support | Execute provisioning tasks |
| **SECURITY_OFFICER** | Security team | Audit logs, compliance, security reviews |
| **AUDITOR** | Compliance auditor | Read-only access to audit logs |
| **EMPLOYEE** | Regular employee | Can request access to resources |
| **READONLY** | Report viewer | View-only access for reports |

## 📊 Technology Stack

**Frontend & Backend**
- Next.js 16.0.0 (App Router)
- React 19.2.0
- TypeScript 5
- Tailwind CSS + shadcn/ui

**Database**
- PostgreSQL 15+
- Prisma 6.18.0 ORM

**Authentication**
- NextAuth.js 4.24.11
- Google SSO
- Credentials (username/password)

**Background Jobs (Planned)**
- BullMQ + Redis
- Nodemailer

## 📁 Project Structure

```
access-control/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, register pages
│   │   ├── (dashboard)/         # Main application pages
│   │   │   ├── dashboard/       # Dashboard
│   │   │   ├── directory/       # Employees, departments, companies
│   │   │   ├── resources/       # 12 resource types
│   │   │   ├── request-access/  # Access request page
│   │   │   ├── approvals/       # Approval management
│   │   │   ├── access-control/  # Assignment management
│   │   │   ├── audit-logs/      # Audit trail
│   │   │   └── settings/        # System settings
│   │   └── api/                 # API routes
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── *-modal.tsx          # Resource modals
│   │   ├── resource-owner-manager.tsx
│   │   └── employee-combobox.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── middleware/
│       └── permissions.ts       # (Planned)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── SYSTEM_ANALYSIS_AND_FIXES.md  # 📖 READ THIS FIRST
├── DEPLOYMENT_SUMMARY.md
├── GOOGLE_SSO_SETUP.md
├── GOOGLE_OAUTH_FIX.md
└── README.md
```

## 🔧 Development

### Running Locally
```bash
npm run dev                # Start dev server (localhost:3000)
npx prisma studio          # Open Prisma Studio (localhost:5555)
npx prisma migrate dev     # Create new migration
npm run build              # Build for production
```

### Database Commands
```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### PM2 Commands (Production)
```bash
pm2 start access-control              # Start app
pm2 restart access-control            # Restart app
pm2 stop access-control               # Stop app
pm2 logs access-control               # View logs
pm2 describe access-control           # View details
pm2 list                              # List all processes
```

## 🚨 Critical Issues & Fixes

**See [SYSTEM_ANALYSIS_AND_FIXES.md](./SYSTEM_ANALYSIS_AND_FIXES.md) for:**
- Complete database relation analysis
- Critical workflow bugs and fixes
- Permission system design
- Implementation roadmap
- Priority fixes and timeline

**Key Issues Identified:**
1. ❌ Missing foreign key relations in resource workflow tables
2. ❌ Duplicate resource models (old vs new)
3. ❌ Denormalized ISO 27001 fields in resource tables
4. ❌ Approval workflow broken when owners change
5. ❌ No auto-assignment creation after approval
6. ❌ Incomplete permission system
7. ❌ 11 resource modals need updating

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [SYSTEM_ANALYSIS_AND_FIXES.md](./SYSTEM_ANALYSIS_AND_FIXES.md) | **START HERE** - Complete system analysis, issues, and fixes |
| [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) | Deployment configuration and setup |
| [GOOGLE_SSO_SETUP.md](./GOOGLE_SSO_SETUP.md) | Google OAuth setup instructions |
| [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) | Google OAuth troubleshooting |

## 🎯 Workflow Overview

### Resource Access Request Flow
```
1. Employee requests access to resource
   ↓
2. System finds resource owners (Main/Department/Secondary)
   ↓
3. Creates approval records for each owner
   ↓
4. Owners receive notification (email/in-app)
   ↓
5. Owners review and approve/reject
   ↓
6. When all approvals complete:
   - Creates ResourceAssignment
   - Sends access credentials via email
   - Records in audit log
   ↓
7. Access appears in employee's Access Control menu
   ↓
8. Access expires or gets revoked (tracked)
```

### Resource Ownership Model
```
Resource (e.g., Production Database)
├── Primary Owner (MAIN_OWNER)        - Required, one employee
├── Department Owners (DEPARTMENT)     - Optional, multiple departments
└── Secondary Owners (SECONDARY_OWNER) - Optional, multiple employees

When access requested:
→ All active owners receive approval request
→ Primary owner approval required
→ Department/Secondary approvals based on policy
```

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee

### Resources (12 types)
- `GET /api/resources/databases` - List databases
- `POST /api/resources/databases` - Create database
- `PUT /api/resources/databases/[id]` - Update database
- `DELETE /api/resources/databases/[id]` - Delete database
- (Same pattern for all 12 resource types)

### Resource Workflow
- `POST /api/resources/access-requests` - Create access request
- `GET /api/resources/access-requests?view=pending-approvals` - Get pending approvals
- `POST /api/resources/approvals/[id]/approve` - Approve request
- `POST /api/resources/approvals/[id]/reject` - Reject request
- `GET /api/resources/assignments` - List active assignments
- `POST /api/resources/assignments/[id]/revoke` - Revoke access

### Resource Owners
- `POST /api/resources/owners` - Set resource owners
- `GET /api/resources/owners?resourceType=&resourceId=` - Get resource owners

## 🐛 Troubleshooting

### Approvals Menu Empty
**Issue**: Resource owner doesn't see pending approvals
**Cause**: Approval logic uses cached `currentApproverId` instead of dynamic owner lookup
**Fix**: See [SYSTEM_ANALYSIS_AND_FIXES.md](./SYSTEM_ANALYSIS_AND_FIXES.md) Section "Fix 1.1: Approvals Logic"

### Access Control Menu Empty
**Issue**: Approved requests don't create assignments
**Cause**: Auto-assignment not implemented after approval
**Fix**: See [SYSTEM_ANALYSIS_AND_FIXES.md](./SYSTEM_ANALYSIS_AND_FIXES.md) Section "Fix 1.2: Auto-Assignment After Approval"

### Resource Modal Has Old Fields
**Issue**: Modal shows ISO 27001 fields (requestedBy, approvedBy)
**Cause**: Only Database modal updated, 11 others still have old structure
**Fix**: See [SYSTEM_ANALYSIS_AND_FIXES.md](./SYSTEM_ANALYSIS_AND_FIXES.md) Section "Priority 2: Update All Resource Modals"

### Permission Denied Errors
**Issue**: User cannot access certain features
**Cause**: Permission middleware not implemented
**Fix**: See [SYSTEM_ANALYSIS_AND_FIXES.md](./SYSTEM_ANALYSIS_AND_FIXES.md) Section "Fix 1.3: Add Permission Middleware"

## 🔒 Security Considerations

- All passwords hashed with bcryptjs
- JWT session tokens with NextAuth.js
- CSRF protection enabled
- SQL injection prevention via Prisma
- XSS protection via React
- API credentials encrypted at rest
- Audit logs immutable
- Row-level security (planned)

## 📊 Database Schema

### Core Models
- `User` - System users with authentication
- `Employee` - Organization employees
- `Company` - Onlime Network LLC, CallPro LLC
- `Department` - Departments within companies
- `Position` - Job positions

### Resource Models (12 types)
- `ResourceDatabase`, `ResourceServer`, `SoftwareLicense`, `SaaSSubscription`
- `ResourceDevice`, `CloudAccount`, `InternalTool`, `VPNNetworkAccess`
- `CodeRepository`, `APIKey`, `FileStorage`, `PhysicalAccess`

### Workflow Models
- `ResourceOwner` - Resource ownership (Main/Dept/Secondary)
- `ResourceAccessRequest` - Access requests
- `ResourceApproval` - Multi-level approvals
- `ResourceAssignment` - Granted access tracking

### Supporting Models
- `AuditLog` - Immutable audit trail
- `EmailTemplate` - Email notification templates
- `ApiCredential` - Encrypted API credentials
- `ManualTask` - Manual provisioning tasks

## 🤝 Contributing

1. Read [SYSTEM_ANALYSIS_AND_FIXES.md](./SYSTEM_ANALYSIS_AND_FIXES.md)
2. Follow the Implementation Roadmap
3. Run `npm run build` before committing
4. Test all changes thoroughly
5. Update documentation

## 📝 License

Proprietary - Onlime Network LLC & CallPro LLC

## 📞 Support

For technical support, contact the development team or create an issue in the repository.

---

**Status**: Phase 2 - 70% Complete (Active Development)
**Last Updated**: 2025-10-29
