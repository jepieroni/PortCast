import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import OrganizationRegistration from './OrganizationRegistration';

interface AuthProps {
  onSuccess: () => void;
}

interface Organization {
  id: string;
  name: string;
  trusted_agent_email?: string;
}

const Auth = ({ onSuccess }: AuthProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showOrgRegistration, setShowOrgRegistration] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organizationId: ''
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, trusted_agent_email')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
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
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    // Check if there's a pending request
    const { data: requestData, error: requestError } = await supabase
      .from('user_requests')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle();

    if (requestError && requestError.code !== 'PGRST116') {
      throw requestError;
    }

    if (requestData) {
      throw new Error('A signup request for this email address is already pending approval. Please wait for the current request to be reviewed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!formData.organizationId) {
          throw new Error('Please select an organization');
        }

        // Check for existing user or pending request
        await checkExistingUser(formData.email);

        // Get the selected organization to find the trusted agent
        const selectedOrg = organizations.find(org => org.id === formData.organizationId);

        // Create a user request instead of directly creating a user
        const { error } = await supabase
          .from('user_requests')
          .insert({
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            password_hash: formData.password, // In production, this should be properly hashed
            organization_id: formData.organizationId
          });

        if (error) throw error;

        // Send notification email to trusted agent
        const { error: emailError } = await supabase.functions.invoke('send-approval-request', {
          body: {
            organizationId: formData.organizationId,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email
          }
        });

        if (emailError) {
          console.error('Failed to send approval email:', emailError);
        }

        const trustedAgentInfo = selectedOrg?.trusted_agent_email 
          ? `Your organization's Trusted Agent (${selectedOrg.trusted_agent_email}) has been notified.` 
          : 'Your organization\'s Trusted Agent has been notified.';

        toast({
          title: "Request Submitted",
          description: `Your signup request has been sent for approval. ${trustedAgentInfo} Please remind them to check their junk/spam folder for the authorization email. You'll receive an email when your request is reviewed.`,
        });

        // Reset form and switch back to sign-in
        setFormData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          organizationId: ''
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) throw error;

        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        });
        onSuccess();
      }
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

  if (showOrgRegistration) {
    return <OrganizationRegistration onBack={() => setShowOrgRegistration(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {isSignUp ? 'Request Account Access' : 'Sign In to PortCast'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization *</Label>
                  <Select
                    value={formData.organizationId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
                    required
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
                  <p className="text-sm text-gray-600">
                    Don't see your organization?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => setShowOrgRegistration(true)}
                    >
                      Register a new organization
                    </Button>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Loading...' : (isSignUp ? 'Submit Request' : 'Sign In')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need access? Request account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
