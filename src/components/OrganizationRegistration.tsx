import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationRegistrationProps {
  onBack: () => void;
}

const VALID_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
];

const OrganizationRegistration = ({ onBack }: OrganizationRegistrationProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stateError, setStateError] = useState('');
  const [formData, setFormData] = useState({
    organizationName: '',
    city: '',
    state: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const validateState = (stateValue: string) => {
    if (!stateValue) {
      setStateError('');
      return true;
    }
    
    const upperState = stateValue.toUpperCase();
    if (!VALID_STATE_CODES.includes(upperState)) {
      setStateError('Please enter a valid 2-letter US state code (e.g., CA, NY, TX)');
      return false;
    }
    
    setStateError('');
    return true;
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, state: value }));
    validateState(value);
  };

  const checkExistingOrganization = async (name: string) => {
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', name)
      .maybeSingle();

    if (orgError && orgError.code !== 'PGRST116') {
      throw orgError;
    }

    if (orgData) {
      throw new Error('An organization with this name already exists.');
    }

    // Check if there's a pending organization request
    const { data: requestData, error: requestError } = await supabase
      .from('organization_requests')
      .select('id, status')
      .eq('organization_name', name)
      .eq('status', 'pending')
      .maybeSingle();

    if (requestError && requestError.code !== 'PGRST116') {
      throw requestError;
    }

    if (requestData) {
      throw new Error('A registration request for this organization name is already pending approval.');
    }
  };

  const checkExistingUser = async (email: string) => {
    // Check if user already exists in profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    if (profileData) {
      throw new Error('An account with this email address already exists.');
    }

    // Check if there's a pending user request
    const { data: userRequestData, error: userRequestError } = await supabase
      .from('user_requests')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (userRequestError && userRequestError.code !== 'PGRST116') {
      throw userRequestError;
    }

    if (userRequestData) {
      throw new Error('A signup request for this email address is already pending approval.');
    }

    // Check if there's a pending organization request with the same email
    const { data: orgRequestData, error: orgRequestError } = await supabase
      .from('organization_requests')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (orgRequestError && orgRequestError.code !== 'PGRST116') {
      throw orgRequestError;
    }

    if (orgRequestData) {
      throw new Error('An organization registration request for this email address is already pending approval.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.organizationName || !formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      // Validate state if provided
      if (formData.state && !validateState(formData.state)) {
        throw new Error('Please enter a valid 2-letter US state code');
      }

      // Check for existing organization and user
      await checkExistingOrganization(formData.organizationName);
      await checkExistingUser(formData.email);

      // Create organization registration request
      const { error } = await supabase
        .from('organization_requests')
        .insert({
          organization_name: formData.organizationName,
          city: formData.city || null,
          state: formData.state || null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password_hash: formData.password // In production, this should be properly hashed
        });

      if (error) throw error;

      // Send notification email to global admins
      const { error: emailError } = await supabase.functions.invoke('send-organization-approval-request', {
        body: {
          organizationName: formData.organizationName,
          city: formData.city,
          state: formData.state,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email
        }
      });

      if (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      toast({
        title: "Request Submitted",
        description: "Your organization registration request has been submitted for approval. Global administrators have been notified and you'll receive an email when your request is reviewed.",
      });

      // Reset form and go back
      setFormData({
        organizationName: '',
        city: '',
        state: '',
        firstName: '',
        lastName: '',
        email: '',
        password: ''
      });
      setStateError('');
      onBack();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Register New Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name *</Label>
              <Input
                id="organizationName"
                value={formData.organizationName}
                onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={handleStateChange}
                  placeholder="CA"
                  maxLength={2}
                  className={stateError ? 'border-red-500' : ''}
                />
                {stateError && (
                  <p className="text-sm text-red-600">{stateError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !!stateError}>
              {isLoading ? 'Submitting...' : 'Submit Registration Request'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onBack}
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationRegistration;
