'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SwimmerCard } from '@/components/parent/swimmer-card'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

interface Swimmer {
  id: string
  first_name: string
  last_name: string
  photo_url?: string
  enrollment_status: string
  current_level?: {
    name: string
    display_name: string
    color?: string
  }
}

export default function SwimmersPage() {
  const { user } = useAuth()
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSwimmers = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('swimmers')
          .select(`
            id,
            first_name,
            last_name,
            photo_url,
            enrollment_status,
            current_level:swim_levels(name, display_name, color)
          `)
          .eq('parent_id', user.id)
          .order('first_name')

        if (error) throw error
        setSwimmers(data || [])
      } catch (error) {
        console.error('Error fetching swimmers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSwimmers()
  }, [user, supabase])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Swimmers</h1>
          <p className="text-muted-foreground mt-2">
            Manage all your swimmers in one place
          </p>
        </div>
        <Button asChild>
          <Link href="/parent/swimmers/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Swimmer
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{swimmers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swimmers.filter(s => s.enrollment_status === 'enrolled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Waitlist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swimmers.filter(s => s.enrollment_status === 'waitlist').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {swimmers.filter(s => s.enrollment_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Swimmers Grid */}
      {swimmers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No swimmers yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add your first swimmer to get started with swim lessons. You&apos;ll be able to track their progress and book sessions.
              </p>
              <Button asChild size="lg">
                <Link href="/parent/swimmers/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Swimmer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {swimmers.map((swimmer) => (
            <SwimmerCard key={swimmer.id} swimmer={swimmer} />
          ))}
        </div>
      )}
    </div>
  )
}