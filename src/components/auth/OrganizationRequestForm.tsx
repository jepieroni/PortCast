
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Captcha } from '@/components/ui/captcha';
import { useToast } from '@/hooks/use-toast';
import { STATE_OPTIONS } from '@/constants/stateOptions';
import { 
  checkExistingUser, 
  checkExistingOrganization, 
  submitOrganizationRequest, 
  OrganizationFormData 
} from '@/utils/organizationApi';

interface OrganizationRequestFormProps {
  onBackToUserRequest: () => void;
}

const OrganizationRequestForm = ({ onBackToUserRequest }: OrganizationRequestFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [orgFormData, setOrgFormData] = useState<OrganizationFormData>({
    organizationName: '',
    city: '',
    state: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '' // Keep for compatibility but won't be used
  });

  const handleOrganizationRequest = async (e: React.FormEvent) => {
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
      setCaptchaValid(false);
      onBackToUserRequest();
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
    <form onSubmit={handleOrganizationRequest} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Register Organization</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onBackToUserRequest}
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
          <Select
            value={orgFormData.state}
            onValueChange={(value) => handleOrgFormChange('state', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {STATE_OPTIONS.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      
      <Captcha 
        onValidationChange={setCaptchaValid}
        className="space-y-2"
      />
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || !captchaValid}
      >
        {loading ? 'Submitting Request...' : 'Submit Organization Request'}
      </Button>
    </form>
  );
};

export default OrganizationRequestForm;
