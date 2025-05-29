
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('Initial session:', session?.user?.id || 'No session');

        if (session?.user) {
          setUser(session.user);
          await checkUserRole(session.user.id);
        } else {
          setUser(null);
          setIsGlobalAdmin(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Unexpected error getting session:', error);
        if (mounted) {
          setUser(null);
          setIsGlobalAdmin(false);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id || 'No session');
      
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out, clearing state');
        setUser(null);
        setIsGlobalAdmin(false);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN') {
        console.log('User signed in');
        setUser(session.user);
        if (session.user) {
          await checkUserRole(session.user.id);
        }
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRole = async (userId: string) => {
    try {
      console.log('Checking user role for:', userId);
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking user role:', error);
      }

      const isAdmin = roleData?.role === 'global_admin';
      console.log('User is admin:', isAdmin);
      setIsGlobalAdmin(isAdmin);
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsGlobalAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      setLoading(true);
      
      // Clear local state immediately
      setUser(null);
      setIsGlobalAdmin(false);
      
      // Set a timeout to prevent hanging
      const signOutTimeout = setTimeout(() => {
        console.warn('Sign out took too long, forcing completion');
        setLoading(false);
        toast({
          title: "Signed out",
          description: "You have been signed out successfully",
        });
      }, 5000); // 5 second timeout
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      clearTimeout(signOutTimeout);
      
      if (error) {
        console.error('Sign out error:', error);
        // Don't treat this as a failure - user state is already cleared
      }
      
      console.log('Sign out completed');
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      // Still show success message since we cleared local state
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    isGlobalAdmin,
    handleSignOut
  };
};
