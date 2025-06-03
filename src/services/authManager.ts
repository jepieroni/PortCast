
import { supabase } from '@/integrations/supabase/client';
import type { AuthState, AuthCallback } from '@/types/auth';

// Module-level singleton - only one instance ever exists
let authManagerInstance: AuthManager | null = null;

export class AuthManager {
  private isInitialized = false;
  private isInitializing = false;
  private subscription: any = null;
  private callbacks: Set<AuthCallback> = new Set();
  private currentAuthState: AuthState = { user: null, loading: true };

  static getInstance(): AuthManager {
    if (!authManagerInstance) {
      authManagerInstance = new AuthManager();
    }
    return authManagerInstance;
  }

  getCurrentState(): AuthState {
    return this.currentAuthState;
  }

  async initialize(): Promise<void> {
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
        
        const authState: AuthState = {
          user: session?.user || null,
          event,
          loading: false
        };

        this.currentAuthState = authState;
        this.notifyCallbacks(authState);
      });

      this.subscription = subscription;

      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        const authState: AuthState = { user: null, event: 'SIGNED_OUT', loading: false };
        this.currentAuthState = authState;
        this.notifyCallbacks(authState);
        return;
      }

      console.log('Initial session:', session?.user?.id || 'No session');
      
      const authState: AuthState = {
        user: session?.user || null,
        event: session ? 'INITIAL_SESSION' : 'SIGNED_OUT',
        loading: false
      };

      this.currentAuthState = authState;
      this.notifyCallbacks(authState);
      this.isInitialized = true;

    } catch (error) {
      console.error('Unexpected error during auth initialization:', error);
      const authState: AuthState = { user: null, event: 'SIGNED_OUT', loading: false };
      this.currentAuthState = authState;
      this.notifyCallbacks(authState);
    } finally {
      this.isInitializing = false;
    }
  }

  subscribe(callback: AuthCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately call with current state
    callback(this.currentAuthState);
    
    // Initialize if not already done
    if (!this.isInitialized && !this.isInitializing) {
      this.initialize();
    }

    return () => {
      this.callbacks.delete(callback);
    };
  }

  private notifyCallbacks(authState: AuthState): void {
    this.callbacks.forEach(callback => callback(authState));
  }

  cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.callbacks.clear();
    this.isInitialized = false;
    this.isInitializing = false;
    this.currentAuthState = { user: null, loading: true };
  }
}
