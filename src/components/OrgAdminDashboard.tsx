
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import OrgAdminNavigation from './org-admin/OrgAdminNavigation';
import OrganizationUsersTable from './org-admin/OrganizationUsersTable';
import UserRequestsTable from './org-admin/UserRequestsTable';
import ScacManagement from './ScacManagement';
import PortManagement from './admin/PortManagement';
import RateAreaManagement from './admin/RateAreaManagement';
import PortRegionManagement from './admin/PortRegionManagement';
import { useOrgAdminData } from '@/hooks/useOrgAdminData';

interface OrgAdminDashboardProps {
  onBack: () => void;
}

type AdminView = 'overview' | 'users' | 'requests' | 'scac' | 'ports' | 'rate-areas' | 'port-regions';

const OrgAdminDashboard = ({ onBack }: OrgAdminDashboardProps) => {
  const [currentView, setCurrentView] = useState<AdminView>('overview');
  const {
    users,
    requests,
    loading,
    updateUserRole,
    approveRequest,
    denyRequest,
    currentUser
  } = useOrgAdminData(onBack);

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return (
          <OrganizationUsersTable
            data={users}
            onUpdateRole={updateUserRole}
            loading={loading}
          />
        );
      case 'requests':
        return (
          <UserRequestsTable
            data={requests}
            onApproveRequest={approveRequest}
            onDenyRequest={denyRequest}
            loading={loading}
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
          <OrgAdminNavigation
            onUsersClick={() => setCurrentView('users')}
            onRequestsClick={() => setCurrentView('requests')}
            onScacClick={() => setCurrentView('scac')}
            onPortsClick={() => setCurrentView('ports')}
            onRateAreasClick={() => setCurrentView('rate-areas')}
            onPortRegionsClick={() => setCurrentView('port-regions')}
            usersCount={users.length}
            pendingRequestsCount={requests.filter(r => r.status === 'pending').length}
          />
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
