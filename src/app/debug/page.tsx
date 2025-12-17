'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const errorList: string[] = [];

      // Get auth user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        errorList.push(`Auth error: ${userError.message}`);
      }
      setUser(user);

      if (user) {
        // Get roles from user_roles table
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.id);

        if (rolesError) {
          errorList.push(`Roles error: ${rolesError.message}`);
        }
        setRoles(rolesData || []);
      }

      setErrors(errorList);
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Debug: Auth Status</h1>
        <div className="flex items-center space-x-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p>Loading debug information...</p>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Check browser console for debug logs
        </p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Debug: Auth Status</h1>

      {errors.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">
          <h2 className="font-bold">Errors:</h2>
          <ul className="list-disc ml-4">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Auth User</h2>
        {user ? (
          <div>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <p className="text-red-600">No user logged in</p>
        )}
      </div>


      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Roles (from user_roles table)</h2>
        {roles.length > 0 ? (
          <div>
            <ul className="list-disc ml-4">
              {roles.map((r, i) => <li key={i}><strong>{r.role}</strong> (created: {new Date(r.created_at).toLocaleDateString()})</li>)}
            </ul>
            <p className="mt-2"><strong>Valid roles:</strong> parent, instructor, admin, coordinator</p>
            <p className="mt-1 text-sm text-gray-600">Note: System uses user_roles table for role-based access control</p>
          </div>
        ) : (
          <p className="text-yellow-600">No roles found in user_roles table</p>
        )}
      </div>

      {user && (
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h2 className="font-bold mb-2">Add Admin Role</h2>
          <p className="text-sm text-gray-600 mb-3">
            Click below to add admin role to your user ({user.email})
          </p>
          <button
            onClick={async () => {
              setAddingAdmin(true);
              const supabase = createClient();
              try {
                // Check if already has admin role
                const hasAdmin = roles.some(r => r.role === 'admin');
                if (hasAdmin) {
                  alert('You already have admin role!');
                  return;
                }

                // Add admin role
                const { error } = await supabase
                  .from('user_roles')
                  .insert({
                    user_id: user.id,
                    role: 'admin',
                    created_at: new Date().toISOString()
                  });

                if (error) {
                  alert(`Error adding admin role: ${error.message}`);
                } else {
                  alert('Admin role added successfully! Refresh page to see changes.');
                  // Refresh roles
                  const { data: newRoles } = await supabase
                    .from('user_roles')
                    .select('*')
                    .eq('user_id', user.id);
                  setRoles(newRoles || []);
                }
              } catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
              } finally {
                setAddingAdmin(false);
              }
            }}
            disabled={addingAdmin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingAdmin ? 'Adding Admin Role...' : 'Add Admin Role to My Account'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Note: This will add the 'admin' role to your user in the user_roles table.
          </p>
        </div>
      )}
    </div>
  );
}