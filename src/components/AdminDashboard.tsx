
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import AdminAccessCheck from './AdminAccessCheck';
import AdminStats from './AdminStats';
import RoleAssignment from './RoleAssignment';

interface AdminDashboardProps {
  onBack: () => void;
}

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { currentUser, userRole, loading, assignGlobalAdminToSelf } = useAdminAccess(onBack);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Global Admin Dashboard</h2>
        <Badge variant="destructive">ADMIN ACCESS</Badge>
      </div>

      <AdminAccessCheck 
        userRole={userRole}
        onAssignGlobalAdmin={assignGlobalAdminToSelf}
        loading={loading}
      />

      {userRole === 'global_admin' && (
        <>
          <AdminStats />
          <RoleAssignment currentUser={currentUser} />
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
