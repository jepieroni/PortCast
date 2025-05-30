
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set up auth state listener FIRST
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session?.user?.id || 'No session');
          
          if (!mounted) return;

          if (event === 'SIGNED_OUT' || !session) {
            console.log('User signed out, clearing state');
            setUser(null);
            setIsGlobalAdmin(false);
            setIsOrgAdmin(false);
            setLoading(false);
            return;
          }

          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            console.log('User signed in');
            setUser(session.user);
            if (session.user) {
              // Use setTimeout to prevent blocking the auth state change
              setTimeout(() => {
                if (mounted) {
                  checkUserRole(session.user.id);
                }
              }, 0);
            } else {
              setLoading(false);
            }
          }
        });

        // THEN check for existing session
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
          setIsOrgAdmin(false);
          setLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Unexpected error during auth initialization:', error);
        if (mounted) {
          setUser(null);
          setIsGlobalAdmin(false);
          setIsOrgAdmin(false);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
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

      const isGlobalAdminUser = roleData?.role === 'global_admin';
      const isOrgAdminUser = roleData?.role === 'org_admin';
      
      console.log('User roles:', { isGlobalAdmin: isGlobalAdminUser, isOrgAdmin: isOrgAdminUser });
      
      setIsGlobalAdmin(isGlobalAdminUser);
      setIsOrgAdmin(isOrgAdminUser);
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsGlobalAdmin(false);
      setIsOrgAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      console.log('Sign out completed successfully');
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
      
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      toast({
        title: "Error",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    loading,
    isGlobalAdmin,
    isOrgAdmin,
    handleSignOut
  };
};
