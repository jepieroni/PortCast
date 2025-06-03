
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Global singleton to prevent multiple auth initializations
class AuthManager {
  private static instance: AuthManager;
  private isInitialized = false;
  private isInitializing = false;
  private subscription: any = null;
  private callbacks: Set<(authState: any) => void> = new Set();

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    console.log('Initializing auth manager...');

    try {
      // Clean up any existing subscription
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }

      // Set up auth state listener
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id || 'No session');
        
        const authState = {
          user: session?.user || null,
          event,
          loading: false
        };

        // Notify all subscribers
        this.callbacks.forEach(callback => callback(authState));
      });

      this.subscription = subscription;

      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        this.notifyCallbacks({ user: null, event: 'SIGNED_OUT', loading: false });
        return;
      }

      console.log('Initial session:', session?.user?.id || 'No session');
      
      const authState = {
        user: session?.user || null,
        event: session ? 'INITIAL_SESSION' : 'SIGNED_OUT',
        loading: false
      };

      this.notifyCallbacks(authState);
      this.isInitialized = true;

    } catch (error) {
      console.error('Unexpected error during auth initialization:', error);
      this.notifyCallbacks({ user: null, event: 'SIGNED_OUT', loading: false });
    } finally {
      this.isInitializing = false;
    }
  }

  subscribe(callback: (authState: any) => void) {
    this.callbacks.add(callback);
    
    // Initialize if not already done
    if (!this.isInitialized && !this.isInitializing) {
      this.initialize();
    }

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(authState: any) {
    this.callbacks.forEach(callback => callback(authState));
  }

  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.callbacks.clear();
    this.isInitialized = false;
    this.isInitializing = false;
  }
}

export const useAuth = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  const authManager = useRef(AuthManager.getInstance());

  useEffect(() => {
    const unsubscribe = authManager.current.subscribe(async (authState) => {
      const { user, event } = authState;

      if (event === 'SIGNED_OUT' || !user) {
        console.log('User signed out, clearing state');
        setUser(null);
        setIsGlobalAdmin(false);
        setIsOrgAdmin(false);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        console.log('User signed in');
        setUser(user);
        if (user) {
          await checkUserRole(user.id);
        } else {
          setLoading(false);
        }
      }
    });

    return unsubscribe;
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
