import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import UserRequestForm from '@/components/auth/UserRequestForm';
import OrganizationRequestForm from '@/components/auth/OrganizationRequestForm';
interface AuthProps {
  onSuccess: () => void;
}
const Auth = ({
  onSuccess
}: AuthProps) => {
  const {
    toast
  } = useToast();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(true);
  const [showOrgRegistration, setShowOrgRegistration] = useState(false);

  // Load organizations immediately on mount
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        console.log('Loading organizations...');
        const {
          data,
          error
        } = await supabase.from('organizations').select('id, name').order('name');
        if (error) {
          console.error('Error loading organizations:', error);
          throw error;
        }
        console.log('Organizations loaded:', data);
        setOrganizations(data || []);
      } catch (error: any) {
        console.error('Error loading organizations:', error);
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive"
        });
      } finally {
        setOrganizationsLoading(false);
      }
    };
    loadOrganizations();
  }, [toast]);
  const handleShowOrgRegistration = () => {
    setShowOrgRegistration(true);
  };
  const handleBackToUserRequest = () => {
    setShowOrgRegistration(false);
  };
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">PortCast</CardTitle>
          <p className="text-gray-600">HHG Ocean Freight Consolidation Portal</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Request Access</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm onSuccess={onSuccess} />
            </TabsContent>

            <TabsContent value="register">
              {!showOrgRegistration ? <UserRequestForm organizations={organizations} organizationsLoading={organizationsLoading} onShowOrgRegistration={handleShowOrgRegistration} /> : <OrganizationRequestForm onBackToUserRequest={handleBackToUserRequest} />}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
};
export default Auth;