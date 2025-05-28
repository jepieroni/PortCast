
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck, Users } from 'lucide-react';

interface AdminAccessCheckProps {
  userRole: string | null;
  onAssignGlobalAdmin: () => void;
  loading: boolean;
}

const AdminAccessCheck = ({ userRole, onAssignGlobalAdmin, loading }: AdminAccessCheckProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Users className="mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-lg text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'global_admin') {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <UserCheck size={20} />
            Initial Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-orange-700 mb-4">
            You need to assign yourself the Global Admin role to access all admin features.
          </p>
          <Button onClick={onAssignGlobalAdmin} className="bg-orange-600 hover:bg-orange-700">
            Assign Global Admin Role to Myself
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default AdminAccessCheck;
