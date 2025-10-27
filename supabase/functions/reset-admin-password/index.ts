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
    const newPassword = 'Samura14@';

    console.log('Resetting admin password...');

    // Get user by email
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === superAdminEmail);

    if (!user) {
      throw new Error('User not found');
    }

    console.log('Found user:', user.id);

    // Reset password
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { 
        password: newPassword,
        email_confirm: true
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('Password reset successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin password reset successfully',
        email: superAdminEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error resetting password:', error);
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
