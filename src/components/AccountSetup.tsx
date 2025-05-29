
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AccountSetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountCreated, setAccountCreated] = useState(false);

  const token = searchParams.get('token');

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

  const handleSetupAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validating setup token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Invalid Token</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              This account setup link is invalid or has expired. Please request a new access approval.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accountCreated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-8 w-8" />
              Account Created!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your account has been successfully created. You will be redirected to sign in shortly.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Sign In Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">Set Up Your Account</CardTitle>
          <p className="text-gray-600">
            Welcome, {tokenData?.first_name} {tokenData?.last_name}!
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetupAccount} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={tokenData?.email || ''}
                disabled
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                placeholder="Confirm your password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSetup;
