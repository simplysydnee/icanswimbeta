import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Demo accounts to create
    const demoAccounts = [
      {
        email: 'parent@icanswim209.com',
        password: 'Demo2024!Parent',
        role: 'parent',
        fullName: 'Demo Parent'
      },
      {
        email: 'instructor@icanswim209.com',
        password: 'Demo2024!Instructor',
        role: 'instructor',
        fullName: 'Demo Instructor'
      },
      {
        email: 'admin@icanswim209.com',
        password: 'Demo2024!Admin',
        role: 'admin',
        fullName: 'Demo Admin'
      }
    ];

    const results = [];

    for (const account of demoAccounts) {
      console.log(`Creating demo account: ${account.email}`);
      
      // Create user with admin client
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.fullName
        }
      });

      if (userError) {
        console.error(`Error creating ${account.email}:`, userError);
        results.push({
          email: account.email,
          success: false,
          error: userError.message
        });
        continue;
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: account.email,
          full_name: account.fullName
        });

      if (profileError) {
        console.error(`Error creating profile for ${account.email}:`, profileError);
      }

      // Assign role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: userData.user.id,
          role: account.role
        });

      if (roleError) {
        console.error(`Error assigning role for ${account.email}:`, roleError);
        results.push({
          email: account.email,
          success: false,
          error: roleError.message
        });
        continue;
      }

      results.push({
        email: account.email,
        password: account.password,
        role: account.role,
        success: true
      });

      console.log(`Successfully created ${account.email} with role ${account.role}`);
    }

    return new Response(
      JSON.stringify({
        message: 'Demo accounts setup complete',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in setup-demo-accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
