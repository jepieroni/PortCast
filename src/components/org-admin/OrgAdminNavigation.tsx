
import { Button } from '@/components/ui/button';
import { Users, Building2 } from 'lucide-react';

type OrgAdminView = 'dashboard' | 'scac';

interface OrgAdminNavigationProps {
  currentView: OrgAdminView;
  onViewChange: (view: OrgAdminView) => void;
}

export const OrgAdminNavigation = ({ currentView, onViewChange }: OrgAdminNavigationProps) => {
  return (
    <div className="flex gap-2 mb-6">
      <Button 
        variant={currentView === 'dashboard' ? 'default' : 'outline'}
        onClick={() => onViewChange('dashboard')}
      >
        <Users size={16} className="mr-2" />
        Users & Requests
      </Button>
      <Button 
        variant={currentView === 'scac' ? 'default' : 'outline'}
        onClick={() => onViewChange('scac')}
      >
        <Building2 size={16} className="mr-2" />
        SCAC Management
      </Button>
    </div>
  );
};
