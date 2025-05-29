
import { useState } from 'react';
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

const Auth = ({ onSuccess }: AuthProps) => {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationsLoaded, setOrganizationsLoaded] = useState(false);
  const [showOrgRegistration, setShowOrgRegistration] = useState(false);

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

  const handleShowOrgRegistration = () => {
    setShowOrgRegistration(true);
  };

  const handleBackToUserRequest = () => {
    setShowOrgRegistration(false);
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
              <LoginForm onSuccess={onSuccess} />
            </TabsContent>

            <TabsContent value="register">
              {!showOrgRegistration ? (
                <UserRequestForm 
                  organizations={organizations}
                  onShowOrgRegistration={handleShowOrgRegistration}
                />
              ) : (
                <OrganizationRequestForm 
                  onBackToUserRequest={handleBackToUserRequest}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
