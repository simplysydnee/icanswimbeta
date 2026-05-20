import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'

export default async function ViewCoordinatorPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, last_login_at, login_count')
    .eq('id', userId)
    .single()

  if (!profile) notFound()

  const { data: clients } = await supabase
    .from('swimmers')
    .select(`
      id, first_name, last_name, enrollment_status, payment_type,
      funding_source:funding_sources(name),
      current_level:swim_levels(name, display_name)
    `)
    .eq('coordinator_id', userId)
    .order('first_name')

  type ClientRow = typeof clients extends (infer U)[] ? U : never
  const typedClients = (clients ?? []).map((c: any) => ({
    ...c,
    current_level: Array.isArray(c.current_level) ? c.current_level[0] : c.current_level,
    funding_source: Array.isArray(c.funding_source) ? c.funding_source[0] : c.funding_source,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin banner */}
      <div className="bg-amber-500 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Viewing as coordinator: {profile.full_name || profile.email}</span>
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

        {/* Clients */}
        <div className="bg-white rounded-lg border">
          <div className="flex items-center gap-2 px-6 py-4 border-b">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Clients ({typedClients.length})</h2>
          </div>
          {typedClients.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 text-gray-300" />
              <p>No clients assigned to this coordinator.</p>
            </div>
          ) : (
            <div className="divide-y">
              {typedClients.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.first_name} {s.last_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.current_level?.display_name || 'No level'}
                      {s.funding_source ? ` · ${s.funding_source.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground capitalize">{s.payment_type?.replace(/_/g, ' ') || '—'}</span>
                    <span className="text-sm capitalize px-3 py-1 rounded-full bg-gray-100">
                      {s.enrollment_status.replace(/_/g, ' ')}
                    </span>
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
