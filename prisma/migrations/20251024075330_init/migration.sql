-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE', 'IT_STAFF');

-- CreateEnum
CREATE TYPE "SystemCategory" AS ENUM ('COMMUNICATION', 'PRODUCTIVITY', 'DEVELOPMENT', 'FINANCE', 'MARKETING', 'CUSTOMER_SERVICE', 'INFRASTRUCTURE', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('ONBOARDING', 'OFFBOARDING', 'ACCESS_MODIFICATION', 'ACCESS_EXTENSION', 'ACCESS_REVOCATION');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "company" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "manager" TEXT,
    "company" TEXT,
    "companyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "manager" TEXT,
    "company" TEXT,
    "companyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "systems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "SystemCategory" NOT NULL,
    "hasApi" BOOLEAN NOT NULL DEFAULT false,
    "apiEndpoint" TEXT,
    "requiresManual" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_permissions" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_requests" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_request_systems" (
    "id" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "access_request_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_workflows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "accessRequestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" TEXT,
    "employeeId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_credentials" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "encryptedValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manual_tasks" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "accessRequestId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_userId_key" ON "employees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_company_key" ON "departments"("name", "company");

-- CreateIndex
CREATE UNIQUE INDEX "positions_name_departmentId_key" ON "positions"("name", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "systems_name_key" ON "systems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "access_permissions_employeeId_systemId_key" ON "access_permissions"("employeeId", "systemId");

-- CreateIndex
CREATE UNIQUE INDEX "access_request_systems_accessRequestId_systemId_key" ON "access_request_systems"("accessRequestId", "systemId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_workflows_name_key" ON "approval_workflows"("name");

-- CreateIndex
CREATE UNIQUE INDEX "approvals_accessRequestId_approverId_step_key" ON "approvals"("accessRequestId", "approverId", "step");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_permissions" ADD CONSTRAINT "access_permissions_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_permissions" ADD CONSTRAINT "access_permissions_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_request_systems" ADD CONSTRAINT "access_request_systems_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_request_systems" ADD CONSTRAINT "access_request_systems_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_accessRequestId_fkey" FOREIGN KEY ("accessRequestId") REFERENCES "access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_credentials" ADD CONSTRAINT "api_credentials_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_tasks" ADD CONSTRAINT "manual_tasks_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
