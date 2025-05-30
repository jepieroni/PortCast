
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useScacManagement } from '@/hooks/useScacManagement';
import { TspTable } from './scac/TspTable';
import { ClaimsManagement } from './scac/ClaimsManagement';

interface ScacManagementProps {
  onBack: () => void;
  isGlobalAdmin: boolean;
}

const ScacManagement = ({ onBack, isGlobalAdmin }: ScacManagementProps) => {
  const {
    tsps,
    selectedTsps,
    loading,
    submitting,
    claims,
    organizationId,
    fetchData,
    handleTspSelection,
    submitClaim,
    handleClaimAction,
    isClaimable
  } = useScacManagement(isGlobalAdmin);

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SCAC data...</p>
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
        <h2 className="text-2xl font-bold">SCAC Management</h2>
        <Badge variant="default">
          <Building2 size={16} className="mr-1" />
          {isGlobalAdmin ? 'GLOBAL ADMIN' : 'ORG ADMIN'}
        </Badge>
      </div>

      {isGlobalAdmin && (
        <ClaimsManagement 
          claims={claims} 
          onClaimAction={handleClaimAction} 
        />
      )}

      <TspTable
        tsps={tsps}
        selectedTsps={selectedTsps}
        organizationId={organizationId}
        isGlobalAdmin={isGlobalAdmin}
        submitting={submitting}
        onTspSelection={handleTspSelection}
        onSubmitClaim={submitClaim}
        isClaimable={isClaimable}
      />
    </div>
  );
};

export default ScacManagement;
