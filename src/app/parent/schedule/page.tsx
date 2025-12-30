'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequireAuthRedirect } from '@/components/auth/RequireAuthRedirect';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

function ParentScheduleContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchBookings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          session:sessions(id, start_time, end_time, location, instructor:profiles(full_name)),
          swimmer:swimmers(first_name, last_name)
        `)
        .eq('parent_id', user.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      // Filter to upcoming only (client-side)
      const now = new Date();
      const upcoming = (data || [])
        .filter(b => b.session && new Date(b.session.start_time) >= now)
        .sort((a, b) => new Date(a.session.start_time).getTime() - new Date(b.session.start_time).getTime());

      setBookings(upcoming);
      setLoading(false);
    }

    fetchBookings();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading schedule...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Upcoming Sessions</h1>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No upcoming sessions scheduled.</p>
            <a href="/parent/book" className="text-cyan-600 hover:underline mt-2 inline-block">
              Book a session →
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {format(new Date(booking.session.start_time), 'EEEE, MMMM d')}
                    </p>
                    <p className="text-muted-foreground">
                      {format(new Date(booking.session.start_time), 'h:mm a')} -
                      {format(new Date(booking.session.end_time), 'h:mm a')}
                    </p>
                    <p className="text-sm mt-1">
                      {booking.swimmer.first_name} {booking.swimmer.last_name}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{booking.session.location}</p>
                    {booking.session.instructor && (
                      <p>with {booking.session.instructor.full_name}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ParentSchedulePage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <RequireAuthRedirect>
        <ParentScheduleContent />
      </RequireAuthRedirect>
    </Suspense>
  );
}