
import { useSearchParams } from 'react-router-dom';
import { useTokenValidation } from '@/hooks/useTokenValidation';
import { useAccountSetup } from '@/hooks/useAccountSetup';
import TokenValidatingCard from '@/components/account-setup/TokenValidatingCard';
import InvalidTokenCard from '@/components/account-setup/InvalidTokenCard';
import AccountCreatedCard from '@/components/account-setup/AccountCreatedCard';
import AccountSetupForm from '@/components/account-setup/AccountSetupForm';

const AccountSetup = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { validatingToken, tokenValid, tokenData } = useTokenValidation(token);
  const { loading, accountCreated, handleSetupAccount } = useAccountSetup();

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
