"use client"

import { SwimmerManagementTable } from "@/components/swimmers/SwimmerManagementTable"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestSwimmerManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Swimmer Management Table Demo</h1>
        <p className="text-muted-foreground mt-2">
          This page demonstrates the SwimmerManagementTable component with different user roles.
        </p>
      </div>

      <Tabs defaultValue="admin" className="space-y-6">
        <TabsList>
          <TabsTrigger value="admin">Admin View</TabsTrigger>
          <TabsTrigger value="instructor">Instructor View</TabsTrigger>
        </TabsList>

        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Swimmer Management</CardTitle>
              <CardDescription>
                Full administrative access with all actions: approve/decline pending swimmers, edit swimmers, view progress, and book sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SwimmerManagementTable role="admin" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Approve/Decline pending swimmers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Edit swimmer details</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>View progress history</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Book sessions for swimmers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Access to all filters and search</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Component Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Debounced search (300ms)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Filter by status, funding, level</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Sortable columns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Pagination (25/50/100 per page)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Row click opens detail drawer</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instructor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Swimmer Management</CardTitle>
              <CardDescription>
                Instructor access focused on progress tracking: view details, add progress notes, and view progress history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SwimmerManagementTable role="instructor" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructor Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>View swimmer details</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Add progress notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>View progress history</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                  <span className="text-muted-foreground">Cannot edit swimmer details</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                  <span className="text-muted-foreground">Cannot approve/decline swimmers</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Display</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Swimmer avatar with initials</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Age calculated from DOB</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Parent name and email</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Status and funding badges</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Lessons count with milestone emojis</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
          <CardDescription>
            The SwimmerManagementTable component is ready for integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">API Integration</h3>
            <ul className="text-sm space-y-1 list-disc pl-5">
              <li>Admin role uses: <code className="bg-muted px-1 rounded">/api/admin/swimmers</code></li>
              <li>Instructor role uses: <code className="bg-muted px-1 rounded">/api/instructor/swimmers</code></li>
              <li>Supports query params: search, status, funding, level, sort, order, page, limit</li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">URL Persistence</h3>
            <p className="text-sm">
              All filters, sort, and pagination state is persisted in URL search params.
              This allows bookmarking, sharing, and browser back/forward navigation.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">To Use in Your App</h3>
            <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`import { SwimmerManagementTable } from "@/components/swimmers/SwimmerManagementTable"

// In your admin page:
<SwimmerManagementTable role="admin" />

// In your instructor page:
<SwimmerManagementTable role="instructor" />`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}