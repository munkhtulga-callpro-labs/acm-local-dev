-- CreateTable
CREATE TABLE "department_access_templates" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "systemId" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "resourceName" TEXT,
    "accessLevel" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_access_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "department_access_templates_departmentId_isActive_idx" ON "department_access_templates"("departmentId", "isActive");

-- AddForeignKey
ALTER TABLE "department_access_templates" ADD CONSTRAINT "department_access_templates_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_access_templates" ADD CONSTRAINT "department_access_templates_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
