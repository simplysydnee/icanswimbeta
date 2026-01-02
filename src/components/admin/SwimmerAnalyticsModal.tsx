'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Clock, TrendingUp, AlertTriangle, RefreshCw, Mail } from 'lucide-react'

interface AnalyticsData {
  total: number
  enrollment: {
    enrolled: number
    enrolledPercent: number
    withBookingsThisMonth: number
    withBookingsPercent: number
    waitlisted: number
    avgWaitlistDays: number
    dropped: number
    declined: number
  }
  engagement: {
    inactive30: number
    inactive60: number
    inactive90: number
    inactive30List: Array<{ id: string; name: string; parentEmail?: string }>
    inactive60List: Array<{ id: string; name: string; parentEmail?: string }>
    inactive90List: Array<{ id: string; name: string; parentEmail?: string }>
  }
  activity: {
    avgLessonsPerSwimmer: string
    mostActive: Array<{ id: string; name: string; bookings: number }>
  }
}

interface SwimmerAnalyticsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SwimmerAnalyticsModal({ open, onOpenChange }: SwimmerAnalyticsModalProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/swimmers/analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchAnalytics()
  }, [open, fetchAnalytics])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Swimmer Analytics
          </DialogTitle>
          <DialogDescription>
            View analytics and performance metrics for all swimmers.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button onClick={fetchAnalytics} variant="outline" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}

        {data && (
          <Tabs defaultValue="enrollment" className="space-y-4">
            <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full">
              <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
              <TabsTrigger value="engagement">Re-engagement</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Enrollment Tab */}
            <TabsContent value="enrollment" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{data.enrollment.enrolled}</div>
                    <p className="text-xs text-muted-foreground">Enrolled ({data.enrollment.enrolledPercent}%)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">{data.enrollment.withBookingsPercent}%</div>
                    <p className="text-xs text-muted-foreground">With bookings this month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-600">{data.enrollment.waitlisted}</div>
                    <p className="text-xs text-muted-foreground">Waitlisted</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{data.enrollment.avgWaitlistDays}</div>
                    <p className="text-xs text-muted-foreground">Avg days on waitlist</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="border-red-200">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-red-600">{data.enrollment.dropped}</div>
                      <p className="text-xs text-muted-foreground">Dropped</p>
                    </div>
                    <Badge variant="destructive">All time</Badge>
                  </CardContent>
                </Card>
                <Card className="border-orange-200">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-orange-600">{data.enrollment.declined}</div>
                      <p className="text-xs text-muted-foreground">Declined</p>
                    </div>
                    <Badge variant="outline">All time</Badge>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Engagement Tab */}
            <TabsContent value="engagement" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className={data.engagement.inactive30 > 0 ? 'border-yellow-300' : ''}>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-600">{data.engagement.inactive30}</div>
                    <p className="text-xs text-muted-foreground">No booking in 30 days</p>
                  </CardContent>
                </Card>
                <Card className={data.engagement.inactive60 > 0 ? 'border-orange-300' : ''}>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-orange-600">{data.engagement.inactive60}</div>
                    <p className="text-xs text-muted-foreground">No booking in 60 days</p>
                  </CardContent>
                </Card>
                <Card className={data.engagement.inactive90 > 0 ? 'border-red-300' : ''}>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-600">{data.engagement.inactive90}</div>
                    <p className="text-xs text-muted-foreground">No booking in 90 days</p>
                  </CardContent>
                </Card>
              </div>

              {data.engagement.inactive30 > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Need Re-engagement (30+ days inactive)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.engagement.inactive30List.map(swimmer => (
                        <div key={swimmer.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="font-medium">{swimmer.name}</span>
                          {swimmer.parentEmail && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.location.href = `mailto:${swimmer.parentEmail}?subject=We miss you at I Can Swim!`}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Email
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{data.activity.avgLessonsPerSwimmer}</div>
                  <p className="text-muted-foreground">Average lessons per swimmer</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Most Active Swimmers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.activity.mostActive.map((swimmer, i) => (
                      <div key={swimmer.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{i + 1}</Badge>
                          <span className="font-medium">{swimmer.name}</span>
                        </div>
                        <span className="text-muted-foreground">{swimmer.bookings} bookings</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}