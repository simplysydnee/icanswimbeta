'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Star, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { attendancePriorityService } from '@/lib/attendance-priority'
import { useToast } from '@/hooks/use-toast'
import { format, subMonths } from 'date-fns'

export function AttendancePriorityCard() {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [perfectSwimmers, setPerfectSwimmers] = useState<any[]>([])
  const [lastResult, setLastResult] = useState<{
    granted: string[]
    skipped: string[]
    errors: string[]
  } | null>(null)

  const { toast } = useToast()
  const lastMonth = subMonths(new Date(), 1)

  const checkAttendance = async () => {
    setChecking(true)
    try {
      const swimmers = await attendancePriorityService.getSwimmersWithPerfectAttendance(lastMonth)
      setPerfectSwimmers(swimmers)
      toast({
        title: `Found ${swimmers.length} swimmer(s) with perfect attendance`,
        description: swimmers.length > 0 ? 'Ready to grant priority booking' : 'No perfect attendance found'
      })
    } catch (error) {
      console.error('Error checking attendance:', error)
      toast({
        title: 'Failed to check attendance',
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setChecking(false)
    }
  }

  const grantPriority = async () => {
    setLoading(true)
    try {
      const result = await attendancePriorityService.grantAttendancePriority(lastMonth)
      setLastResult(result)

      if (result.granted.length > 0) {
        toast({
          title: `Granted priority to ${result.granted.length} swimmer(s)`,
          description: result.granted.join(', ')
        })
      } else {
        toast({
          title: 'No new priorities granted',
          description: result.skipped.length > 0
            ? `${result.skipped.length} swimmer(s) already have priority`
            : 'No swimmers with perfect attendance found'
        })
      }
    } catch (error) {
      console.error('Error granting priority:', error)
      toast({
        title: 'Failed to grant priorities',
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const clearExpired = async () => {
    setLoading(true)
    try {
      const count = await attendancePriorityService.clearExpiredPriorities()
      toast({
        title: `Cleared ${count} expired priority booking(s)`,
        description: count > 0 ? 'Expired attendance priorities have been removed' : 'No expired priorities found'
      })
    } catch (error) {
      console.error('Error clearing expired:', error)
      toast({
        title: 'Failed to clear expired priorities',
        variant: 'destructive',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Attendance Priority
        </CardTitle>
        <CardDescription>
          Automatically grant priority booking to swimmers with perfect attendance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          Checking: {format(lastMonth, 'MMMM yyyy')}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={checkAttendance} disabled={checking} variant="outline">
            {checking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Check Attendance
          </Button>

          <Button onClick={grantPriority} disabled={loading || perfectSwimmers.length === 0}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Star className="h-4 w-4 mr-2" />}
            Grant Priority ({perfectSwimmers.length})
          </Button>

          <Button onClick={clearExpired} disabled={loading} variant="ghost">
            Clear Expired
          </Button>
        </div>

        {perfectSwimmers.length > 0 && (
          <div className="border rounded-md p-3 space-y-2">
            <p className="text-sm font-medium">Perfect Attendance:</p>
            <div className="flex flex-wrap gap-2">
              {perfectSwimmers.map(s => (
                <Badge key={s.swimmerId} variant="secondary">
                  {s.swimmerName} ({s.attended} sessions)
                </Badge>
              ))}
            </div>
          </div>
        )}

        {lastResult && (
          <div className="border rounded-md p-3 space-y-2 text-sm">
            <p className="font-medium">Last Run Results:</p>
            {lastResult.granted.length > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                Granted: {lastResult.granted.join(', ')}
              </div>
            )}
            {lastResult.skipped.length > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <XCircle className="h-4 w-4" />
                Skipped (already priority): {lastResult.skipped.join(', ')}
              </div>
            )}
            {lastResult.errors.length > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                Errors: {lastResult.errors.join(', ')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}