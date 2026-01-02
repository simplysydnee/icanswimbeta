'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, DollarSign, TrendingUp, Clock, Users, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

interface BillingData {
  byFundingSource: Array<{
    name: string
    monthlyBilled: number
    ytdBilled: number
    monthlyPaid: number
    ytdPaid: number
    outstanding: number
    overdueAmount: number
    overdueCount: number
    pendingAuthCount: number
  }>
  byCoordinator: Array<{
    name: string
    email: string
    pendingAuth: number
    overduePOs: number
    totalPOs: number
  }>
  privatePay: {
    monthlyRevenue: number
    ytdRevenue: number
    outstanding: number
  }
  weeklyBilling: Array<{ week: string; amount: number }>
  byInstructor: Array<{ name: string; revenue: number; sessions: number }>
  aging: {
    current: number
    days30: number
    days60: number
    days90: number
  }
  totals: {
    monthlyBilled: number
    ytdBilled: number
    monthlyPaid: number
    ytdPaid: number
    totalOutstanding: number
    totalOverdue: number
  }
}

export function ComprehensiveBillingReport() {
  const [data, setData] = useState<BillingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/reports/billing')
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to fetch')
      }
      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <div className="flex justify-center p-8"><RefreshCw className="h-6 w-6 animate-spin" /></div>

  if (error) return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 font-medium">Error Loading Report</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <Button onClick={fetchData} variant="outline">Retry</Button>
      </CardContent>
    </Card>
  )

  if (!data) return null

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Monthly Billed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(data.totals.monthlyBilled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Monthly Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{fmt(data.totals.monthlyPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{fmt(data.totals.totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{fmt(data.totals.totalOverdue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* By Funding Source */}
      <Card>
        <CardHeader>
          <CardTitle>By Funding Source</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">YTD</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Overdue</TableHead>
                <TableHead className="text-right">Pending Auth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.byFundingSource.map(fs => (
                <TableRow key={fs.name}>
                  <TableCell className="font-medium">{fs.name}</TableCell>
                  <TableCell className="text-right">{fmt(fs.monthlyBilled)}</TableCell>
                  <TableCell className="text-right">{fmt(fs.ytdBilled)}</TableCell>
                  <TableCell className="text-right text-green-600">{fmt(fs.ytdPaid)}</TableCell>
                  <TableCell className="text-right text-yellow-600">{fmt(fs.outstanding)}</TableCell>
                  <TableCell className="text-right">
                    {fs.overdueCount > 0 && (
                      <Badge variant="destructive">{fs.overdueCount} ({fmt(fs.overdueAmount)})</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {fs.pendingAuthCount > 0 && (
                      <Badge variant="outline">{fs.pendingAuthCount}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Private Pay + Aging */}
      <div className="grid md:grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Private Pay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monthly Revenue</span>
              <span className="font-bold">{fmt(data.privatePay.monthlyRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">YTD Revenue</span>
              <span className="font-bold">{fmt(data.privatePay.ytdRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aging Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Current</span>
              <span className="font-medium">{fmt(data.aging.current)}</span>
            </div>
            <div className="flex justify-between">
              <span>1-30 Days</span>
              <span className="font-medium text-yellow-600">{fmt(data.aging.days30)}</span>
            </div>
            <div className="flex justify-between">
              <span>31-60 Days</span>
              <span className="font-medium text-orange-600">{fmt(data.aging.days60)}</span>
            </div>
            <div className="flex justify-between">
              <span>61-90+ Days</span>
              <span className="font-medium text-red-600">{fmt(data.aging.days90)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coordinator Issues */}
      {data.byCoordinator.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Coordinator Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Pending Auth</TableHead>
                  <TableHead className="text-right">Overdue POs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byCoordinator.map(coord => (
                  <TableRow key={coord.email || coord.name}>
                    <TableCell className="font-medium">{coord.name}</TableCell>
                    <TableCell className="text-muted-foreground">{coord.email}</TableCell>
                    <TableCell className="text-right">
                      {coord.pendingAuth > 0 && <Badge variant="outline">{coord.pendingAuth}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {coord.overduePOs > 0 && <Badge variant="destructive">{coord.overduePOs}</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Billing (Last 4 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {data.weeklyBilling.map(week => (
              <div key={week.week} className="flex-1 text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{week.week}</p>
                <p className="text-lg font-bold">{fmt(week.amount)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Instructor */}
      {data.byInstructor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Instructor</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.byInstructor.map(instructor => (
                  <TableRow key={instructor.name}>
                    <TableCell className="font-medium">{instructor.name}</TableCell>
                    <TableCell className="text-right">{instructor.sessions}</TableCell>
                    <TableCell className="text-right">{fmt(instructor.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}