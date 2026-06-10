'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Save, 
  User, 
  Shield, 
  Bell, 
  Mail, 
  Database,
  Key,
  Globe,
  Server,
  Users,
  Clock
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'CallPro LLC',
    systemName: 'HR Access Control System',
    timezone: 'Asia/Ulaanbaatar',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    autoLogout: 30
  })

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: true,
    sessionTimeout: 60,
    twoFactorAuth: false,
    ipWhitelist: false,
    auditLogging: true
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    approvalReminders: true,
    expiryWarnings: true,
    securityAlerts: true,
    systemUpdates: false,
    reminderDays: 7
  })

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maxFileSize: 10,
    backupFrequency: 'daily',
    logRetention: 90,
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: 1000
  })

  const handleSaveGeneral = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSuccess('General settings saved successfully!')
    } catch (error) {
      setError('Error saving general settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSecurity = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSuccess('Security settings saved successfully!')
    } catch (error) {
      setError('Error saving security settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSuccess('Notification settings saved successfully!')
    } catch (error) {
      setError('Error saving notification settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSystem = async () => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // TODO: Implement actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSuccess('System settings saved successfully!')
    } catch (error) {
      setError('Error saving system settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground">Configure system preferences and security settings</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic system settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={generalSettings.companyName}
                    onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="systemName">System Name</Label>
                  <Input
                    id="systemName"
                    value={generalSettings.systemName}
                    onChange={(e) => setGeneralSettings({...generalSettings, systemName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={generalSettings.timezone}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, timezone: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ulaanbaatar">Asia/Ulaanbaatar (Mongolia)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={generalSettings.language}
                    onValueChange={(value) => setGeneralSettings({...generalSettings, language: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="mn">Монгол</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="autoLogout">Auto Logout (minutes)</Label>
                  <Input
                    id="autoLogout"
                    type="number"
                    value={generalSettings.autoLogout}
                    onChange={(e) => setGeneralSettings({...generalSettings, autoLogout: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <Button onClick={handleSaveGeneral} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save General Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure password policies and security features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Special Characters</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                    </div>
                    <Switch
                      checked={securitySettings.requireSpecialChars}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireSpecialChars: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Numbers</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain numbers</p>
                    </div>
                    <Switch
                      checked={securitySettings.requireNumbers}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireNumbers: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Uppercase</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain uppercase letters</p>
                    </div>
                    <Switch
                      checked={securitySettings.requireUppercase}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, requireUppercase: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Enable 2FA for all users</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>IP Whitelist</Label>
                      <p className="text-sm text-muted-foreground">Restrict access to specific IP addresses</p>
                    </div>
                    <Switch
                      checked={securitySettings.ipWhitelist}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, ipWhitelist: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Audit Logging</Label>
                      <p className="text-sm text-muted-foreground">Log all system activities for compliance</p>
                    </div>
                    <Switch
                      checked={securitySettings.auditLogging}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, auditLogging: checked})}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveSecurity} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Security Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure email and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Approval Reminders</Label>
                    <p className="text-sm text-muted-foreground">Send reminders for pending approvals</p>
                  </div>
                  <Switch
                    checked={notificationSettings.approvalReminders}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, approvalReminders: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Expiry Warnings</Label>
                    <p className="text-sm text-muted-foreground">Notify before access expires</p>
                  </div>
                  <Switch
                    checked={notificationSettings.expiryWarnings}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, expiryWarnings: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Send alerts for security events</p>
                  </div>
                  <Switch
                    checked={notificationSettings.securityAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, securityAlerts: checked})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reminderDays">Reminder Days Before Expiry</Label>
                  <Input
                    id="reminderDays"
                    type="number"
                    value={notificationSettings.reminderDays}
                    onChange={(e) => setNotificationSettings({...notificationSettings, reminderDays: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <Button onClick={handleSaveNotifications} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system performance and maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={systemSettings.maxFileSize}
                    onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={systemSettings.backupFrequency}
                    onValueChange={(value) => setSystemSettings({...systemSettings, backupFrequency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logRetention">Log Retention (days)</Label>
                  <Input
                    id="logRetention"
                    type="number"
                    value={systemSettings.logRetention}
                    onChange={(e) => setSystemSettings({...systemSettings, logRetention: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiRateLimit">API Rate Limit (requests/hour)</Label>
                  <Input
                    id="apiRateLimit"
                    type="number"
                    value={systemSettings.apiRateLimit}
                    onChange={(e) => setSystemSettings({...systemSettings, apiRateLimit: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Put system in maintenance mode</p>
                  </div>
                  <Switch
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenanceMode: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable debug logging</p>
                  </div>
                  <Switch
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => setSystemSettings({...systemSettings, debugMode: checked})}
                  />
                </div>
              </div>
              <Button onClick={handleSaveSystem} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save System Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
