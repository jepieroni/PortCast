
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export const useAdminAccess = (onBack: () => void) => {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Access Denied",
          description: "You must be logged in to access admin features",
          variant: "destructive",
        });
        onBack();
        return;
      }

      setCurrentUser(user);

      // Check if user has global admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error checking role:', roleError);
      }

      setUserRole(roleData?.role || null);
      setLoading(false);

      if (!roleData || roleData.role !== 'global_admin') {
        toast({
          title: "Access Denied",
          description: "You need Global Admin privileges to access this area",
          variant: "destructive",
        });
        onBack();
      }
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive",
      });
      onBack();
    }
  };

  const assignGlobalAdminToSelf = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: currentUser.id,
          role: 'global_admin' as UserRole,
          assigned_by: currentUser.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Assigned",
            description: "You already have the Global Admin role",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Global Admin role assigned successfully",
        });
        setUserRole('global_admin');
      }
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign Global Admin role",
        variant: "destructive",
      });
    }
  };

  return {
    currentUser,
    userRole,
    loading,
    assignGlobalAdminToSelf
  };
};
