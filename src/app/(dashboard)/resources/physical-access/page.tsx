'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DoorOpen, Plus } from 'lucide-react'

export default function ResourcePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <DoorOpen className="mr-3 h-8 w-8" />
              Physical Access
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage building and room access permissions
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Physical Acces
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Physical Access Resources</CardTitle>
          <CardDescription>
            Manage building and room access permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <DoorOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Physical Access Management Coming Soon
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              This feature is under development. You'll be able to manage and track
              all your Physical Access resources and access permissions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
