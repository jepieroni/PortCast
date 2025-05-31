
import React from 'react';
import MainDashboard from './MainDashboard';
import ShipmentRegistration from './ShipmentRegistration';
import AdminDashboard from './AdminDashboard';
import OrgAdminDashboard from './OrgAdminDashboard';
import ConsolidationDashboard from './ConsolidationDashboard';
import { useAuth } from '@/hooks/useAuth';

export type ViewType = 'main' | 'inbound' | 'outbound' | 'intertheater' | 'registration' | 'admin';

interface ViewRouterProps {
  currentView: ViewType;
  outlookDays: number[];
  onOutlookDaysChange: (days: number[]) => void;
  onNavigate: (view: ViewType) => void;
  onBack: () => void;
}

const ViewRouter = ({ currentView, outlookDays, onOutlookDaysChange, onNavigate, onBack }: ViewRouterProps) => {
  const { isGlobalAdmin, isOrgAdmin } = useAuth();

  const handleTabChange = (tab: string) => {
    onNavigate(tab as ViewType);
  };

  switch (currentView) {
    case 'main':
      return (
        <MainDashboard
          onCardClick={(cardId) => onNavigate(cardId as ViewType)}
        />
      );
    case 'inbound':
      return (
        <ConsolidationDashboard
          type="inbound"
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
          onBack={onBack}
          onTabChange={handleTabChange}
        />
      );
    case 'outbound':
      return (
        <ConsolidationDashboard
          type="outbound"
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
          onBack={onBack}
          onTabChange={handleTabChange}
        />
      );
    case 'intertheater':
      return (
        <ConsolidationDashboard
          type="intertheater"
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
          onBack={onBack}
          onTabChange={handleTabChange}
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
          onCardClick={(cardId) => onNavigate(cardId as ViewType)}
        />
      );
  }
};

export default ViewRouter;
