import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status if user exists
        if (session?.user) {
          await checkAdminStatus(session.user.id);
        } else {
          setIsAdmin(false);
        }
        
        // Always set loading to false after auth state change
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[useAuth] Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkAdminStatus(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    console.log('[useAuth] Checking admin status for user:', userId);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['super_admin', 'admin'])
        .maybeSingle();

      console.log('[useAuth] Admin check result:', { data, error });
      
      if (!error && data) {
        console.log('[useAuth] User is admin with role:', data.role);
        setIsAdmin(true);
      } else {
        console.log('[useAuth] User is not admin');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('[useAuth] Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    signOut
  };
};
