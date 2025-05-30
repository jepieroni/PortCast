
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTokenValidation } from '@/hooks/useTokenValidation';
import { useAccountSetup } from '@/hooks/useAccountSetup';
import { supabase } from '@/integrations/supabase/client';
import TokenValidatingCard from '@/components/account-setup/TokenValidatingCard';
import InvalidTokenCard from '@/components/account-setup/InvalidTokenCard';
import AccountCreatedCard from '@/components/account-setup/AccountCreatedCard';
import AccountSetupForm from '@/components/account-setup/AccountSetupForm';

const AccountSetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const { validatingToken, tokenValid, tokenData } = useTokenValidation(token);
  const { loading, accountCreated, handleSetupAccount } = useAccountSetup();

  // Sign out any existing user when arriving at account setup with a valid token
  useEffect(() => {
    const signOutExistingUser = async () => {
      if (token && tokenValid) {
        try {
          // Check if there's a current session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Existing session detected during account setup, signing out...');
            await supabase.auth.signOut();
          }
        } catch (error) {
          console.error('Error signing out existing user:', error);
        }
      }
    };

    signOutExistingUser();
  }, [token, tokenValid]);

  const onFormSubmit = (password: string, confirmPassword: string) => {
    if (token) {
      handleSetupAccount(token, password, confirmPassword);
    }
  };

  if (validatingToken) {
    return <TokenValidatingCard />;
  }

  if (!tokenValid) {
    return <InvalidTokenCard />;
  }

  if (accountCreated) {
    return <AccountCreatedCard />;
  }

  return (
    <AccountSetupForm
      tokenData={tokenData}
      loading={loading}
      onSubmit={onFormSubmit}
    />
  );
};

export default AccountSetup;
