
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useTokenValidation = (token: string | null) => {
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidatingToken(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      console.log('Validating token:', token);
      
      const { data, error } = await supabase
        .from('account_setup_tokens')
        .select('*')
        .eq('token', token)
        .single();

      console.log('Token validation result:', { data, error });

      if (error) {
        console.error('Token validation error:', error);
        setTokenValid(false);
      } else if (!data) {
        console.error('No token data found');
        setTokenValid(false);
      } else {
        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        
        console.log('Token expiry check:', { now, expiresAt, expired: expiresAt < now });
        
        if (expiresAt < now) {
          console.error('Token has expired');
          setTokenValid(false);
        } else if (data.used_at) {
          console.error('Token has already been used');
          setTokenValid(false);
        } else {
          console.log('Token is valid');
          setTokenValid(true);
          setTokenData(data);
        }
      }
    } catch (error) {
      console.error('Unexpected error validating token:', error);
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  return { validatingToken, tokenValid, tokenData };
};
