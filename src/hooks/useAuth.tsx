
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthManager } from '@/services/authManager';
import { checkUserRole, type UserRoles } from '@/services/userRoleService';
import { signOut } from '@/services/authService';

export const useAuth = () => {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  useEffect(() => {
    const authManager = AuthManager.getInstance();
    
    const unsubscribe = authManager.subscribe(async (authState) => {
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
          await handleUserRoleCheck(user.id);
        } else {
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const handleUserRoleCheck = async (userId: string): Promise<void> => {
    try {
      const roles: UserRoles = await checkUserRole(userId);
      setIsGlobalAdmin(roles.isGlobalAdmin);
      setIsOrgAdmin(roles.isOrgAdmin);
    } catch (error) {
      console.error('Error checking user role:', error);
      setIsGlobalAdmin(false);
      setIsOrgAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
      
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
