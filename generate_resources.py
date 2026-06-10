#!/usr/bin/env python3
"""
Generate all remaining resource management files for the access control system.
This script creates modals, API routes, and pages for all 10 remaining resource types.
"""

import os
import json

# Resource configurations
RESOURCES = {
    "software-licenses": {
        "model_name": "SoftwareLicense",
        "display_name": "Software License",
        "display_name_plural": "Software Licenses",
        "icon": "Package",
        "description": "Track and manage software licenses and seats",
        "fields": {
            "softwareName": {"type": "string", "required": True, "label": "Software Name"},
            "vendor": {"type": "string", "required": True, "label": "Vendor"},
            "licenseType": {"type": "string", "required": True, "label": "License Type", "options": ["Per User", "Per Device", "Enterprise", "Site License", "Subscription"]},
            "licenseKey": {"type": "string", "required": False, "label": "License Key", "sensitive": True},
            "totalSeats": {"type": "number", "required": True, "label": "Total Seats"},
            "assignedSeats": {"type": "number", "required": False, "label": "Assigned Seats"},
            "purchaseDate": {"type": "date", "required": False, "label": "Purchase Date"},
            "expiryRenewalDate": {"type": "date", "required": False, "label": "Expiry/Renewal Date"},
            "cost": {"type": "number", "required": False, "label": "Cost"},
            "autoRenewal": {"type": "boolean", "required": False, "label": "Auto Renewal"},
        }
    },
    "saas-subscriptions": {
        "model_name": "SaaSSubscription",
        "display_name": "SaaS Subscription",
        "display_name_plural": "SaaS Subscriptions",
        "icon": "Cloud",
        "description": "Manage SaaS subscriptions and user seats",
        "fields": {
            "serviceName": {"type": "string", "required": True, "label": "Service Name"},
            "category": {"type": "string", "required": True, "label": "Category", "options": ["Communication", "Productivity", "Development", "Marketing", "Analytics", "Security"]},
            "subscriptionPlan": {"type": "string", "required": True, "label": "Subscription Plan"},
            "totalSeats": {"type": "number", "required": True, "label": "Total Seats"},
            "usedSeats": {"type": "number", "required": False, "label": "Used Seats"},
            "billingCycle": {"type": "string", "required": True, "label": "Billing Cycle", "options": ["Monthly", "Yearly", "Quarterly"]},
            "cost": {"type": "number", "required": False, "label": "Cost"},
            "renewalDate": {"type": "date", "required": False, "label": "Renewal Date"},
            "ownerDepartment": {"type": "string", "required": False, "label": "Owner Department"},
            "ssoEnabled": {"type": "boolean", "required": False, "label": "SSO Enabled"},
            "apiAccess": {"type": "boolean", "required": False, "label": "API Access"},
        }
    },
    "cloud-accounts": {
        "model_name": "CloudAccount",
        "display_name": "Cloud Account",
        "display_name_plural": "Cloud Accounts",
        "icon": "CloudCog",
        "description": "Manage cloud provider accounts (AWS, Azure, GCP)",
        "fields": {
            "cloudProvider": {"type": "string", "required": True, "label": "Cloud Provider", "options": ["AWS", "Azure", "GCP", "DigitalOcean", "Alibaba Cloud", "Oracle Cloud"]},
            "accountName": {"type": "string", "required": True, "label": "Account Name"},
            "accountId": {"type": "string", "required": False, "label": "Account ID"},
            "environment": {"type": "string", "required": True, "label": "Environment", "options": ["development", "staging", "production", "testing"]},
            "accessType": {"type": "string", "required": True, "label": "Access Type", "options": ["Console", "CLI", "API", "All"]},
            "permissionLevel": {"type": "string", "required": True, "label": "Permission Level", "options": ["read", "write", "admin", "full"]},
            "regionAccess": {"type": "string", "required": False, "label": "Region Access"},
            "mfaRequired": {"type": "boolean", "required": False, "label": "MFA Required"},
            "ownerDepartment": {"type": "string", "required": False, "label": "Owner Department"},
            "costCenter": {"type": "string", "required": False, "label": "Cost Center"},
            "servicesAccessible": {"type": "string", "required": False, "label": "Services Accessible"},
        }
    },
    "devices": {
        "model_name": "ResourceDevice",
        "display_name": "Device",
        "display_name_plural": "Devices",
        "icon": "Laptop",
        "description": "Track company devices and assignments",
        "fields": {
            "deviceType": {"type": "string", "required": True, "label": "Device Type", "options": ["Laptop", "Desktop", "Mobile", "Tablet", "Monitor", "Peripheral"]},
            "makeModel": {"type": "string", "required": True, "label": "Make/Model"},
            "serialNumber": {"type": "string", "required": False, "label": "Serial Number"},
            "assetTag": {"type": "string", "required": False, "label": "Asset Tag"},
            "operatingSystem": {"type": "string", "required": False, "label": "Operating System"},
            "assignedTo": {"type": "string", "required": False, "label": "Assigned To (Employee ID)"},
            "assignmentDate": {"type": "date", "required": False, "label": "Assignment Date"},
            "location": {"type": "string", "required": False, "label": "Location"},
            "condition": {"type": "string", "required": False, "label": "Condition", "options": ["New", "Excellent", "Good", "Fair", "Poor"]},
            "purchaseDate": {"type": "date", "required": False, "label": "Purchase Date"},
            "warrantyExpiry": {"type": "date", "required": False, "label": "Warranty Expiry"},
            "specifications": {"type": "text", "required": False, "label": "Specifications"},
            "purchaseCost": {"type": "number", "required": False, "label": "Purchase Cost"},
        }
    },
    "internal-tools": {
        "model_name": "InternalTool",
        "display_name": "Internal Tool",
        "display_name_plural": "Internal Tools",
        "icon": "Wrench",
        "description": "Manage access to internal tools and applications",
        "fields": {
            "toolName": {"type": "string", "required": True, "label": "Tool Name"},
            "url": {"type": "string", "required": True, "label": "URL"},
            "purposeCategory": {"type": "string", "required": True, "label": "Purpose/Category", "options": ["Development", "DevOps", "Monitoring", "Documentation", "Communication", "Analytics", "Admin"]},
            "accessLevel": {"type": "string", "required": True, "label": "Access Level", "options": ["read", "write", "admin", "full"]},
            "authenticationMethod": {"type": "string", "required": True, "label": "Authentication Method", "options": ["SSO", "LDAP", "OAuth", "API Key", "Username/Password"]},
            "networkAccess": {"type": "string", "required": True, "label": "Network Access", "options": ["Internal", "VPN", "Public"]},
            "ownerDepartment": {"type": "string", "required": False, "label": "Owner Department"},
            "userGroups": {"type": "string", "required": False, "label": "User Groups"},
            "documentationLink": {"type": "string", "required": False, "label": "Documentation Link"},
            "integrationSystems": {"type": "string", "required": False, "label": "Integration Systems"},
        }
    },
    "vpn-network-access": {
        "model_name": "VPNNetworkAccess",
        "display_name": "VPN/Network Access",
        "display_name_plural": "VPN/Network Access",
        "icon": "Network",
        "description": "Manage VPN profiles and network access",
        "fields": {
            "profileName": {"type": "string", "required": True, "label": "Profile Name"},
            "vpnType": {"type": "string", "required": True, "label": "VPN Type", "options": ["SSL VPN", "IPSec", "OpenVPN", "WireGuard", "L2TP", "PPTP"]},
            "networkSegments": {"type": "string", "required": True, "label": "Network Segments"},
            "accessLevel": {"type": "string", "required": True, "label": "Access Level", "options": ["read", "write", "admin", "full"]},
            "deviceRestrictions": {"type": "string", "required": False, "label": "Device Restrictions"},
            "assignedTo": {"type": "string", "required": False, "label": "Assigned To"},
            "validFrom": {"type": "date", "required": True, "label": "Valid From"},
            "validTo": {"type": "date", "required": False, "label": "Valid To"},
            "ipWhitelist": {"type": "string", "required": False, "label": "IP Whitelist"},
            "splitTunnel": {"type": "boolean", "required": False, "label": "Split Tunnel"},
        }
    },
    "code-repositories": {
        "model_name": "CodeRepository",
        "display_name": "Code Repository",
        "display_name_plural": "Code Repositories",
        "icon": "GitBranch",
        "description": "Manage code repository access (GitHub, GitLab, etc.)",
        "fields": {
            "platform": {"type": "string", "required": True, "label": "Platform", "options": ["GitHub", "GitLab", "Bitbucket", "Azure DevOps", "AWS CodeCommit"]},
            "repositoryName": {"type": "string", "required": True, "label": "Repository Name"},
            "organizationTeam": {"type": "string", "required": True, "label": "Organization/Team"},
            "accessLevel": {"type": "string", "required": True, "label": "Access Level", "options": ["Read", "Write", "Admin", "Maintain"]},
            "branchRestrictions": {"type": "string", "required": False, "label": "Branch Restrictions"},
            "assignedTo": {"type": "string", "required": False, "label": "Assigned To"},
            "ownerDepartment": {"type": "string", "required": False, "label": "Owner Department"},
            "webhookAccess": {"type": "boolean", "required": False, "label": "Webhook Access"},
            "deploymentKeys": {"type": "string", "required": False, "label": "Deployment Keys"},
        }
    },
    "api-keys": {
        "model_name": "APIKey",
        "display_name": "API Key",
        "display_name_plural": "API Keys",
        "icon": "Key",
        "description": "Manage API keys and tokens",
        "fields": {
            "serviceName": {"type": "string", "required": True, "label": "Service Name"},
            "apiKeyToken": {"type": "string", "required": True, "label": "API Key/Token", "sensitive": True},
            "keyType": {"type": "string", "required": True, "label": "Key Type", "options": ["Production", "Sandbox", "Development", "Testing"]},
            "scopePermissions": {"type": "string", "required": True, "label": "Scope/Permissions"},
            "rateLimit": {"type": "string", "required": False, "label": "Rate Limit"},
            "expiryDate": {"type": "date", "required": False, "label": "Expiry Date"},
            "assignedTo": {"type": "string", "required": False, "label": "Assigned To"},
            "ipRestrictions": {"type": "string", "required": False, "label": "IP Restrictions"},
            "webhookUrls": {"type": "string", "required": False, "label": "Webhook URLs"},
        }
    },
    "file-storage": {
        "model_name": "FileStorage",
        "display_name": "File Storage",
        "display_name_plural": "File Storage",
        "icon": "HardDrive",
        "description": "Manage file storage and shared drives",
        "fields": {
            "storageType": {"type": "string", "required": True, "label": "Storage Type", "options": ["Network Share", "OneDrive", "Google Drive", "Dropbox", "SharePoint", "S3", "Azure Blob"]},
            "pathLocation": {"type": "string", "required": True, "label": "Path/Location"},
            "permissionLevel": {"type": "string", "required": True, "label": "Permission Level", "options": ["Read", "Write", "Full Control", "Contributor"]},
            "quotaLimit": {"type": "string", "required": False, "label": "Quota Limit"},
            "assignedTo": {"type": "string", "required": False, "label": "Assigned To"},
            "encryptionStatus": {"type": "string", "required": False, "label": "Encryption Status"},
            "ownerDepartment": {"type": "string", "required": False, "label": "Owner Department"},
            "sharingSettings": {"type": "string", "required": False, "label": "Sharing Settings"},
            "retentionPolicy": {"type": "string", "required": False, "label": "Retention Policy"},
        }
    },
    "physical-access": {
        "model_name": "PhysicalAccess",
        "display_name": "Physical Access",
        "display_name_plural": "Physical Access",
        "icon": "DoorOpen",
        "description": "Manage physical access to buildings and rooms",
        "fields": {
            "location": {"type": "string", "required": True, "label": "Location (Building/Floor/Room)"},
            "accessType": {"type": "string", "required": True, "label": "Access Type", "options": ["Badge", "Key", "Biometric", "PIN", "Card + PIN"]},
            "badgeCardNumber": {"type": "string", "required": False, "label": "Badge/Card Number"},
            "accessSchedule": {"type": "string", "required": True, "label": "Access Schedule", "options": ["24/7", "Business Hours", "Custom", "Weekdays Only"]},
            "accessZones": {"type": "string", "required": True, "label": "Access Zones"},
            "assignedTo": {"type": "string", "required": False, "label": "Assigned To"},
            "validFrom": {"type": "date", "required": True, "label": "Valid From"},
            "validTo": {"type": "date", "required": False, "label": "Valid To"},
            "escortRequired": {"type": "boolean", "required": False, "label": "Escort Required"},
            "authorizationLevel": {"type": "string", "required": False, "label": "Authorization Level"},
        }
    },
}

print(json.dumps(RESOURCES, indent=2))
print(f"\n\nTotal resources to create: {len(RESOURCES)}")
print(f"Total files to generate: {len(RESOURCES) * 4} (4 files per resource)")
