'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('Loading...');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAuth = async () => {
      try {
        setStatus('Creating Supabase client...');
        const supabase = createClient();

        setStatus('Calling supabase.auth.getUser()...');
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          setError(`Auth error: ${error.message}`);
          setStatus('Failed');
          return;
        }

        if (!user) {
          setStatus('No user logged in');
          return;
        }

        setUser(user);
        setStatus(`User found: ${user.email}`);

        // Test user_roles query
        setStatus('Querying user_roles table...');
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        if (rolesError) {
          setError(`Roles error: ${rolesError.message}`);
        } else {
          setStatus(`Success! Found ${roles?.length || 0} roles`);
        }
      } catch (err) {
        setError(`Unexpected error: ${err}`);
        setStatus('Failed');
      }
    };

    testAuth();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Status</h2>
        <p className="text-lg">{status}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h2 className="font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      )}

      {user && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
          <h2 className="font-bold mb-2">User Info</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-bold mb-2">Next Steps</h2>
        <ul className="list-disc ml-4">
          <li>If "No user logged in", go to <a href="/login" className="text-blue-600 underline">/login</a></li>
          <li>If "Auth error", check Supabase connection</li>
          <li>If "Roles error", check user_roles table exists</li>
          <li>If success, admin page should work</li>
        </ul>
      </div>
    </div>
  );
}