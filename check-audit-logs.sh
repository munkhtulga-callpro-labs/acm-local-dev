#!/bin/bash

# Quick Audit Log Verification Script
# Run this after approving a request to verify audit logs are working

echo "============================================"
echo "Audit Log Verification Script"
echo "============================================"
echo ""

echo "1. Checking PM2 logs for audit log creation..."
echo "--------------------------------------------"
pm2 logs access-control --lines 30 --nostream | grep -E "Audit log|audit log|✅|❌" | tail -20
echo ""

echo "2. Checking database for audit logs..."
echo "--------------------------------------------"
PGPASSWORD=password123 psql -h localhost -p 5433 -U access_control -d access_control -c "
SELECT
  al.id,
  al.action,
  al.\"entityType\",
  to_char(al.\"createdAt\", 'YYYY-MM-DD HH24:MI:SS') as created_at,
  u.email as approver_email,
  e.\"firstName\" || ' ' || e.\"lastName\" as approver_name,
  al.\"newValues\"->>'resourceName' as resource_name,
  al.\"newValues\"->>'assigneeEmail' as assignee_email,
  al.\"newValues\"->>'accessLevel' as access_level
FROM audit_logs al
LEFT JOIN users u ON al.\"userId\" = u.id
LEFT JOIN employees e ON al.\"employeeId\" = e.id
ORDER BY al.\"createdAt\" DESC
LIMIT 5;
"
echo ""

echo "3. Counting total audit logs..."
echo "--------------------------------------------"
AUDIT_COUNT=$(PGPASSWORD=password123 psql -h localhost -p 5433 -U access_control -d access_control -t -c "SELECT COUNT(*) FROM audit_logs;")
echo "Total audit logs in database: $AUDIT_COUNT"
echo ""

if [ "$AUDIT_COUNT" -gt 0 ]; then
    echo "✅ SUCCESS! Audit logs are being created!"
else
    echo "❌ WARNING: No audit logs found. Please approve a request and run this script again."
fi

echo ""
echo "============================================"
echo "To approve a request:"
echo "1. Go to https://acm.callpro.mn/approvals"
echo "2. Select a pending request"
echo "3. Fill in credentials and click Approve"
echo "4. Run this script again to verify"
echo "============================================"
