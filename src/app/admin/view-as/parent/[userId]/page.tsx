import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Calendar } from 'lucide-react'

export default async function ViewParentPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, last_login_at, login_count')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  const { data: swimmers } = await supabase
    .from('swimmers')
    .select(`
      id, first_name, last_name, enrollment_status,
      current_level:swim_levels(name, display_name)
    `)
    .eq('parent_id', userId)
    .order('first_name')

  const typedSwimmers = (swimmers ?? []).map((s: any) => ({
    ...s,
    current_level: Array.isArray(s.current_level) ? s.current_level[0] : s.current_level,
  }))

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, status,
      session:sessions!inner(id, start_time, end_time, location, session_type, instructor:profiles(full_name)),
      swimmer:swimmers(id, first_name, last_name)
    `)
    .eq('parent_id', userId)
    .in('status', ['confirmed', 'pending_auth'])
    .gte('session.start_time', new Date().toISOString())
    .order('start_time', { referencedTable: 'sessions', ascending: true })
    .limit(20)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin banner */}
      <div className="bg-amber-500 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Viewing as parent: {profile.full_name || profile.email}</span>
        </div>
        <Link
          href="/admin/users"
          className="text-sm bg-white text-amber-700 px-4 py-1.5 rounded-md hover:bg-amber-50 transition-colors font-medium"
        >
          Back to Users
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile card */}
        <div className="bg-white rounded-lg border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name || 'Unnamed'}</h1>
              <p className="text-muted-foreground">{profile.email}</p>
              {profile.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {profile.last_login_at ? (
                <p>Last login: {new Date(profile.last_login_at).toLocaleString()}</p>
              ) : (
                <p>Never logged in</p>
              )}
              <p>Logins: {profile.login_count ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Swimmers */}
        <div className="bg-white rounded-lg border mb-8">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Swimmers ({typedSwimmers.length})</h2>
          </div>
          {typedSwimmers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No swimmers linked to this parent.</p>
            </div>
          ) : (
            <div className="divide-y">
              {typedSwimmers.map((s: any) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.first_name} {s.last_name}</p>
                    {s.current_level && (
                      <p className="text-sm text-muted-foreground">{s.current_level.display_name}</p>
                    )}
                  </div>
                  <span className="text-sm capitalize px-3 py-1 rounded-full bg-gray-100">
                    {s.enrollment_status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg border">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Upcoming Bookings ({bookings?.length ?? 0})</h2>
          </div>
          {!bookings || bookings.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No upcoming bookings.</p>
            </div>
          ) : (
            <div className="divide-y">
              {bookings.map((b: any) => (
                <div key={b.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {b.swimmer.first_name} {b.swimmer.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {b.session.instructor?.full_name || 'TBD'} &middot; {b.session.location}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{new Date(b.session.start_time).toLocaleDateString()}</p>
                    <p className="text-muted-foreground">
                      {new Date(b.session.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
