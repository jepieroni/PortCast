
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAccountSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const handleSetupAccount = async (token: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Setting up account with token:', token);
      
      const { data, error } = await supabase.rpc('setup_user_account', {
        _token: token,
        _password: password
      });

      console.log('Account setup result:', { data, error });

      if (error) throw error;

      const result = data as { success: boolean; message: string };

      if (!result.success) {
        throw new Error(result.message);
      }

      setAccountCreated(true);
      toast({
        title: "Account Created",
        description: "Your account has been created successfully! You can now sign in.",
      });

      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (error: any) {
      console.error('Account setup error:', error);
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { loading, accountCreated, handleSetupAccount };
};
