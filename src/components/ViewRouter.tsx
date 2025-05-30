
import React from 'react';
import MainDashboard from './MainDashboard';
import ShipmentRegistration from './ShipmentRegistration';
import AdminDashboard from './AdminDashboard';
import OrgAdminDashboard from './OrgAdminDashboard';
import { useAuth } from '@/hooks/useAuth';

export type ViewType = 'main' | 'registration' | 'admin';

interface ViewRouterProps {
  currentView: ViewType;
  outlookDays: number;
  onOutlookDaysChange: (days: number) => void;
  onNavigate: (view: ViewType) => void;
  onBack: () => void;
}

const ViewRouter = ({ currentView, outlookDays, onOutlookDaysChange, onNavigate, onBack }: ViewRouterProps) => {
  const { isGlobalAdmin, isOrgAdmin } = useAuth();

  switch (currentView) {
    case 'main':
      return (
        <MainDashboard
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
        />
      );
    case 'registration':
      return <ShipmentRegistration onBack={onBack} />;
    case 'admin':
      // Route to appropriate admin dashboard based on user role
      if (isGlobalAdmin) {
        return <AdminDashboard onBack={onBack} />;
      } else if (isOrgAdmin) {
        return <OrgAdminDashboard onBack={onBack} />;
      } else {
        // This shouldn't happen since the Admin button shouldn't show for non-admins
        // But as a fallback, redirect to main
        onBack();
        return null;
      }
    default:
      return (
        <MainDashboard
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
        />
      );
  }
};

export default ViewRouter;
