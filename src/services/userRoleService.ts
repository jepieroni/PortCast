
import { supabase } from '@/integrations/supabase/client';

export interface UserRoles {
  isGlobalAdmin: boolean;
  isOrgAdmin: boolean;
}

export const checkUserRole = async (userId: string): Promise<UserRoles> => {
  try {
    console.log('Checking user role for:', userId);
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking user role:', error);
      return { isGlobalAdmin: false, isOrgAdmin: false };
    }

    const isGlobalAdmin = roleData?.role === 'global_admin';
    const isOrgAdmin = roleData?.role === 'org_admin';
    
    console.log('User roles:', { isGlobalAdmin, isOrgAdmin });
    
    return { isGlobalAdmin, isOrgAdmin };
  } catch (error) {
    console.error('Error checking user role:', error);
    return { isGlobalAdmin: false, isOrgAdmin: false };
  }
};
