
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { OrgAdminNavigation } from './org-admin/OrgAdminNavigation';
import { OrganizationUsersTable } from './org-admin/OrganizationUsersTable';
import { UserRequestsTable } from './org-admin/UserRequestsTable';
import ScacManagement from './ScacManagement';
import PortManagement from './admin/PortManagement';
import RateAreaManagement from './admin/RateAreaManagement';
import PortRegionManagement from './admin/PortRegionManagement';
import { useOrgAdminData } from '@/hooks/useOrgAdminData';

interface OrgAdminDashboardProps {
  onBack: () => void;
}

type OrgAdminView = 'overview' | 'users' | 'requests' | 'scac' | 'ports' | 'rate-areas' | 'port-regions';

const OrgAdminDashboard = ({ onBack }: OrgAdminDashboardProps) => {
  const [currentView, setCurrentView] = useState<OrgAdminView>('overview');
  const {
    orgUsers,
    userRequests,
    loading,
    fetchOrganizationData,
    updateUserRole,
    handleUserRequestAction
  } = useOrgAdminData();

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const handleViewChange = (view: OrgAdminView) => {
    setCurrentView(view);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return (
          <OrganizationUsersTable
            orgUsers={orgUsers}
            onUpdateUserRole={updateUserRole}
            onRefreshData={fetchOrganizationData}
          />
        );
      case 'requests':
        return (
          <UserRequestsTable
            userRequests={userRequests}
            onHandleUserRequestAction={handleUserRequestAction}
          />
        );
      case 'scac':
        return <ScacManagement onBack={() => setCurrentView('overview')} isGlobalAdmin={false} />;
      case 'ports':
        return <PortManagement onBack={() => setCurrentView('overview')} />;
      case 'rate-areas':
        return <RateAreaManagement onBack={() => setCurrentView('overview')} />;
      case 'port-regions':
        return <PortRegionManagement onBack={() => setCurrentView('overview')} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3"
              onClick={() => handleViewChange('users')}
            >
              <div className="text-lg font-medium">Manage Users</div>
              <div className="text-sm text-gray-600">View and manage organization users</div>
            </Button>
            
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3"
              onClick={() => handleViewChange('requests')}
            >
              <div className="text-lg font-medium">User Requests</div>
              <div className="text-sm text-gray-600">Review pending user access requests</div>
            </Button>
            
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3"
              onClick={() => handleViewChange('scac')}
            >
              <div className="text-lg font-medium">SCAC Management</div>
              <div className="text-sm text-gray-600">Manage SCAC codes and claims</div>
            </Button>
            
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3"
              onClick={() => handleViewChange('ports')}
            >
              <div className="text-lg font-medium">Port Management</div>
              <div className="text-sm text-gray-600">Manage ports and their assignments</div>
            </Button>
            
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3"
              onClick={() => handleViewChange('rate-areas')}
            >
              <div className="text-lg font-medium">Rate Areas</div>
              <div className="text-sm text-gray-600">Manage rate area definitions</div>
            </Button>
            
            <Button
              variant="outline"
              className="p-6 h-auto flex flex-col items-center gap-3"
              onClick={() => handleViewChange('port-regions')}
            >
              <div className="text-lg font-medium">Port Regions</div>
              <div className="text-sm text-gray-600">Manage port region groupings</div>
            </Button>
          </div>
        );
    }
  };

  if (currentView === 'overview') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold">Organization Admin Dashboard</h2>
          <Badge variant="secondary">ORG ADMIN</Badge>
        </div>

        {renderContent()}
      </div>
    );
  }

  return renderContent();
};

export default OrgAdminDashboard;
