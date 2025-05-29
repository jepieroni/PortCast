
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Captcha } from '@/components/ui/captcha';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkExistingUser } from '@/utils/organizationApi';
import { Building2, Loader2 } from 'lucide-react';

interface UserRequestFormProps {
  organizations: any[];
  organizationsLoading: boolean;
  onShowOrgRegistration: () => void;
}

const UserRequestForm = ({ organizations, organizationsLoading, onShowOrgRegistration }: UserRequestFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaValid) {
      toast({
        title: "Security Check Required",
        description: "Please complete the security check before submitting.",
        variant: "destructive",
      });
      return;
    }

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

      // Get organization name for emails
      const selectedOrg = organizations.find(org => org.id === selectedOrganization);
      const organizationName = selectedOrg?.name || 'Unknown Organization';

      // Send trusted agent notification email
      try {
        const { error: trustedAgentEmailError } = await supabase.functions.invoke('send-approval-request', {
          body: {
            organizationId: selectedOrganization,
            firstName,
            lastName,
            email
          }
        });

        if (trustedAgentEmailError) {
          console.error('Failed to send trusted agent notification:', trustedAgentEmailError);
        } else {
          console.log('Trusted agent notification sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending trusted agent notification:', emailError);
      }

      // Send user acknowledgment email
      try {
        const { error: userAckEmailError } = await supabase.functions.invoke('send-user-request-acknowledgment', {
          body: {
            firstName,
            lastName,
            email,
            organizationName
          }
        });

        if (userAckEmailError) {
          console.error('Failed to send user acknowledgment email:', userAckEmailError);
        } else {
          console.log('User acknowledgment email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending user acknowledgment email:', emailError);
      }

      toast({
        title: "Request Submitted",
        description: "Your access request has been submitted. You will receive an email confirmation shortly, and another email with account setup instructions once approved.",
      });

      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setSelectedOrganization('');
      setCaptchaValid(false);
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

  return (
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
          disabled={loading || organizationsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              organizationsLoading 
                ? "Loading organizations..." 
                : "Select your organization"
            } />
          </SelectTrigger>
          <SelectContent>
            {organizationsLoading ? (
              <SelectItem value="loading" disabled>
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading organizations...
                </div>
              </SelectItem>
            ) : organizations.length === 0 ? (
              <SelectItem value="no-orgs" disabled>
                No organizations available
              </SelectItem>
            ) : (
              organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <div className="text-center mt-3">
          <Button
            type="button"
            variant="link"
            onClick={onShowOrgRegistration}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            <Building2 className="h-4 w-4 mr-1" />
            Don't see your organization? Register it here
          </Button>
        </div>
      </div>
      
      <Captcha 
        onValidationChange={setCaptchaValid}
        className="space-y-2"
      />
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || organizationsLoading || !selectedOrganization || !captchaValid}
      >
        {loading ? 'Submitting Request...' : 'Request Access'}
      </Button>
    </form>
  );
};

export default UserRequestForm;
