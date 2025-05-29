
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import AdminAccessCheck from './AdminAccessCheck';
import AdminStats from './AdminStats';
import UserManagement from './UserManagement';
import OrganizationManagement from './OrganizationManagement';
import AccessRequestManagement from './AccessRequestManagement';
import { useAdminAccess } from '@/hooks/useAdminAccess';

interface AdminDashboardProps {
  onBack: () => void;
}

type AdminView = 'dashboard' | 'users' | 'organizations' | 'requests';

const AdminDashboard = ({ onBack }: AdminDashboardProps) => {
  const { currentUser } = useAdminAccess(onBack);
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return <UserManagement onBack={() => setCurrentView('dashboard')} />;
      case 'organizations':
        return <OrganizationManagement onBack={() => setCurrentView('dashboard')} />;
      case 'requests':
        return <AccessRequestManagement onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <AdminStats
            onUserManagement={() => setCurrentView('users')}
            onOrganizationManagement={() => setCurrentView('organizations')}
            onAccessRequestManagement={() => setCurrentView('requests')}
          />
        );
    }
  };

  if (currentView === 'dashboard') {
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

        <AdminAccessCheck onBack={onBack}>
          {renderContent()}
        </AdminAccessCheck>
      </div>
    );
  }

  return (
    <AdminAccessCheck onBack={onBack}>
      {renderContent()}
    </AdminAccessCheck>
  );
};

export default AdminDashboard;
