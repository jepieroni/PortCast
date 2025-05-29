
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateState } from '@/utils/organizationValidation';
import { 
  checkExistingOrganization, 
  checkExistingUser, 
  submitOrganizationRequest,
  type OrganizationFormData 
} from '@/utils/organizationApi';

export const useOrganizationForm = (onBack: () => void) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stateError, setStateError] = useState('');
  const [formData, setFormData] = useState<OrganizationFormData>({
    organizationName: '',
    city: '',
    state: '',
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const handleStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, state: value }));
    
    const { error } = validateState(value);
    setStateError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.organizationName || !formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        throw new Error('Please fill in all required fields');
      }

      // Validate state if provided
      if (formData.state) {
        const { isValid } = validateState(formData.state);
        if (!isValid) {
          throw new Error('Please enter a valid 2-letter US state code');
        }
      }

      // Check for existing organization and user
      await checkExistingOrganization(formData.organizationName);
      await checkExistingUser(formData.email);

      // Submit the organization request
      await submitOrganizationRequest(formData);

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

  return {
    formData,
    setFormData,
    stateError,
    isLoading,
    handleStateChange,
    handleSubmit
  };
};
