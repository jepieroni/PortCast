
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Captcha } from '@/components/ui/captcha';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { STATE_OPTIONS } from '@/constants/stateOptions';
import { 
  checkExistingUser, 
  checkExistingOrganization, 
  submitOrganizationRequest, 
  OrganizationFormData 
} from '@/utils/organizationApi';
import { Loader2 } from 'lucide-react';

interface OrganizationRequestFormProps {
  onBackToUserRequest: () => void;
}

const OrganizationRequestForm = ({ onBackToUserRequest }: OrganizationRequestFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);
  const [progress, setProgress] = useState(0);
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
    setProgress(0);

    try {
      // Progress: Starting validation
      setProgress(15);

      // Validate organization name
      await checkExistingOrganization(orgFormData.organizationName);
      
      // Progress: Organization validation complete
      setProgress(30);

      // Check for existing user/request
      await checkExistingUser(orgFormData.email);

      // Progress: User validation complete, submitting request
      setProgress(50);

      // Submit organization request without password
      await submitOrganizationRequest(orgFormData);

      // Progress: Complete
      setProgress(100);

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
      setProgress(0);
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

      {loading && (
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-700 font-medium">Processing your organization request...</span>
          </div>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-blue-600 text-center">
            {progress < 25 && "Validating organization name..."}
            {progress >= 25 && progress < 45 && "Checking user information..."}
            {progress >= 45 && progress < 80 && "Submitting request and sending notifications..."}
            {progress >= 80 && "Finalizing..."}
          </p>
        </div>
      )}
      
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
