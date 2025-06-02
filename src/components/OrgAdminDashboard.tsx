
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, UserCheck, Building2, Anchor, Globe2, MapPin } from 'lucide-react';
import { useOrgAdminData } from '@/hooks/useOrgAdminData';
import { OrganizationUsersTable } from './org-admin/OrganizationUsersTable';
import { UserRequestsTable } from './org-admin/UserRequestsTable';
import ScacManagement from './ScacManagement';
import PortManagement from './admin/PortManagement';
import RateAreaManagement from './admin/RateAreaManagement';
import PortRegionManagement from './admin/PortRegionManagement';

interface OrgAdminDashboardProps {
  onBack: () => void;
}

type OrgAdminView = 'dashboard' | 'users' | 'requests' | 'scac' | 'ports' | 'rate-areas' | 'port-regions';

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
    fetchOrganizationData();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Organization Users</h2>
            </div>
            <OrganizationUsersTable 
              users={orgUsers} 
              onUpdateRole={updateUserRole}
              loading={loading}
            />
          </div>
        );
      case 'requests':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setCurrentView('dashboard')}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Access Requests</h2>
            </div>
            <UserRequestsTable 
              requests={userRequests} 
              onApproveRequest={(id) => handleUserRequestAction(id, 'approve')}
              onDenyRequest={(id) => handleUserRequestAction(id, 'deny')}
              loading={loading}
            />
          </div>
        );
      case 'scac':
        return <ScacManagement onBack={() => setCurrentView('dashboard')} isGlobalAdmin={false} />;
      case 'ports':
        return <PortManagement onBack={() => setCurrentView('dashboard')} />;
      case 'rate-areas':
        return <RateAreaManagement onBack={() => setCurrentView('dashboard')} />;
      case 'port-regions':
        return <PortRegionManagement onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('users')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Organization Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orgUsers.length}</div>
                  <p className="text-xs text-muted-foreground">Active users in organization</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('requests')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userRequests.filter(r => r.status === 'pending').length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('scac')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SCAC Management</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Manage organization SCAC codes</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('ports')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Port Management</CardTitle>
                  <Anchor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Manage ports and regions</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('rate-areas')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rate Areas</CardTitle>
                  <Globe2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Manage rate areas</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentView('port-regions')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Port Regions</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Manage port regions</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

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

      {renderContent()}
    </div>
  );
};

export default OrgAdminDashboard;
