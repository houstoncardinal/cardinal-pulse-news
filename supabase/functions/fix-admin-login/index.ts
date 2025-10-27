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

    const targetEmail = 'hunainm.qureshi@gmail.com';
    const targetPassword = 'Samura14@';

    console.log('Starting admin login fix...');

    // List all users to find our target user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }

    const user = users.find(u => u.email === targetEmail);

    if (!user) {
      console.log('User not found, creating...');
      
      // Create the user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: targetEmail,
        password: targetPassword,
        email_confirm: true,
        user_metadata: {
          full_name: 'Super Admin'
        }
      });

      if (createError) {
        console.error('Error creating user:', createError);
        throw createError;
      }

      console.log('User created:', newUser.user.id);

      // Assign super_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: newUser.user.id,
          role: 'super_admin'
        }, {
          onConflict: 'user_id,role'
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User created and configured',
          userId: newUser.user.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User found:', user.id, 'Email confirmed:', user.email_confirmed_at);

    // Delete the existing user and recreate
    console.log('Deleting existing user to recreate...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw deleteError;
    }

    console.log('User deleted, now recreating...');

    // Create fresh user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: targetEmail,
      password: targetPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Super Admin'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('User recreated:', newUser.user.id);

    // Assign super_admin role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: newUser.user.id,
        role: 'super_admin'
      }, {
        onConflict: 'user_id,role'
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
    } else {
      console.log('Super admin role assigned');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin login fixed - user recreated with correct password',
        email: targetEmail,
        userId: newUser.user.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fixing admin login:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
