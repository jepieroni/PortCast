
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import ScacManagement from './ScacManagement';
import { useOrgAdminData } from '@/hooks/useOrgAdminData';
import { OrganizationUsersTable } from './org-admin/OrganizationUsersTable';
import { UserRequestsTable } from './org-admin/UserRequestsTable';
import { OrgAdminNavigation } from './org-admin/OrgAdminNavigation';

interface OrgAdminDashboardProps {
  onBack: () => void;
}

type OrgAdminView = 'dashboard' | 'scac';

const OrgAdminDashboard = ({ onBack }: OrgAdminDashboardProps) => {
  const [currentView, setCurrentView] = useState<OrgAdminView>('dashboard');
  const {
    orgUsers,
    userRequests,
    loading,
    fetchOrganizationData,
    updateUserRole,
    handleUserRequestAction
  } = useOrgAdminData();

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchOrganizationData();
    }
  }, [currentView]);

  if (currentView === 'scac') {
    return <ScacManagement onBack={() => setCurrentView('dashboard')} isGlobalAdmin={false} />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Organization Admin Dashboard</h2>
        <Badge variant="default">ORG ADMIN</Badge>
      </div>

      <OrgAdminNavigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

      <div className="grid md:grid-cols-2 gap-6">
        <OrganizationUsersTable 
          orgUsers={orgUsers} 
          onUpdateUserRole={updateUserRole} 
        />
        <UserRequestsTable 
          userRequests={userRequests} 
          onHandleUserRequestAction={handleUserRequestAction} 
        />
      </div>
    </div>
  );
};

export default OrgAdminDashboard;
