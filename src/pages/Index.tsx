import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { useNavigation } from '@/hooks/useNavigation';

const Index = () => {
  const location = useLocation();
  const { currentView, outlookDays, setOutlookDays, navigateTo, goToMain } = useNavigation();

  useEffect(() => {
    // Check if we need to navigate to a specific view after coming from edit
    if (location.state?.navigateTo) {
      navigateTo(location.state.navigateTo);
      // Clear the state to prevent repeated navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, navigateTo]);

  return (
    <AppLayout
      currentView={currentView}
      outlookDays={outlookDays}
      onOutlookDaysChange={setOutlookDays}
      onNavigate={navigateTo}
      onBack={goToMain}
      onAddShipment={() => navigateTo('registration')}
    />
  );
};

export default Index;
