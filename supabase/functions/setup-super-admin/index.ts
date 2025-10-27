import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const superAdminEmail = 'hunainm.qureshi@gmail.com';
    const superAdminPassword = 'Samura14@';

    console.log('Setting up super admin user...');

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === superAdminEmail);

    let userId: string;

    if (existingUser) {
      console.log('Super admin user already exists:', existingUser.id);
      userId = existingUser.id;
      
      // Update password
      await supabase.auth.admin.updateUserById(userId, {
        password: superAdminPassword
      });
      console.log('Password updated for super admin');
    } else {
      // Create super admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: superAdminEmail,
        password: superAdminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Super Admin'
        }
      });

      if (createError) {
        throw createError;
      }

      userId = newUser.user.id;
      console.log('Super admin user created:', userId);
    }

    // Check if super_admin role already exists
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .maybeSingle();

    if (!existingRole) {
      // Remove default 'user' role if it exists
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'user');

      // Add super_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'super_admin'
        });

      if (roleError) {
        throw roleError;
      }

      console.log('Super admin role assigned');
    } else {
      console.log('Super admin role already exists');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Super admin setup complete',
        email: superAdminEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error setting up super admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
