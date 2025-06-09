
import React from 'react';
import MainDashboard from './MainDashboard';
import ShipmentRegistration from './ShipmentRegistration';
import AdminDashboard from './AdminDashboard';
import OrgAdminDashboard from './OrgAdminDashboard';
import ConsolidationDashboard from './ConsolidationDashboard';
import ShipmentsDashboard from './ShipmentsDashboard';
import ConsolidationMainDashboard from './ConsolidationMainDashboard';
import ConsolidationDetails from './ConsolidationDetails';
import { useAuth } from '@/hooks/useAuth';

export type ViewType = 'main' | 'shipments' | 'consolidation' | 'inbound' | 'outbound' | 'intertheater' | 'registration' | 'admin' | 'consolidation-details';

interface ViewRouterProps {
  currentView: ViewType;
  outlookDays: number[];
  onOutlookDaysChange: (days: number[]) => void;
  onNavigate: (view: ViewType, params?: any) => void;
  onBack: () => void;
  onAddShipment: () => void;
  consolidationParams?: {
    type: 'inbound' | 'outbound' | 'intertheater';
    poeId: string;
    poeName: string;
    poeCode: string;
    podId: string;
    podName: string;
    podCode: string;
  };
}

const ViewRouter = ({ 
  currentView, 
  outlookDays, 
  onOutlookDaysChange, 
  onNavigate, 
  onBack, 
  onAddShipment, 
  consolidationParams 
}: ViewRouterProps) => {
  const { isGlobalAdmin, isOrgAdmin } = useAuth();

  const handleTabChange = (tab: string) => {
    onNavigate(tab as ViewType);
  };

  const goToConsolidationMain = () => onNavigate('consolidation');

  const handleConsolidationCardClick = (type: 'inbound' | 'outbound' | 'intertheater', cardData: any) => {
    onNavigate('consolidation-details', {
      type,
      poeId: cardData.poe_id,
      poeName: cardData.poe_name,
      poeCode: cardData.poe_code,
      podId: cardData.pod_id,
      podName: cardData.pod_name,
      podCode: cardData.pod_code
    });
  };

  switch (currentView) {
    case 'main':
      return (
        <MainDashboard
          onCardClick={(cardId) => onNavigate(cardId as ViewType)}
        />
      );
    case 'shipments':
      return <ShipmentsDashboard onBack={onBack} onAddShipment={onAddShipment} />;
    case 'consolidation':
      return (
        <ConsolidationMainDashboard
          onCardClick={(cardId) => onNavigate(cardId as ViewType)}
          onBack={onBack}
        />
      );
    case 'inbound':
      return (
        <ConsolidationDashboard
          type="inbound"
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
          onBack={goToConsolidationMain}
          onTabChange={handleTabChange}
          onCardClick={(cardData) => handleConsolidationCardClick('inbound', cardData)}
        />
      );
    case 'outbound':
      return (
        <ConsolidationDashboard
          type="outbound"
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
          onBack={goToConsolidationMain}
          onTabChange={handleTabChange}
          onCardClick={(cardData) => handleConsolidationCardClick('outbound', cardData)}
        />
      );
    case 'intertheater':
      return (
        <ConsolidationDashboard
          type="intertheater"
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
          onBack={goToConsolidationMain}
          onTabChange={handleTabChange}
          onCardClick={(cardData) => handleConsolidationCardClick('intertheater', cardData)}
        />
      );
    case 'consolidation-details':
      if (!consolidationParams) return null;
      return (
        <ConsolidationDetails
          type={consolidationParams.type}
          poeId={consolidationParams.poeId}
          poeName={consolidationParams.poeName}
          poeCode={consolidationParams.poeCode}
          podId={consolidationParams.podId}
          podName={consolidationParams.podName}
          podCode={consolidationParams.podCode}
          outlookDays={outlookDays}
          onOutlookDaysChange={onOutlookDaysChange}
          onBack={() => onNavigate(consolidationParams.type)}
        />
      );
    case 'registration':
      return (
        <ShipmentRegistration 
          onBack={() => onNavigate('shipments')} 
          onSuccess={() => onNavigate('shipments')}
        />
      );
    case 'admin':
      // Route to appropriate admin dashboard based on user role
      if (isGlobalAdmin) {
        return <AdminDashboard onBack={onBack} />;
      } else if (isOrgAdmin) {
        return <OrgAdminDashboard onBack={onBack} />;
      } else {
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
