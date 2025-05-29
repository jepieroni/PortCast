
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';

interface AdminAccessCheckProps {
  onBack: () => void;
  children: React.ReactNode;
}

const AdminAccessCheck = ({ onBack, children }: AdminAccessCheckProps) => {
  const { currentUser, userRole, loading, assignGlobalAdminToSelf } = useAdminAccess(onBack);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have global admin role, show the self-assignment option
  if (userRole !== 'global_admin') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-600" size={24} />
              Admin Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              You need Global Admin privileges to access this area. If you're the first user of this system, 
              you can assign yourself the Global Admin role.
            </p>
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="text-amber-800 text-sm">
                <strong>Note:</strong> Only assign yourself Global Admin privileges if you are authorized 
                to manage this PortCast system. This role grants full administrative access.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={assignGlobalAdminToSelf} variant="default">
                Assign Global Admin to Myself
              </Button>
              <Button onClick={onBack} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has global admin role, show the admin content
  return <>{children}</>;
};

export default AdminAccessCheck;
