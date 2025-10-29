import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AddInstructorRequest {
  fullName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roles) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { fullName, email }: AddInstructorRequest = await req.json();

    if (!fullName || !email) {
      throw new Error("Full name and email are required");
    }

    console.log(`Processing instructor account for: ${fullName} (${email})`);

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === email);

    let userId: string;

    if (userExists) {
      console.log(`User already exists with ID: ${userExists.id}`);
      userId = userExists.id;

      // Update their profile name if needed
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile:", profileError);
      }

      // Remove parent role if they have it
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "parent");

    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      userId = authData.user.id;
      console.log(`Auth user created with ID: ${userId}`);
    }

    // Assign or update instructor role (use upsert to handle existing role)
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: userId,
        role: "instructor",
      }, {
        onConflict: "user_id,role"
      });

    if (roleInsertError) {
      console.error("Error assigning instructor role:", roleInsertError);
      throw roleInsertError;
    }

    console.log(`Instructor role assigned to user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        instructor: {
          id: userId,
          full_name: fullName,
          email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in add-instructor function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Unauthorized") ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
