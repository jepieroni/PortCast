
import { supabase } from '@/integrations/supabase/client';

export const signOut = async (): Promise<void> => {
  console.log('Starting sign out process...');
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
  
  console.log('Sign out completed successfully');
};
