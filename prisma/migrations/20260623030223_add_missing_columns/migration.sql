-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'SEASONAL', 'INTERN', 'PROBATIONARY', 'ON_LEAVE', 'MEDICAL_LEAVE', 'PARENTAL_LEAVE', 'PERSONAL_LEAVE', 'SABBATICAL', 'MILITARY_LEAVE', 'TERMINATED', 'RESIGNED', 'RETIRED', 'LAID_OFF', 'DECEASED', 'SUSPENDED', 'REMOTE', 'ON_NOTICE', 'PENDING_START');

-- CreateEnum
CREATE TYPE "WorkLocation" AS ENUM ('OFFICE', 'REMOTE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('SOFTWARE', 'HARDWARE', 'NETWORK', 'SECURITY', 'STORAGE', 'BACKUP', 'MONITORING', 'OTHER');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('LAPTOP', 'DESKTOP', 'MOBILE', 'TABLET', 'PRINTER', 'SCANNER', 'NETWORK_EQUIPMENT', 'SECURITY_DEVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RETIRED', 'LOST', 'STOLEN');

-- CreateEnum
CREATE TYPE "ServerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED', 'FAILED');

-- CreateEnum
CREATE TYPE "DatabaseType" AS ENUM ('POSTGRESQL', 'MYSQL', 'MONGODB', 'REDIS', 'ELASTICSEARCH', 'INFLUXDB', 'OTHER');

-- CreateEnum
CREATE TYPE "DatabaseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SystemCategory" ADD VALUE 'SUPPORT';
ALTER TYPE "SystemCategory" ADD VALUE 'DESIGN';
ALTER TYPE "SystemCategory" ADD VALUE 'BUSINESS';
ALTER TYPE "SystemCategory" ADD VALUE 'GOVERNMENT';
ALTER TYPE "SystemCategory" ADD VALUE 'SECURITY';

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "secondaryManager" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "workLocation" "WorkLocation" NOT NULL DEFAULT 'OFFICE';

-- AlterTable
ALTER TABLE "positions" ADD COLUMN     "accessLevel" TEXT;

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "location" TEXT,
    "owner" TEXT,
    "administrator" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "model" TEXT,
    "serialNumber" TEXT,
    "macAddress" TEXT,
    "ipAddress" TEXT,
    "location" TEXT,
    "owner" TEXT,
    "administrator" TEXT,
    "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hostname" TEXT,
    "ipAddress" TEXT,
    "os" TEXT,
    "environment" TEXT,
    "location" TEXT,
    "administrator" TEXT,
    "status" "ServerStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "databases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DatabaseType" NOT NULL,
    "host" TEXT,
    "port" INTEGER,
    "environment" TEXT,
    "administrator" TEXT,
    "status" "DatabaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "databases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_databases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "databaseType" TEXT NOT NULL,
    "version" TEXT,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "databaseName" TEXT,
    "schema" TEXT,
    "connectionString" TEXT,
    "adminUser" TEXT,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT true,
    "encryptionType" TEXT,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "backupFrequency" TEXT,
    "lastBackupDate" TIMESTAMP(3),
    "owner" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "description" TEXT,
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "expiryDate" TIMESTAMP(3),
    "reviewDate" TIMESTAMP(3),
    "accessRequestTicketId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_databases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "ipHostname" TEXT NOT NULL,
    "accessMethod" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "locationRegion" TEXT,
    "ownerDepartment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "purpose" TEXT,
    "mfaRequired" BOOLEAN NOT NULL DEFAULT false,
    "vpnRequired" BOOLEAN NOT NULL DEFAULT false,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "expiryDate" TIMESTAMP(3),
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software_licenses" (
    "id" TEXT NOT NULL,
    "softwareName" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "assignedSeats" INTEGER NOT NULL DEFAULT 0,
    "purchaseDate" TIMESTAMP(3),
    "expiryRenewalDate" TIMESTAMP(3),
    "cost" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "licenseKey" TEXT,
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saas_subscriptions" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subscriptionPlan" TEXT NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "usedSeats" INTEGER NOT NULL DEFAULT 0,
    "billingCycle" TEXT NOT NULL,
    "cost" DECIMAL(10,2),
    "renewalDate" TIMESTAMP(3),
    "ownerDepartment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ssoEnabled" BOOLEAN NOT NULL DEFAULT false,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "expiryDate" TIMESTAMP(3),
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_devices" (
    "id" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "makeModel" TEXT NOT NULL,
    "serialNumber" TEXT,
    "assetTag" TEXT,
    "operatingSystem" TEXT,
    "assignedTo" TEXT,
    "assignmentDate" TIMESTAMP(3),
    "location" TEXT,
    "condition" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "specifications" TEXT,
    "purchaseCost" DECIMAL(10,2),
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cloud_accounts" (
    "id" TEXT NOT NULL,
    "cloudProvider" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountId" TEXT,
    "environment" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "permissionLevel" TEXT NOT NULL,
    "regionAccess" TEXT,
    "mfaRequired" BOOLEAN NOT NULL DEFAULT true,
    "ownerDepartment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "costCenter" TEXT,
    "servicesAccessible" TEXT,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "expiryDate" TIMESTAMP(3),
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloud_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal_tools" (
    "id" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "purposeCategory" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "authenticationMethod" TEXT NOT NULL,
    "networkAccess" TEXT NOT NULL,
    "ownerDepartment" TEXT,
    "userGroups" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "documentationLink" TEXT,
    "integrationSystems" TEXT,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "expiryDate" TIMESTAMP(3),
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vpn_network_access" (
    "id" TEXT NOT NULL,
    "profileName" TEXT NOT NULL,
    "vpnType" TEXT NOT NULL,
    "networkSegments" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "deviceRestrictions" TEXT,
    "assignedTo" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "ipWhitelist" TEXT,
    "splitTunnel" BOOLEAN NOT NULL DEFAULT false,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vpn_network_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_repositories" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "repositoryName" TEXT NOT NULL,
    "organizationTeam" TEXT NOT NULL,
    "accessLevel" TEXT NOT NULL,
    "branchRestrictions" TEXT,
    "assignedTo" TEXT,
    "ownerDepartment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "webhookAccess" BOOLEAN NOT NULL DEFAULT false,
    "deploymentKeys" TEXT,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "expiryDate" TIMESTAMP(3),
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "code_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "apiKeyToken" TEXT NOT NULL,
    "keyType" TEXT NOT NULL,
    "scopePermissions" TEXT NOT NULL,
    "rateLimit" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "ipRestrictions" TEXT,
    "webhookUrls" TEXT,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "accessRequestTicketId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_storage" (
    "id" TEXT NOT NULL,
    "storageType" TEXT NOT NULL,
    "pathLocation" TEXT NOT NULL,
    "permissionLevel" TEXT NOT NULL,
    "quotaLimit" TEXT,
    "assignedTo" TEXT,
    "encryptionStatus" TEXT,
    "ownerDepartment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "sharingSettings" TEXT,
    "retentionPolicy" TEXT,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "expiryDate" TIMESTAMP(3),
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_access" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "badgeCardNumber" TEXT,
    "accessSchedule" TEXT NOT NULL,
    "accessZones" TEXT NOT NULL,
    "assignedTo" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "escortRequired" BOOLEAN NOT NULL DEFAULT false,
    "authorizationLevel" TEXT,
    "requestDate" TIMESTAMP(3),
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" TIMESTAMP(3),
    "businessJustification" TEXT,
    "accessRequestTicketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "physical_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_owners" (
    "id" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "ownershipType" TEXT NOT NULL,
    "ownerId" TEXT,
    "ownerEmail" TEXT,
    "ownerDepartment" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_access_requests" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterDepartment" TEXT,
    "accessLevel" TEXT NOT NULL,
    "accessDetails" JSONB,
    "businessJustification" TEXT NOT NULL,
    "accessRequestTicketId" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "currentApproverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_approvals" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverName" TEXT NOT NULL,
    "approverEmail" TEXT NOT NULL,
    "approverRole" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "decision" TEXT,
    "comments" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_assignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceName" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "assigneeName" TEXT NOT NULL,
    "assigneeEmail" TEXT NOT NULL,
    "assigneeDepartment" TEXT,
    "accessLevel" TEXT NOT NULL,
    "accessCredentials" JSONB,
    "accessDetails" JSONB,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'settings',
    "companyName" TEXT NOT NULL DEFAULT 'CallPro LLC',
    "systemName" TEXT NOT NULL DEFAULT 'HR Access Control System',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ulaanbaatar',
    "dateFormat" TEXT NOT NULL DEFAULT 'MM/DD/YYYY',
    "language" TEXT NOT NULL DEFAULT 'en',
    "autoLogout" INTEGER NOT NULL DEFAULT 30,
    "passwordMinLength" INTEGER NOT NULL DEFAULT 8,
    "requireSpecialChars" BOOLEAN NOT NULL DEFAULT true,
    "requireNumbers" BOOLEAN NOT NULL DEFAULT true,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 60,
    "twoFactorAuth" BOOLEAN NOT NULL DEFAULT false,
    "ipWhitelist" BOOLEAN NOT NULL DEFAULT false,
    "auditLogging" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "approvalReminders" BOOLEAN NOT NULL DEFAULT true,
    "expiryWarnings" BOOLEAN NOT NULL DEFAULT true,
    "securityAlerts" BOOLEAN NOT NULL DEFAULT true,
    "systemUpdates" BOOLEAN NOT NULL DEFAULT false,
    "reminderDays" INTEGER NOT NULL DEFAULT 7,
    "maxFileSize" INTEGER NOT NULL DEFAULT 10,
    "backupFrequency" TEXT NOT NULL DEFAULT 'daily',
    "logRetention" INTEGER NOT NULL DEFAULT 90,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "debugMode" BOOLEAN NOT NULL DEFAULT false,
    "apiRateLimit" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_owners_resourceType_resourceId_idx" ON "resource_owners"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "resource_owners_ownerEmail_idx" ON "resource_owners"("ownerEmail");

-- CreateIndex
CREATE INDEX "resource_access_requests_status_idx" ON "resource_access_requests"("status");

-- CreateIndex
CREATE INDEX "resource_access_requests_resourceType_resourceId_idx" ON "resource_access_requests"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "resource_access_requests_requesterEmail_idx" ON "resource_access_requests"("requesterEmail");

-- CreateIndex
CREATE INDEX "resource_approvals_requestId_idx" ON "resource_approvals"("requestId");

-- CreateIndex
CREATE INDEX "resource_approvals_approverEmail_idx" ON "resource_approvals"("approverEmail");

-- CreateIndex
CREATE INDEX "resource_approvals_status_idx" ON "resource_approvals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "resource_assignments_requestId_key" ON "resource_assignments"("requestId");

-- CreateIndex
CREATE INDEX "resource_assignments_resourceType_resourceId_idx" ON "resource_assignments"("resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "resource_assignments_assigneeEmail_idx" ON "resource_assignments"("assigneeEmail");

-- CreateIndex
CREATE INDEX "resource_assignments_status_idx" ON "resource_assignments"("status");

-- CreateIndex
CREATE INDEX "resource_assignments_validTo_idx" ON "resource_assignments"("validTo");

-- AddForeignKey
ALTER TABLE "resource_approvals" ADD CONSTRAINT "resource_approvals_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "resource_access_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_assignments" ADD CONSTRAINT "resource_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "resource_access_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
