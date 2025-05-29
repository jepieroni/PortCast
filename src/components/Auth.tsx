
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { checkExistingUser, checkExistingOrganization, submitOrganizationRequest, OrganizationFormData } from '@/utils/organizationApi';

interface AuthProps {
  onSuccess: () => void;
}

const Auth = ({ onSuccess }: AuthProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationsLoaded, setOrganizationsLoaded] = useState(false);
  const [showOrgRegistration, setShowOrgRegistration] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // User request form state (removed password)
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');

  // Organization registration form state (removed password)
  const [orgFormData, setOrgFormData] = useState<OrganizationFormData>({
    organizationName: '',
    city: '',
    state: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '' // Keep for compatibility but won't be used
  });

  const loadOrganizations = async () => {
    if (organizationsLoaded) return;
    
    try {
      console.log('Loading organizations...');
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error loading organizations:', error);
        throw error;
      }
      
      console.log('Organizations loaded:', data);
      setOrganizations(data || []);
      setOrganizationsLoaded(true);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        throw error;
      }

      if (data.user) {
        toast({
          title: "Success",
          description: "Successfully signed in!",
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedOrganization) {
        throw new Error('Please select an organization');
      }

      // Check for existing user/request
      await checkExistingUser(email);

      // Submit request without password
      const { error } = await supabase
        .from('user_requests')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          organization_id: selectedOrganization,
        });

      if (error) {
        if (error.code === '23505') {
          throw new Error('A request with this email already exists');
        }
        throw error;
      }

      toast({
        title: "Request Submitted",
        description: "Your access request has been submitted. You will receive an email with account setup instructions once approved.",
      });

      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setSelectedOrganization('');
    } catch (error: any) {
      console.error('Request access error:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit access request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate organization name
      await checkExistingOrganization(orgFormData.organizationName);
      
      // Check for existing user/request
      await checkExistingUser(orgFormData.email);

      // Submit organization request without password
      await submitOrganizationRequest(orgFormData);

      toast({
        title: "Request Submitted",
        description: "Your organization registration request has been submitted. You will receive an email with account setup instructions once approved.",
      });

      // Reset form and go back to user request
      setOrgFormData({
        organizationName: '',
        city: '',
        state: '',
        firstName: '',
        lastName: '',
        email: '',
        password: ''
      });
      setShowOrgRegistration(false);
    } catch (error: any) {
      console.error('Organization request error:', error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit organization request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrgFormChange = (field: keyof OrganizationFormData, value: string) => {
    setOrgFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">PortCast</CardTitle>
          <p className="text-gray-600">Transportation Management Portal</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register" onClick={loadOrganizations}>Request Access</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">Email</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loading}
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              {!showOrgRegistration ? (
                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Select 
                      value={selectedOrganization} 
                      onValueChange={setSelectedOrganization}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-center mt-3">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => setShowOrgRegistration(true)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        disabled={loading}
                      >
                        <Building2 className="h-4 w-4 mr-1" />
                        Don't see your organization? Register it here
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Submitting Request...' : 'Request Access'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleOrganizationRequest} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Register Organization</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOrgRegistration(false)}
                      disabled={loading}
                    >
                      Back to User Request
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgFormData.organizationName}
                      onChange={(e) => handleOrgFormChange('organizationName', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgCity">City</Label>
                      <Input
                        id="orgCity"
                        value={orgFormData.city}
                        onChange={(e) => handleOrgFormChange('city', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgState">State</Label>
                      <Input
                        id="orgState"
                        value={orgFormData.state}
                        onChange={(e) => handleOrgFormChange('state', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgFirstName">First Name</Label>
                      <Input
                        id="orgFirstName"
                        value={orgFormData.firstName}
                        onChange={(e) => handleOrgFormChange('firstName', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgLastName">Last Name</Label>
                      <Input
                        id="orgLastName"
                        value={orgFormData.lastName}
                        onChange={(e) => handleOrgFormChange('lastName', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="orgEmail">Email</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={orgFormData.email}
                      onChange={(e) => handleOrgFormChange('email', e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Submitting Request...' : 'Submit Organization Request'}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
