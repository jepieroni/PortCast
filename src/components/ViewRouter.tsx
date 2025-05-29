
import ShipmentRegistration from '@/components/ShipmentRegistration';
import AdminDashboard from '@/components/AdminDashboard';
import MainDashboard from '@/components/MainDashboard';
import ConsolidationDashboard from '@/components/ConsolidationDashboard';
import { ViewType } from '@/hooks/useNavigation';

interface ViewRouterProps {
  currentView: ViewType;
  outlookDays: number[];
  onOutlookDaysChange: (days: number[]) => void;
  onNavigate: (view: ViewType) => void;
  onBack: () => void;
}

const ViewRouter = ({ 
  currentView, 
  outlookDays, 
  onOutlookDaysChange, 
  onNavigate, 
  onBack 
}: ViewRouterProps) => {
  if (currentView === 'main') {
    return <MainDashboard onCardClick={(cardId) => onNavigate(cardId as ViewType)} />;
  }

  if (currentView === 'registration') {
    return <ShipmentRegistration onBack={onBack} />;
  }

  if (currentView === 'admin') {
    return <AdminDashboard onBack={onBack} />;
  }

  if (currentView === 'inbound' || currentView === 'outbound' || currentView === 'intertheater') {
    return (
      <ConsolidationDashboard
        type={currentView}
        outlookDays={outlookDays}
        onOutlookDaysChange={onOutlookDaysChange}
        onBack={onBack}
        onTabChange={(tab) => onNavigate(tab as ViewType)}
      />
    );
  }

  return null;
};

export default ViewRouter;
