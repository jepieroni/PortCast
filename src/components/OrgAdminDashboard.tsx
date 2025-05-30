
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { useOrgAdminData } from '@/hooks/useOrgAdminData';
import { useScacManagement } from '@/hooks/useScacManagement';
import { OrganizationUsersTable } from './org-admin/OrganizationUsersTable';
import { UserRequestsTable } from './org-admin/UserRequestsTable';
import { OrgAdminNavigation } from './org-admin/OrgAdminNavigation';
import { TspTable } from './scac/TspTable';

interface OrgAdminDashboardProps {
  onBack: () => void;
}

type OrgAdminView = 'dashboard' | 'scac';

const OrgAdminDashboard = ({ onBack }: OrgAdminDashboardProps) => {
  const [currentView, setCurrentView] = useState<OrgAdminView>('dashboard');
  const {
    orgUsers,
    userRequests,
    loading: orgDataLoading,
    fetchOrganizationData,
    updateUserRole,
    handleUserRequestAction
  } = useOrgAdminData();

  const {
    tsps,
    selectedTsps,
    loading: scacLoading,
    submitting,
    organizationId,
    fetchData: fetchScacData,
    handleTspSelection,
    submitClaim,
    isClaimable
  } = useScacManagement(false); // false because this is org admin, not global admin

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchOrganizationData();
    } else if (currentView === 'scac') {
      fetchScacData();
    }
  }, [currentView]);

  const loading = currentView === 'dashboard' ? orgDataLoading : scacLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {currentView === 'dashboard' ? 'Loading organization data...' : 'Loading SCAC data...'}
          </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentView === 'scac') {
      return (
        <div className="space-y-6">
          <TspTable
            tsps={tsps}
            selectedTsps={selectedTsps}
            organizationId={organizationId}
            isGlobalAdmin={false}
            submitting={submitting}
            onTspSelection={handleTspSelection}
            onSubmitClaim={submitClaim}
            isClaimable={isClaimable}
          />
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-6">
        <OrganizationUsersTable 
          orgUsers={orgUsers} 
          onUpdateUserRole={updateUserRole}
          onRefreshData={fetchOrganizationData}
        />
        <UserRequestsTable 
          userRequests={userRequests} 
          onHandleUserRequestAction={handleUserRequestAction} 
        />
      </div>
    );
  };

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

      {renderContent()}
    </div>
  );
};

export default OrgAdminDashboard;
